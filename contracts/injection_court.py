# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *
import genlayer.gl.vm as glvm

VERDICTS = ("developer", "user", "agent", "unforeseeable")


@allow_storage
@dataclass
class Case:
    id: str
    incident_url: str
    agent_config: str
    damage_description: str
    filer: Address
    status: str
    verdict: str
    reasoning: str
    filed_at: str
    resolved_at: str


class InjectionCourt(gl.Contract):
    cases: TreeMap[str, Case]
    case_count: u256

    def __init__(self):
        self.case_count = u256(0)

    def _build_prompt(self, web_data: str, damage_description: str, agent_config: str) -> str:
        return f"""You are adjudicating an AI agent security incident for Injection Court.

INCIDENT
An AI agent visited the URL below and was manipulated by content on that page into taking a
harmful action, causing loss described as: {damage_description}

FETCHED PAGE CONTENT (this is the actual page the agent visited — read it for the injection
attempt):
{web_data}

AGENT CONFIGURATION AS SUBMITTED BY THE FILER
{agent_config}

Your job: assign exactly one verdict from this fixed list. Read the definitions carefully —
they are deliberately narrow so cases are decided the same way by every validator.

- "developer": The agent's own configuration was inadequate for content of this kind. Look
  specifically at instruction_content_separation, user_confirmation_required_for, and
  tool_access_scope against what actually happened. Choose this when a reasonable
  configuration change (e.g. requiring confirmation before this class of action, or not
  granting this tool access at all) would have prevented the harm.

- "user": The configuration was adequate, but the agent was pointed at this URL, or granted
  this level of tool access, in a context a reasonable operator should have recognized as
  risky. Choose this when the failure is in how the agent was deployed or directed, not how
  it was built.

- "agent": The configuration was adequate and the deployment was reasonable, and the injected
  content in the fetched page was not exceptionally sophisticated — a well-built, well-used
  agent could plausibly have resisted it, but this one made an autonomous bad call anyway.
  This is the default when neither "developer" nor "user" fits and the attack itself is not
  extraordinary.

- "unforeseeable": Choose this only when the injected content in the fetched page uses
  techniques a reasonable developer and reasonable user would not have anticipated or
  defended against, regardless of how the agent was built or deployed. This is the narrowest
  category — reserve it for genuinely novel or exceptionally well-disguised attacks, not for
  every successful injection.

Boundary rule between "agent" and "unforeseeable": if you can point to any known, common
prompt-injection technique already used in the fetched page (e.g. plain hidden text,
role-play instructions, fake system messages), that is not unforeseeable — it is at most
"agent". Reserve "unforeseeable" for attacks a reasonable person would call genuinely novel.

Respond in JSON only, no other text:
{{
    "verdict": "developer" | "user" | "agent" | "unforeseeable",
    "reasoning": "2-4 sentences citing specific evidence from the fetched page and the agent
    configuration for why this verdict and not the others."
}}
It is mandatory that you respond only using the JSON format above, nothing else. Don't
include any other words or characters, your output must be only JSON without any formatting
prefix or suffix. This result should be perfectly parsable by a JSON parser without errors.
"""

    @gl.public.write
    def file_case(self, incident_url: str, agent_config: str, damage_description: str) -> str:
        if not incident_url or not incident_url.startswith(("http://", "https://")):
            raise gl.vm.UserError("incident_url must be a non-empty http(s) URL")
        if not agent_config:
            raise gl.vm.UserError("agent_config must not be empty")
        if not damage_description:
            raise gl.vm.UserError("damage_description must not be empty")

        try:
            json.loads(agent_config)
        except (ValueError, TypeError):
            raise gl.vm.UserError("agent_config must be a valid JSON string")

        case_id = f"case_{int(self.case_count):06d}"
        self.case_count = u256(int(self.case_count) + 1)

        case = Case(
            id=case_id,
            incident_url=incident_url,
            agent_config=agent_config,
            damage_description=damage_description,
            filer=gl.message.sender_address,
            status="filed",
            verdict="",
            reasoning="",
            filed_at=str(gl.message.datetime),
            resolved_at="",
        )
        self.cases[case_id] = case
        return case_id

    @gl.public.write
    def investigate(self, case_id: str) -> dict:
        if case_id not in self.cases:
            raise gl.vm.UserError("case not found")

        case = self.cases[case_id]
        if case.status == "resolved":
            raise gl.vm.UserError("case already resolved")

        incident_url = case.incident_url
        damage_description = case.damage_description
        agent_config = case.agent_config

        def leader_fn() -> dict:
            web_data = gl.nondet.web.render(incident_url, mode="text")
            prompt = self._build_prompt(web_data, damage_description, agent_config)
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            if result.get("verdict") not in VERDICTS:
                raise gl.vm.UserError(f"invalid verdict from model: {result.get('verdict')!r}")
            return {"verdict": result["verdict"], "reasoning": str(result.get("reasoning", ""))}

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, glvm.Return):
                return False
            my_result = leader_fn()
            # Equivalence principle: verdict only. Reasoning is intentionally excluded —
            # comparing it would break validator consensus (see docs/CONTRACT_SPEC.md §5).
            return leader_result.calldata["verdict"] == my_result["verdict"]

        result = glvm.run_nondet_unsafe(leader_fn, validator_fn)

        case.status = "resolved"
        case.verdict = result["verdict"]
        case.reasoning = result["reasoning"]
        case.resolved_at = str(gl.message.datetime)

        return {"verdict": result["verdict"], "reasoning": result["reasoning"]}

    @gl.public.view
    def get_case(self, case_id: str) -> dict:
        if case_id not in self.cases:
            raise gl.vm.UserError("case not found")
        case = self.cases[case_id]
        return {
            "id": case.id,
            "incident_url": case.incident_url,
            "agent_config": case.agent_config,
            "damage_description": case.damage_description,
            "filer": case.filer.as_hex,
            "status": case.status,
            "verdict": case.verdict,
            "reasoning": case.reasoning,
            "filed_at": case.filed_at,
            "resolved_at": case.resolved_at,
        }

    @gl.public.view
    def list_cases(self) -> list:
        return [
            {
                "id": case.id,
                "incident_url": case.incident_url,
                "agent_config": case.agent_config,
                "damage_description": case.damage_description,
                "filer": case.filer.as_hex,
                "status": case.status,
                "verdict": case.verdict,
                "reasoning": case.reasoning,
                "filed_at": case.filed_at,
                "resolved_at": case.resolved_at,
            }
            for case in self.cases.values()
        ]
