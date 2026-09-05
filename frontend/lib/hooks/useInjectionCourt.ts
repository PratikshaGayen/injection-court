"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import InjectionCourt from "@/lib/contracts/InjectionCourt";
import { getContractAddress } from "@/lib/genlayer/client";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import type { Case } from "@/lib/contracts/types";

function useContract() {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  return useMemo(() => {
    if (!contractAddress) return null;
    return new InjectionCourt(contractAddress, address);
  }, [contractAddress, address]);
}

/** The public docket. Readable without a wallet. */
export function useCases() {
  const contract = useContract();
  return useQuery<Case[]>({
    queryKey: ["cases"],
    queryFn: async () => (contract ? contract.listCases() : []),
    enabled: !!contract,
    refetchInterval: 30_000,
  });
}

export function useCase(caseId: string | undefined) {
  const contract = useContract();
  return useQuery<Case | null>({
    queryKey: ["case", caseId],
    queryFn: async () => (contract && caseId ? contract.getCase(caseId) : null),
    enabled: !!contract && !!caseId,
  });
}

export function useFileCase() {
  const contract = useContract();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      incidentUrl: string;
      agentConfig: string;
      damageDescription: string;
    }) => {
      if (!contract) throw new Error("Contract address is not configured.");
      return contract.fileCase(
        input.incidentUrl,
        input.agentConfig,
        input.damageDescription
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useInvestigate() {
  const contract = useContract();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseId: string) => {
      if (!contract) throw new Error("Contract address is not configured.");
      return contract.investigate(caseId);
    },
    onSuccess: (_data, caseId) => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["case", caseId] });
    },
  });
}
