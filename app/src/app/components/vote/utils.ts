"use client"

import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { ProposalData, StakeAccountInfo } from './types';
import { idl } from './idl';

// Function to fetch all proposals
export const fetchProposals = async (
  program: Program,
  connection: Connection
): Promise<ProposalData[]> => {
  console.log('Fetching proposals from devnet...');
  console.log('Program ID:', program.programId.toString());
  console.log('Connection endpoint:', connection.rpcEndpoint);
  
  try {
    // Fetch all proposal accounts
    console.log('Calling program.account.proposal.all()...');
    // @ts-ignore - Ignore TypeScript error for account access
    const proposalAccounts = await program.account.proposal.all();
    console.log('Fetched proposal accounts:', proposalAccounts.length);
    
    // Map the accounts to our ProposalData type
    return proposalAccounts.map((account: any) => {
      const data = account.account;
      return {
        authority: data.authority,
        proposalId: data.proposalId,
        title: data.title,
        description: data.description,
        yesVotes: data.yesVotes.toString(),
        noVotes: data.noVotes.toString(),
        endTime: new Date(data.endTime.toNumber() * 1000),
        isActive: data.isActive,
        voteCount: data.voteCount.toString(),
        pubkey: account.publicKey
      };
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }
};

// Function to check if a stake account has already voted on a proposal
export const hasVoted = async (
  program: Program,
  stakeAccount: PublicKey,
  proposalPubkey: PublicKey
): Promise<boolean> => {
  try {
    // Derive the vote record account address
    const [voteRecordPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from('vote_record'),
        stakeAccount.toBuffer(),
        proposalPubkey.toBuffer()
      ],
      program.programId
    );
    
    // Try to fetch the vote record account
    // @ts-ignore - Ignore TypeScript error for account access
    await program.account.voteRecord.fetch(voteRecordPda);
    return true; // If we get here, the account exists, so the stake account has voted
  } catch (error) {
    return false; // If there's an error (account not found), the stake account hasn't voted
  }
};

// Function to check if a stake account has voted on any of the proposals
export const checkVotedProposals = async (
  program: Program,
  stakeAccounts: StakeAccountInfo[],
  proposals: ProposalData[]
): Promise<StakeAccountInfo[]> => {
  // Create a copy of the stake accounts
  const updatedStakeAccounts = [...stakeAccounts];
  
  // For each stake account, check if it has voted on any proposal
  for (let i = 0; i < updatedStakeAccounts.length; i++) {
    const stakeAccount = updatedStakeAccounts[i];
    
    // Check if the stake account has voted on any of the proposals
    for (const proposal of proposals) {
      const voted = await hasVoted(program, new PublicKey(stakeAccount.pubkey), proposal.pubkey);
      if (voted) {
        updatedStakeAccounts[i] = {
          ...stakeAccount,
          hasVoted: true
        };
        break; // No need to check other proposals if we found a vote
      }
    }
  }
  
  return updatedStakeAccounts;
};

// Utility function to format numbers
export const formatNumber = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(numValue);
};

// Function to calculate the percentage of votes
export const calculatePercentage = (votes: string, totalVotes: string): number => {
  if (Number(totalVotes) === 0) return 0;
  return (Number(votes) / Number(totalVotes)) * 100;
};

// Function to check if a proposal is still active
export const isProposalActive = (endTime: Date): boolean => {
  return new Date() < endTime;
};

// Function to format the remaining time for a proposal
export const formatRemainingTime = (endTime: Date): string => {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
}; 