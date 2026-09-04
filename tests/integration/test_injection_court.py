"""Integration tests — require GenLayer Studio / localnet running.

Run with: gltest tests/integration/ -v -s
"""

import json

import pytest
from gltest import get_contract_factory
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded

AGENT_CONFIG = json.dumps(
    {
        "instruction_content_separation": False,
        "user_confirmation_required_for": [],
        "tool_access_scope": ["send_payment"],
        "input_trust_boundary": "untrusted_web_content",
        "monitoring_or_alerting": False,
        "system_prompt_excerpt": "You are a helpful autonomous shopping assistant.",
        "additional_context": "Agent reads product pages and can send payments directly.",
    }
)

# A real, stable, publicly reachable page — validators fetch this for real over the
# network, per README.md's "native web access, no oracle" design. Content is plain
# prose (not an actual injection payload); this test only checks that the full
# file -> investigate -> verdict pipeline runs end to end against a live consensus
# round, not which specific verdict a real attack page would earn (that is covered
# per-category with mocks in tests/direct/test_injection_court.py, and with a real
# crafted injected page in the Task 6 demo).
TEST_INCIDENT_URL = "https://raw.githubusercontent.com/genlayerlabs/genlayer-project-boilerplate/main/README.md"

VALID_VERDICTS = {"developer", "user", "agent", "unforeseeable"}


@pytest.mark.integration
def deploy_contract():
    factory = get_contract_factory("InjectionCourt")
    contract = factory.deploy()

    all_cases = contract.list_cases(args=[])
    assert all_cases == []
    return contract


@pytest.mark.integration
def test_file_and_investigate_case_end_to_end():
    contract = load_fixture(deploy_contract)

    file_result = contract.file_case(
        args=[TEST_INCIDENT_URL, AGENT_CONFIG, "Agent sent $1000 to an attacker."],
        wait_interval=10000,
        wait_retries=15,
    )
    assert tx_execution_succeeded(file_result)

    cases = contract.list_cases(args=[])
    assert len(cases) == 1
    case_id = cases[0]["id"]
    assert cases[0]["status"] == "filed"

    investigate_result = contract.investigate(
        args=[case_id],
        wait_interval=10000,
        wait_retries=30,
    )
    assert tx_execution_succeeded(investigate_result)

    case = contract.get_case(args=[case_id])
    assert case["status"] == "resolved"
    assert case["verdict"] in VALID_VERDICTS
    assert case["reasoning"] != ""
