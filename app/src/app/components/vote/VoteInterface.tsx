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
import { StakeAccountInfo, ProposalData } from './types';
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
  const [simdProposals, setSimdProposals] = useState<any[]>([]);
  
  // Derived state
  const isLoading = loadingCounter > 0;
  const isConnected = !!wallet.publicKey;

  // Utility functions
  const startLoading = () => setLoadingCounter(prev => prev + 1);
  const stopLoading = () => setLoadingCounter(prev => Math.max(0, prev - 1));
  
  // Data fetching functions
  const refreshProposals = async () => {
    if (!anchorProgram) return;
    
          startLoading();
    try {
      console.log('Fetching proposals with Anchor...');
      console.log('Program ID:', anchorProgram.programId.toString());
      
      // Fetch all proposal accounts
      console.log('Fetching program accounts...');
      const accounts = await connection.getProgramAccounts(anchorProgram.programId);
      console.log('Found accounts:', accounts.length);
      console.log('Account details:', accounts);
      
      // Try to decode each account as a proposal
      console.log('Attempting to decode accounts...');
      const proposalAccounts = [];
      
      for (const account of accounts) {
        try {
          console.log('Checking account:', account.pubkey.toString());
          console.log('Account data length:', account.account.data.length);
          
          // Check discriminator
          const discriminator = account.account.data.slice(0, 8);
          const expectedDiscriminator = Buffer.from([26, 94, 189, 187, 116, 136, 53, 33]);
          
          const isMatch = Buffer.compare(discriminator, expectedDiscriminator) === 0;
          
          if (!isMatch) {
            console.log('Account is not a proposal (discriminator mismatch), skipping');
            console.log('Found discriminator:', Array.from(discriminator));
            console.log('Expected discriminator:', Array.from(expectedDiscriminator));
            continue;
          }
          
          console.log('Account has proposal discriminator, decoding...');
          console.log('Account data (base64):', account.account.data.toString('base64'));
          
          // Verify the program's account decoder is properly set up
          console.log('Program account decoder available:', !!anchorProgram.coder?.accounts);
          console.log('Account decoder:', anchorProgram.coder?.accounts);
          
          // Log the account we're trying to decode
          console.log('Looking for layout with name "Proposal"');
          
          // Decode the account data
          try {
            // Try with exact capitalization as in IDL
            console.log('Attempting to decode with exact name "Proposal"');
            const decoded = anchorProgram.coder.accounts.decode('Proposal', account.account.data);
            console.log('Successfully decoded account:', decoded);
            
            proposalAccounts.push({
              pubkey: account.pubkey,
              account: account.account,
              decoded
            });
          } catch (error) {
            console.error('Error with "Proposal":', error instanceof Error ? error.message : String(error));
            
            try {
              // Try with lowercase since Anchor might convert it
              console.log('Attempting to decode with lowercase name "proposal"');
              const decoded = anchorProgram.coder.accounts.decode('proposal', account.account.data);
              console.log('Successfully decoded account:', decoded);
              
              proposalAccounts.push({
                pubkey: account.pubkey,
                account: account.account,
                decoded
              });
            } catch (decodeError) {
              console.error('Error with "proposal":', decodeError instanceof Error ? decodeError.message : String(decodeError));
              
              // Try manual decoding if all else fails
              try {
                console.log('Attempting manual decoding via borsh');
                // Extract just the data portion (after discriminator)
                const dataWithoutDiscriminator = account.account.data.slice(8);
                console.log('Data without discriminator:', dataWithoutDiscriminator);
                
                // Manually create a basic decoded object with fields we can determine
                // This is a fallback if the standard decoding fails
                const decoded = {
                  authority: new PublicKey(dataWithoutDiscriminator.slice(0, 32)),
                  // The rest of the fields are difficult to parse manually without borsh
                  // So we'll have placeholder values
                  proposalId: "Unknown ID",
                  title: "Unknown Title",
                  description: "Unknown Description",
                  yesVotes: new BN(0),
                  noVotes: new BN(0),
                  endTime: new BN(0),
                  isActive: true,
                  voteCount: new BN(0),
                  merkleRoot: new Array(32).fill(0),
                };
                
                console.log('Manually decoded (partial):', decoded);
                
          proposalAccounts.push({
                  pubkey: account.pubkey,
                  account: account.account,
                  decoded
                });
              } catch (manualError) {
                console.error('Manual decoding also failed:', manualError);
              }
            }
          }
        } catch (error) {
          console.error('Failed to decode account:', error);
        }
      }
      
      console.log('Successfully decoded accounts:', proposalAccounts.length);
      console.log('Raw proposal accounts:', proposalAccounts);
      
      // Convert decoded accounts to our application format
      const mappedProposals = proposalAccounts.map(account => {
        console.log('Mapping proposal data:', account.decoded);
        
        return {
          pubkey: account.pubkey,
          id: account.decoded.proposalId,
          title: account.decoded.title,
          description: account.decoded.description,
          authority: account.decoded.authority.toString(),
          endTime: account.decoded.endTime.toNumber(),
          yesVotes: account.decoded.yesVotes.toNumber() / LAMPORTS_PER_SOL,
          noVotes: account.decoded.noVotes.toNumber() / LAMPORTS_PER_SOL,
          isClosed: !account.decoded.isActive,
        };
      });
      
      console.log('Final mapped proposals:', mappedProposals);
      setProposals(mappedProposals);
      
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        variant: "destructive",
        title: "Failed to fetch proposals",
        description: "There was an error fetching proposals. Please try again."
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
      selected: selectAll && !acc.hasVoted, // Only select if not voted already
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
        
        toast({
          variant: "destructive",
          title: "Vote Failed",
          description: error.message || "Failed to submit vote transaction"
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
                    <Skeleton className="h-20 w-full" />
              </div>
                ) : (
                  <>
                    <StakeAccountList 
                      stakeAccounts={stakeAccounts}
                      selectedStakeAccounts={selectedStakeAccounts}
                      handleSelectStakeAccount={handleSelectStakeAccount}
                      selectAllStakeAccounts={selectAllStakeAccounts}
                      formatNumber={formatNumber}
                    />
                    
                    {/* Proposals Section with Voting UI */}
                  {proposals.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Proposals</h3>
                        <div className="space-y-4">
                          {proposals.map((proposal) => (
                            <ProposalCard 
                              key={proposal.id} 
                              proposal={proposal}
                              selectedStakeAccounts={selectedStakeAccounts}
                              voteLoading={voteLoading}
                              onVote={castVote}
                              formatNumber={formatNumber}
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