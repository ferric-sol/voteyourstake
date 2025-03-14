"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram } from '@solana/web3.js';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getStakeAccounts } from '@/app/utils/solana';
import { formatNumber } from './utils';
import ConnectionStatus from './ConnectionStatus';
import StakeAccountList from './StakeAccountList';
import ProposalCard from './ProposalCard';
import { useAnchorProgram } from './useAnchorProgram';
import { StakeAccountInfo, ProposalData, SIMDProposal } from './types';
import { BN } from '@coral-xyz/anchor';

const VoteInterface: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toast } = useToast();
  const anchorProgram = useAnchorProgram();
  
  // Create a ref to the connection to avoid recreating it on each render
  const connectionRef = useRef(connection);
  
  // Update the connection ref when it changes
  useEffect(() => {
    connectionRef.current = connection;
  }, [connection]);
  
  // State
  const [loadingCounter, setLoadingCounter] = useState(0);
  const [stakeAccounts, setStakeAccounts] = useState<StakeAccountInfo[]>([]);
  const [selectedStakeAccounts, setSelectedStakeAccounts] = useState<StakeAccountInfo[]>([]);
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [voteLoading, setVoteLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [simdProposals, setSimdProposals] = useState<SIMDProposal[]>([]);
  
  // Derived state
  const isLoading = loadingCounter > 0;
  const isConnected = !!wallet.publicKey;

  // Utility functions
  const startLoading = () => setLoadingCounter(prev => prev + 1);
  const stopLoading = () => setLoadingCounter(prev => Math.max(0, prev - 1));
  
  // Load SIMD proposals and fetch on-chain data
  useEffect(() => {
    if (!anchorProgram || !connection) return;
    
    // Import the SIMD_PROPOSALS_LIST from types.ts
    import('./types').then(async ({ SIMD_PROPOSALS_LIST }) => {
      setSimdProposals(SIMD_PROPOSALS_LIST);
      
      try {
        startLoading();
        
        // For each proposal in SIMD_PROPOSALS_LIST, try to fetch the on-chain data
        const proposalsWithOnChainData = await Promise.all(
          SIMD_PROPOSALS_LIST.map(async (simdProposal) => {
            // Derive the proposal PDA
            const [proposalPDA] = PublicKey.findProgramAddressSync(
              [Buffer.from('proposal'), Buffer.from(simdProposal.id)],
              anchorProgram.programId
            );
            
            try {
              // Try to fetch the on-chain proposal data
              const onChainProposal = await connection.getAccountInfo(proposalPDA);
              
              if (!onChainProposal) {
                throw new Error(`Proposal account not found for ${simdProposal.id}`);
              }
              
              // Decode the account data using Anchor's coder
              const decodedProposal = anchorProgram.coder.accounts.decode('Proposal', onChainProposal.data);
              console.log(`Fetched on-chain data for proposal ${simdProposal.id}:`, decodedProposal);
              
              // Combine the on-chain data with our updated title and description
              return {
                authority: decodedProposal.authority,
                proposalId: simdProposal.id,
                title: simdProposal.title, // Use our updated title
                description: simdProposal.description, // Use our updated description
                yesVotes: decodedProposal.yesVotes.toNumber() / LAMPORTS_PER_SOL,
                noVotes: decodedProposal.noVotes.toNumber() / LAMPORTS_PER_SOL,
                endTime: decodedProposal.endTime.toNumber() * 1000, // Convert to milliseconds
                isActive: decodedProposal.isActive,
                voteCount: decodedProposal.voteCount.toNumber(),
                pubkey: proposalPDA,
                id: simdProposal.id
              };
            } catch (error) {
              console.error(`Error fetching on-chain data for proposal ${simdProposal.id}:`, error);
              
              // If we can't fetch the on-chain data, use default values
              return {
                authority: new PublicKey('7NHwDTAu3XBPrMTFoEasfSNPhnP6uqLGAk6G8MiqDJU9'),
                proposalId: simdProposal.id,
                title: simdProposal.title,
                description: simdProposal.description,
                yesVotes: 0,
                noVotes: 0,
                endTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
                isActive: true,
                voteCount: 0,
                pubkey: proposalPDA,
                id: simdProposal.id
              };
            }
          })
        );
        
        console.log('Proposals with on-chain data:', proposalsWithOnChainData);
        setProposals(proposalsWithOnChainData);
      } catch (error) {
        console.error('Error fetching on-chain proposal data:', error);
        
        // If there's an error, fall back to using the local data
        const formattedProposals: ProposalData[] = SIMD_PROPOSALS_LIST.map(simdProposal => {
          const [proposalPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('proposal'), Buffer.from(simdProposal.id)],
            anchorProgram.programId
          );
          
          return {
            authority: new PublicKey('7NHwDTAu3XBPrMTFoEasfSNPhnP6uqLGAk6G8MiqDJU9'),
            proposalId: simdProposal.id,
            title: simdProposal.title,
            description: simdProposal.description,
            yesVotes: 0,
            noVotes: 0,
            endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
            isActive: true,
            voteCount: 0,
            pubkey: proposalPDA,
            id: simdProposal.id
          };
        });
        
        setProposals(formattedProposals);
      } finally {
        stopLoading();
      }
    });
  }, [anchorProgram, connection]);
  
  // Data fetching functions
  const refreshProposals = async () => {
    if (!anchorProgram || !connection) return;
    
    try {
      startLoading();
      
      // Re-trigger the useEffect that loads the SIMD_PROPOSALS_LIST and fetches on-chain data
      import('./types').then(async ({ SIMD_PROPOSALS_LIST }) => {
        setSimdProposals(SIMD_PROPOSALS_LIST);
        
        // For each proposal in SIMD_PROPOSALS_LIST, try to fetch the on-chain data
        const proposalsWithOnChainData = await Promise.all(
          SIMD_PROPOSALS_LIST.map(async (simdProposal) => {
            // Derive the proposal PDA
            const [proposalPDA] = PublicKey.findProgramAddressSync(
              [Buffer.from('proposal'), Buffer.from(simdProposal.id)],
              anchorProgram.programId
            );
            
            try {
              // Try to fetch the on-chain proposal data
              const onChainProposal = await connection.getAccountInfo(proposalPDA);
              
              if (!onChainProposal) {
                throw new Error(`Proposal account not found for ${simdProposal.id}`);
              }
              
              // Decode the account data using Anchor's coder
              const decodedProposal = anchorProgram.coder.accounts.decode('Proposal', onChainProposal.data);
              
              // Combine the on-chain data with our updated title and description
              return {
                authority: decodedProposal.authority,
                proposalId: simdProposal.id,
                title: simdProposal.title, // Use our updated title
                description: simdProposal.description, // Use our updated description
                yesVotes: decodedProposal.yesVotes.toNumber() / LAMPORTS_PER_SOL,
                noVotes: decodedProposal.noVotes.toNumber() / LAMPORTS_PER_SOL,
                endTime: decodedProposal.endTime.toNumber() * 1000, // Convert to milliseconds
                isActive: decodedProposal.isActive,
                voteCount: decodedProposal.voteCount.toNumber(),
                pubkey: proposalPDA,
                id: simdProposal.id
              };
            } catch (error) {
              console.error(`Error fetching on-chain data for proposal ${simdProposal.id}:`, error);
              
              // If we can't fetch the on-chain data, use default values
              return {
                authority: new PublicKey('7NHwDTAu3XBPrMTFoEasfSNPhnP6uqLGAk6G8MiqDJU9'),
                proposalId: simdProposal.id,
                title: simdProposal.title,
                description: simdProposal.description,
                yesVotes: 0,
                noVotes: 0,
                endTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
                isActive: true,
                voteCount: 0,
                pubkey: proposalPDA,
                id: simdProposal.id
              };
            }
          })
        );
        
        setProposals(proposalsWithOnChainData);
      });
    } catch (error) {
      console.error('Error refreshing proposals:', error);
      toast({
        variant: "destructive",
        title: "Failed to refresh proposals",
        description: "There was an error refreshing the proposals. Please try again."
      });
    } finally {
      stopLoading();
    }
  };

  const fetchStakeAccounts = async () => {
    if (!wallet.publicKey || !anchorProgram) return;
    
    startLoading();
    try {
      console.log('Fetching stake accounts...');
      const rawStakeAccounts = await getStakeAccounts(connection, wallet.publicKey);
      console.log('Found stake accounts:', rawStakeAccounts.length);
      
      // Process stake accounts
      const stakeAccountsWithVoteStatus = await Promise.all(
        rawStakeAccounts.map(async (acc: StakeAccountInfo) => {
          if (!acc) return null;
          
          // Check if this stake account has voted on each proposal
          const hasVotedOnAny = await Promise.all(
            proposals.map(async (proposal) => {
              try {
                // Find the vote record PDA
                const [voteRecordPda, voteRecordBump] = PublicKey.findProgramAddressSync(
                  [
                    Buffer.from('vote_record'),
                    proposal.pubkey.toBuffer(),
                    new PublicKey(acc.pubkey).toBuffer(),
                  ],
                  anchorProgram.programId
                );
                
                // Check if the vote record exists
                const voteRecordAccount = await connection.getAccountInfo(voteRecordPda);
                return voteRecordAccount !== null;
              } catch (error) {
                console.error('Error checking if stake account has voted:', error);
                return false;
              }
            })
          );
          
          return {
            ...acc,
            hasVoted: hasVotedOnAny.some(v => v), // Has voted on any proposal
            selected: false,
            staker: acc.withdrawer || "" // Use withdrawer as staker if not available
          } as StakeAccountInfo;
        })
      );
      
      // Filter out nulls
      const filteredAccounts = stakeAccountsWithVoteStatus.filter(
        (acc: any): acc is StakeAccountInfo => acc !== null
      );
      
      console.log('Mapped stake accounts:', filteredAccounts);
      setStakeAccounts(filteredAccounts);
      setSelectedStakeAccounts([]);
      
    } catch (error) {
      console.error('Error fetching stake accounts:', error);
      toast({
        variant: "destructive",
        title: "Failed to fetch stake accounts",
        description: "There was an error fetching your stake accounts. Please try again."
      });
    } finally {
      stopLoading();
    }
  };
  
  // Event handlers
  const handleSelectStakeAccount = (account: StakeAccountInfo) => {
    const updatedAccounts = stakeAccounts.map((acc) => {
      if (acc.pubkey === account.pubkey) {
        return { ...acc, selected: !acc.selected };
      }
      return acc;
    });
    
    setStakeAccounts(updatedAccounts);
    
    // Update selectedStakeAccounts
    setSelectedStakeAccounts(updatedAccounts.filter((acc) => acc.selected));
  };
  
  const selectAllStakeAccounts = (selectAll: boolean) => {
    const updatedAccounts = stakeAccounts.map((acc) => ({
      ...acc,
      selected: selectAll && !acc.hasVoted && acc.isEligible, // Only select if eligible and not voted already
    }));
    
    setStakeAccounts(updatedAccounts);
    
    // Update selectedStakeAccounts
    setSelectedStakeAccounts(updatedAccounts.filter((acc) => acc.selected));
  };

  // Voting function
  const castVote = async (proposal: any, voteValue: number) => {
    console.log("Wallet connection status:", wallet?.connected);
    console.log("Wallet name:", wallet.wallet?.adapter?.name || "Unknown wallet");
    console.log("Wallet supports signTransaction:", !!wallet.signTransaction);
    console.log("Wallet supports signAllTransactions:", !!wallet.signAllTransactions);
    console.log("Wallet supports sendTransaction:", !!wallet.sendTransaction);
    
    try {
      startLoading();
      
      if (!wallet.connected || !wallet.publicKey) {
        toast({
          variant: "destructive",
          title: "Wallet not connected",
          description: "Please connect your wallet to vote."
        });
        stopLoading();
        return;
      }
      
      if (!anchorProgram) {
        toast({
          variant: "destructive",
          title: "Program not initialized",
          description: "Please try again in a moment."
        });
        stopLoading();
        return;
      }
      
      if (selectedStakeAccounts.length === 0) {
        toast({
          variant: "destructive",
          title: "No stake account selected",
          description: "Please select a stake account to vote with."
        });
        stopLoading();
        return;
      }
      
      console.log("Selected stake accounts:", selectedStakeAccounts);
      
      // For now, just use the first selected stake account
      const stakeAccount = selectedStakeAccounts[0];
      
      // Check if the stake account is eligible (delegated to our validator)
      if (!stakeAccount.isEligible) {
        toast({
          variant: "destructive",
          title: "Ineligible Stake Account",
          description: "This stake account is not delegated to the required validator (28rDkn...7Nps)."
        });
        stopLoading();
        return;
      }
      
      const stakeAccountPubkey = new PublicKey(stakeAccount.pubkey);
      
      console.log("Using stake account pubkey:", stakeAccountPubkey.toString());
      
      // Get the connection from the reference
      const solConnection = connectionRef.current;
      
      console.log("Program ID:", anchorProgram.programId.toString());
      
      // Verify proposal account exists
      try {
        console.log("Checking proposal account:", proposal.pubkey.toString());
        const proposalInfo = await solConnection.getAccountInfo(proposal.pubkey);
        console.log("Proposal account exists:", !!proposalInfo);
        console.log("Proposal data size:", proposalInfo?.data.length || 0);
      } catch (e) {
        console.warn("Error checking proposal account:", e);
      }
      
      // Find the PDA for the vote record account
      const [voteRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('vote_record'),
          proposal.pubkey.toBuffer(),
          new PublicKey(stakeAccount.pubkey).toBuffer()
        ],
        anchorProgram.programId
      );
      
      console.log("Vote record PDA:", voteRecordPda.toString());
      
      // Check if vote record account already exists (already voted)
      const voteRecordAccount = await solConnection.getAccountInfo(voteRecordPda);
      if (voteRecordAccount) {
        console.log('Vote record account already exists:', voteRecordPda.toString());
        toast({
          variant: "destructive",
          title: "Already Voted",
          description: "This stake account has already voted on this proposal."
        });
        stopLoading();
        return;
      }
      
      // Convert vote value to number if needed
      const voteValueNumber = Number(voteValue);
      console.log("Vote value:", voteValueNumber);
      
      try {
        console.log("Preparing transaction with these accounts:", {
          proposal: proposal.pubkey.toString(),
          stakeAccount: stakeAccountPubkey.toString(),
          voter: wallet.publicKey.toString(),
          voteRecordAccount: voteRecordPda.toString(),
          systemProgram: SystemProgram.programId.toString()
        });
        
        // Set priority fees
        const computeBudgetOptions = {
          computeUnitPrice: 1_000_000,  // 1M micro-lamports per compute unit
          computeUnitLimit: 300_000,    // 300K compute units
        };
        
        // Use Anchor's methods to create and send the transaction
        const txSig = await anchorProgram.methods
          .castVote(voteValueNumber)
          .accounts({
            proposal: proposal.pubkey,
            stakeAccount: stakeAccountPubkey,
            voter: wallet.publicKey,
            voteRecordAccount: voteRecordPda,
            systemProgram: SystemProgram.programId,
          })
          .preInstructions([
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: computeBudgetOptions.computeUnitPrice,
            }),
            ComputeBudgetProgram.setComputeUnitLimit({
              units: computeBudgetOptions.computeUnitLimit,
            }),
          ])
          .rpc({ commitment: 'confirmed' });
          
        console.log("Transaction sent, signature:", txSig);
        
        toast({
          title: "Vote Submitted",
          description: "Your vote has been cast successfully!"
        });
        
        // Refresh data to show updated state
        refreshProposals();
        fetchStakeAccounts();
        
      } catch (error: any) {
        console.error("Error in transaction:", error);
        
        // Log error details
        if (error.logs) {
          console.error("Transaction logs:", error.logs);
        }
        
        // Check for specific error messages
        let errorMessage = error.message || "Failed to submit vote transaction";
        
        // Check if the error is related to the validator delegation
        if (error.logs && error.logs.some((log: string) => log.includes("NotDelegatedToValidator"))) {
          errorMessage = "This stake account is not delegated to the required validator (28rDkn...7Nps).";
        }
        
        toast({
          variant: "destructive",
          title: "Vote Failed",
          description: errorMessage
        });
      } finally {
        stopLoading();
      }
    } catch (error: any) {
      console.error("Error in vote transaction:", error);
      toast({
        variant: "destructive",
        title: "Vote Failed",
        description: error.message || "Failed to cast vote"
      });
      stopLoading();
    }
  };
  
  // Effects
  useEffect(() => {
    if (wallet.publicKey && anchorProgram) {
      refreshProposals();
      fetchStakeAccounts();
    }
  }, [wallet.publicKey, anchorProgram]);
  
  useEffect(() => {
    console.log('isLoading state changed:', isLoading);
  }, [isLoading]);

  // Render
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Vote Your Stake</h1>
      
      <ConnectionStatus 
        isConnected={isConnected}
        hasStakeAccounts={stakeAccounts.length > 0}
        onClick={fetchStakeAccounts}
      />
      
      <div className="mb-6">
        {!isConnected ? (
          <Alert>
            <AlertTitle>Connect Your Wallet</AlertTitle>
            <AlertDescription>
              Connect your Solana wallet to view stake accounts and participate in voting.
            </AlertDescription>
          </Alert>
        ) : (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <>
                    <Alert className="mb-4">
                      <AlertTitle>Validator Requirement</AlertTitle>
                      <AlertDescription>
                        Only stake accounts delegated to validator <span className="font-mono">28rDkn...7Nps</span> are eligible for voting.
                      </AlertDescription>
                    </Alert>
                    
                    {stakeAccounts.length === 0 ? (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTitle>No Eligible Stake Accounts</AlertTitle>
                        <AlertDescription>
                          No eligible stake accounts were found. You need to have stake accounts delegated to validator <span className="font-mono">28rDkn...7Nps</span> to participate in voting.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <StakeAccountList
                        stakeAccounts={stakeAccounts}
                        selectedStakeAccounts={selectedStakeAccounts}
                        handleSelectStakeAccount={handleSelectStakeAccount}
                        selectAllStakeAccounts={selectAllStakeAccounts}
                        formatNumber={formatNumber}
                      />
                    )}
                    
                    {/* Proposals Section with Voting UI */}
                    {proposals.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Proposals</h3>
                        {stakeAccounts.length === 0 && (
                          <Alert variant="default" className="mb-4">
                            <AlertTitle>Voting Disabled</AlertTitle>
                            <AlertDescription>
                              You cannot vote on these proposals because you don't have any eligible stake accounts. You can still view the proposals below.
                            </AlertDescription>
                          </Alert>
                        )}
                        <div className="space-y-4">
                          {proposals.map((proposal) => (
                            <ProposalCard 
                              key={proposal.id} 
                              proposal={proposal}
                              selectedStakeAccounts={selectedStakeAccounts}
                              voteLoading={voteLoading}
                              onVote={castVote}
                              formatNumber={formatNumber}
                              disableVoting={stakeAccounts.length === 0}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteInterface; 