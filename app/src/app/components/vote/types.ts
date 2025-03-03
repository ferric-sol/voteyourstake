"use client"

import { PublicKey } from '@solana/web3.js';

export interface StakeAccountInfo {
  pubkey: string;
  stake: string;
  selected: boolean;
  hasVoted: boolean;
}

export interface ProposalData {
  authority: any; // PublicKey
  proposalId: string;
  title: string;
  description: string;
  yesVotes: string;
  noVotes: string;
  endTime: Date;
  isActive: boolean;
  voteCount: string;
  pubkey: any; // PublicKey
}

export interface SIMDProposal {
  id: string;
  title: string;
  description: string;
  link: string;
}

// Sample SIMD proposals
export const SIMD_PROPOSALS: SIMDProposal[] = [
  {
    id: "SIMD-228",
    title: "Market-based emissions mechanism",
    description: "Proposal to implement a market-based emissions mechanism for the Solana network to incentivize sustainable validator operations.",
    link: "https://forum.solana.com/t/simd-228-market-based-emissions"
  },
  {
    id: "SIMD-123",
    title: "Block rewards distribution",
    description: "Proposal to modify the block rewards distribution algorithm to better align validator incentives with network health.",
    link: "https://forum.solana.com/t/simd-123-block-rewards"
  }
]; 