"use client"

import { PublicKey } from '@solana/web3.js';

// Type for program account
export type ProgramAccount = {
  pubkey: PublicKey;
  account: any;
};

// Type for decoded proposals
export type DecodedProposal = {
  id: string;
  title: string;
  description: string;
  authority: string;
  endTime: number;
  yesVotes: number;
  noVotes: number;
  isClosed: boolean;
};

// Type for stake account information
export type StakeAccountInfo = {
  pubkey: string;
  stake: number | string;
  withdrawer: string;
  staker: string;
  hasVoted: boolean;
  selected: boolean;
};

// Sample proposals for testing
export const SIMD_PROPOSALS = [
  { id: 'SIMD-123', title: 'Add New Governance Features', description: 'Implement additional governance features including delegation of voting power and time-locked proposals to enhance the governance process.' },
  { id: 'SIMD-228', title: 'Increase Validator Commission to 8%', description: 'This proposal aims to increase the validator commission from the current 5% to 8% to better support network security and validator operations.' },
];

// Utility function to format numbers
export const formatNumber = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(numValue);
};

// Utility function to check if a stake account has voted on a proposal
export const hasVoted = async (program: any, stakeAccount: PublicKey, proposalPubkey: PublicKey): Promise<boolean> => {
  try {
    // Find the vote record PDA
    const [voteRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('vote_record'),
        proposalPubkey.toBuffer(),
        stakeAccount.toBuffer()
      ],
      program.programId
    );
    
    // Check if the vote record exists
    const voteRecordAccount = await program.provider.connection.getAccountInfo(voteRecordPda);
    return voteRecordAccount !== null;
  } catch (error) {
    console.error('Error checking if stake account has voted:', error);
    return false;
  }
};

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
export const SIMD_PROPOSALS_LIST: SIMDProposal[] = [
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