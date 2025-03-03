"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program, AnchorProvider, BN, web3, Idl } from '@coral-xyz/anchor';
import { PublicKey, Transaction, SystemProgram, Connection, AccountInfo, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ProposalData, StakeAccountInfo, SIMDProposal, SIMD_PROPOSALS } from './types';
import { fetchProposals, hasVoted, checkVotedProposals } from './utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// @ts-ignore
import { Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import ProposalList from './ProposalList';
import ProposalDetails from './ProposalDetails';
import StakeAccountSelector from './StakeAccountSelector';
import CreateProposalForm from './CreateProposalForm';
import { idl } from './idl';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';

// Define the program ID string constant
const PROGRAM_ID_STRING = "HaEmonFHu9RoLvn1EPreVcfDFmYGQqVdhUsADrAWorfL";

// Create a PublicKey from the program ID string
const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

// Define the type for program account
type ProgramAccount = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
};

// Define the type for decoded proposal
type DecodedProposal = {
  id: string;
  title: string;
  description: string;
  authority: string;
  endTime: number;
  yesVotes: number;
  noVotes: number;
  isClosed: boolean;
};

// Import the fetched IDL
// import fetchedIdlJson from './fetched-idl.json';
// const fetchedIdl = fetchedIdlJson as any;

const VoteInterface: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  // State
  const [program, setProgram] = useState<any>(null);
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<ProposalData | null>(null);
  const [stakeAccounts, setStakeAccounts] = useState<StakeAccountInfo[]>([]);
  const [selectedStakeAccount, setSelectedStakeAccount] = useState<StakeAccountInfo | null>(null);
  const [loadingCounter, setLoadingCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('proposals');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSIMDProposal, setSelectedSIMDProposal] = useState<SIMDProposal | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [programAccount, setProgramAccount] = useState<any>(null);
  const [programAccounts, setProgramAccounts] = useState<ProgramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<ProgramAccount | null>(null);
  const [decodedData, setDecodedData] = useState<any | null>(null);
  
  // Track loading counter changes
  useEffect(() => {
    console.log('loadingCounter:', loadingCounter);
    setIsLoading(loadingCounter > 0);
  }, [loadingCounter]);
  
  // Helper functions to manage loading state
  const startLoading = () => setLoadingCounter(prev => prev + 1);
  const stopLoading = () => setLoadingCounter(prev => Math.max(0, prev - 1));
  
  // Track isLoading state changes
  useEffect(() => {
    console.log('isLoading state changed:', isLoading);
  }, [isLoading]);

  // Check connection to Solana
  useEffect(() => {
    const checkConnection = async () => {
      if (connection) {
        try {
          startLoading();
          setConnectionStatus('Checking connection...');
          
          // Simple test to check if we can connect to Solana
          const version = await connection.getVersion();
          console.log('Solana version:', version);
          setConnectionStatus(`Connected to ${connection.rpcEndpoint} (Solana ${version['solana-core']})`);
          
          // Check if the program exists
          try {
            const accountInfo = await connection.getAccountInfo(PROGRAM_ID);
            if (accountInfo) {
              console.log('Program account exists:', accountInfo.owner.toString());
              console.log('Program data length:', accountInfo.data.length);
              setConnectionStatus(prev => `${prev}, Program found`);
              setProgramAccount(accountInfo);
            } else {
              console.log('Program account not found');
              setConnectionStatus(prev => `${prev}, Program not found`);
            }
          } catch (programError) {
            console.error('Error checking program:', programError);
            setConnectionStatus(prev => `${prev}, Error checking program`);
          }
          
          setErrorMessage(null);
    } catch (error) {
          console.error('Connection error:', error);
          setConnectionStatus('Connection error');
          setErrorMessage((error as Error).message);
    } finally {
          stopLoading();
        }
      } else {
        setConnectionStatus('No connection');
      }
    };
    
    checkConnection();
  }, [connection]);

  // Handle wallet connection
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      console.log('Wallet connected:', wallet.publicKey.toString());
    } else {
      console.log('Wallet not connected');
    }
  }, [wallet.connected, wallet.publicKey]);

  // Initialize Anchor program when wallet is connected
  useEffect(() => {
    const initializeProgram = async () => {
      if (wallet.connected && wallet.publicKey && connection) {
        try {
          startLoading();
          console.log('Initializing Anchor program...');
          
          // Create a properly formatted program ID
          const programId = new PublicKey(PROGRAM_ID_STRING);
          console.log('Program ID:', programId.toString());
          
          // Create a wallet adapter that matches what Anchor expects
          const anchorWallet = {
            publicKey: wallet.publicKey,
            signTransaction: wallet.signTransaction!,
            signAllTransactions: wallet.signAllTransactions!,
          };
          console.log('Wallet adapter created:', anchorWallet.publicKey.toString());
          
          // Create an Anchor provider with explicit options
          const provider = new AnchorProvider(
            connection,
            // @ts-ignore - Type issues with wallet adapter
            anchorWallet,
            { commitment: 'processed', preflightCommitment: 'processed' }
          );
          console.log('Provider created with connection:', connection.rpcEndpoint);
          
          // Log the IDL to debug
          console.log('Using IDL:', JSON.stringify(idl));
          
          try {
            // Create a simple IDL reference to test initialization
            console.log('Creating program instance with IDL...');
            console.log('IDL programId:', idl.programId);
            
            // Initialize the program with the IDL that includes the programId
            const program = new Program(
              idl as any,
              provider
            );
            
            console.log('Program initialized successfully');
            console.log('Program ID:', program.programId.toString());
            console.log('Program methods:', Object.keys(program.methods || {}));
            
            setProgram(program);
            
            // Fetch proposals using Anchor
            await fetchProposalsWithAnchor(program);
          } catch (programError) {
            console.error('Error initializing program:', programError);
            console.error('Program error details:', JSON.stringify(programError));
          }
        } catch (error) {
          console.error('Error initializing Anchor program:', error);
          console.error('Error details:', JSON.stringify(error));
        } finally {
          stopLoading();
        }
      }
    };
    
    initializeProgram();
  }, [wallet.connected, wallet.publicKey, connection]);
  
  // Fetch proposals using Anchor
  const fetchProposalsWithAnchor = async (program: any) => {
    try {
      console.log('Fetching proposals with Anchor...');
      console.log('Program ID:', PROGRAM_ID.toString());
      
      // Get all accounts owned by our program
      console.log('Fetching program accounts...');
      const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: 'confirmed',
      });
      
      console.log('Found accounts:', accounts.length);
      console.log('Account details:', accounts.map(acc => ({
        pubkey: acc.pubkey.toString(),
        owner: acc.account.owner.toString(),
        dataLength: acc.account.data.length,
        executable: acc.account.executable,
        lamports: acc.account.lamports,
      })));
      
      if (accounts.length === 0) {
        console.log('No accounts found');
        setProposals([]);
        return;
      }
      
      // Try to decode each account as a proposal
      console.log('Attempting to decode accounts...');
      const proposalAccounts = [];
      for (const account of accounts) {
        try {
          console.log('Decoding account:', account.pubkey.toString());
          console.log('Account data length:', account.account.data.length);
          console.log('Account data (base64):', account.account.data.toString('base64'));
          
          const decodedAccount = await program.coder.accounts.decode('Proposal', account.account.data);
          console.log('Successfully decoded account:', decodedAccount);
          proposalAccounts.push({
            publicKey: account.pubkey,
            account: decodedAccount
          });
        } catch (e) {
          console.log('Failed to decode account:', account.pubkey.toString());
          console.error('Decode error:', e);
        }
      }
      
      console.log('Successfully decoded accounts:', proposalAccounts.length);
      console.log('Raw proposal accounts:', proposalAccounts);
      
      if (proposalAccounts.length === 0) {
        console.log('No proposals found after decoding');
        setProposals([]);
        return;
      }
      
      // Map proposal accounts to ProposalData format
      const mappedProposals = proposalAccounts.map((account: any) => {
        const data = account.account;
        console.log('Mapping proposal data:', data);
        
        return {
          pubkey: account.publicKey,
          proposalId: data.proposalId || '',
          title: data.title || '',
          description: data.description || '',
          authority: data.authority?.toString() || '',
          yesVotes: data.yesVotes?.toString() || '0',
          noVotes: data.noVotes?.toString() || '0',
          endTime: new Date(Number(data.endTime) * 1000),
          isActive: data.isActive || false,
          voteCount: data.voteCount?.toString() || '0'
        };
      });
      
      console.log('Final mapped proposals:', mappedProposals);
      setProposals(mappedProposals);
    } catch (error) {
      console.error('Error fetching proposals with Anchor:', error);
      console.error('Error details:', JSON.stringify(error));
    }
  };
  
  // Button to refresh proposals
  const refreshProposals = async () => {
    if (program) {
      await fetchProposalsWithAnchor(program);
    } else {
      console.error('Program not initialized');
    }
  };

  // Create a test proposal using Anchor
  const createTestProposal = async () => {
    try {
      startLoading();
      console.log('Creating test proposal...');
      
      if (!program || !wallet.publicKey) {
        console.error('Program not initialized or wallet not connected');
        stopLoading();
        return;
      }
      
      // Generate a unique proposal ID
      const proposalId = `PROP-${Math.floor(Math.random() * 10000)}`;
      
      // Get the current time
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const endTime = now + 7 * 24 * 60 * 60; // 1 week from now in seconds
      
      // Find the proposal PDA
      const [proposalPda] = await PublicKey.findProgramAddress(
        [Buffer.from("proposal"), Buffer.from(proposalId)],
        PROGRAM_ID
      );
      
      console.log('Creating proposal with ID:', proposalId);
      console.log('Proposal PDA:', proposalPda.toString());
      
      // Create the proposal
      const tx = await program.methods
        .initializeProposal(
          proposalId,
          "Test Proposal",
          "This is a test proposal created from the UI",
          new BN(endTime)
        )
        .accounts({
          proposal: proposalPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      console.log('Proposal created successfully. Transaction:', tx);
      
      // Refresh the proposals list
      await fetchProposalsWithAnchor(program);
      
      stopLoading();
    } catch (error) {
      console.error('Error creating test proposal:', error);
      stopLoading();
    }
  };
  
  // Helper function to find the program address for a proposal
  const findProgramAddressForProposal = async (proposalId: string) => {
    const [proposalPda] = await PublicKey.findProgramAddress(
      [Buffer.from("proposal"), Buffer.from(proposalId)],
      PROGRAM_ID
    );
    return proposalPda;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Vote Your Stake</h1>
      
      <div className="bg-muted p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <p>{connectionStatus}</p>
        {errorMessage && (
          <p className="text-red-500 mt-2">Error: {errorMessage}</p>
        )}
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Vote Your Stake</h2>
                <WalletMultiButton />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => {
                    if (!wallet.publicKey || !connection) return;
                    console.log('Connection:', connection.rpcEndpoint);
                    console.log('Wallet:', wallet.publicKey.toString());
                  }} 
                  disabled={!wallet.connected}
                  variant="outline"
                >
                  Check Connection
                </Button>
                
                <Button 
                  onClick={refreshProposals} 
                  disabled={!wallet.connected || !program}
                  variant="outline"
                >
                  Refresh Proposals
                </Button>
                
                <Button 
                  onClick={createTestProposal} 
                  disabled={!wallet.connected || !program}
                  variant="outline"
                >
                  Create Test Proposal
                </Button>
              </div>
              
              {loadingCounter > 0 && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              
              {wallet.connected ? (
                <div>
                  <p>Connected to wallet: {wallet.publicKey?.toString()}</p>
                  {program ? (
                    <p className="text-green-600">Anchor program initialized successfully</p>
                  ) : (
                    <p className="text-yellow-600">Anchor program not initialized</p>
                  )}
                  {proposals.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <h3 className="text-lg font-semibold mb-2">Proposals: {proposals.length}</h3>
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold">Proposals:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {proposals.map((proposal, index) => (
                            <li key={proposal.pubkey.toString()}>
                              <span className="font-medium">{proposal.title}</span> (ID: {proposal.proposalId})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p>Connect your wallet to get started</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {selectedAccount && decodedData && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-2">Account Data</h2>
              <p><strong>Account:</strong> {selectedAccount.pubkey.toString()}</p>
              <div className="mt-4 space-y-2">
                <p><strong>Type:</strong> {decodedData.type || 'Unknown'}</p>
                <p><strong>Discriminator:</strong> {decodedData.discriminator}</p>
                
                {decodedData.authority && (
                  <p><strong>Authority:</strong> {decodedData.authority}</p>
                )}
                
                {decodedData.id && (
                  <p><strong>ID:</strong> {decodedData.id}</p>
                )}
                
                {decodedData.title && (
                  <p><strong>Title:</strong> {decodedData.title}</p>
                )}
                
                {decodedData.description && (
                  <p><strong>Description:</strong> {decodedData.description}</p>
                )}
                
                {decodedData.endTimeDate && (
                  <p><strong>End Time:</strong> {decodedData.endTimeDate}</p>
                )}
                
                {decodedData.timeInterpretations && (
                  <div>
                    <p><strong>Time Interpretations:</strong></p>
                    <ul className="list-disc pl-5">
                      <li>LE 64-bit (seconds): {decodedData.timeInterpretations.le64s}</li>
                      <li>BE 64-bit (seconds): {decodedData.timeInterpretations.be64s}</li>
                      <li>LE 32-bit (seconds): {decodedData.timeInterpretations.le32s}</li>
                      <li>BE 32-bit (seconds): {decodedData.timeInterpretations.be32s}</li>
                      <li>Reversed bytes (seconds): {decodedData.timeInterpretations.reversed}</li>
                      <li>Hex reversed (seconds): {decodedData.timeInterpretations.hexReversed}</li>
                    </ul>
                  </div>
                )}
                
                {decodedData.isClosed !== undefined && (
                  <p><strong>Is Closed:</strong> {decodedData.isClosed ? 'Yes' : 'No'}</p>
                )}
                
                {decodedData.yesVotes !== undefined && (
                  <p><strong>Yes Votes:</strong> {decodedData.yesVotes}</p>
                )}
                
                {decodedData.yesVotesInterpretations && (
                  <div>
                    <p><strong>Yes Votes Interpretations:</strong></p>
                    <ul className="list-disc pl-5">
                      <li>First 4 bytes LE: {decodedData.yesVotesInterpretations.firstLE}</li>
                      <li>First 4 bytes BE: {decodedData.yesVotesInterpretations.firstBE}</li>
                      <li>Last 4 bytes LE: {decodedData.yesVotesInterpretations.lastLE}</li>
                      <li>Last 4 bytes BE: {decodedData.yesVotesInterpretations.lastBE}</li>
                    </ul>
                  </div>
                )}
                
                {decodedData.noVotes !== undefined && (
                  <p><strong>No Votes:</strong> {decodedData.noVotes}</p>
                )}
                
                {decodedData.noVotesInterpretations && (
                  <div>
                    <p><strong>No Votes Interpretations:</strong></p>
                    <ul className="list-disc pl-5">
                      <li>First 4 bytes LE: {decodedData.noVotesInterpretations.firstLE}</li>
                      <li>First 4 bytes BE: {decodedData.noVotesInterpretations.firstBE}</li>
                      <li>Last 4 bytes LE: {decodedData.noVotesInterpretations.lastLE}</li>
                      <li>Last 4 bytes BE: {decodedData.noVotesInterpretations.lastBE}</li>
                    </ul>
                  </div>
                )}
                
                <div className="mt-4">
                  <p><strong>Raw Data (hex):</strong></p>
                  <div className="bg-black text-green-400 p-4 rounded-md overflow-x-auto">
                    <code className="text-xs">{decodedData.rawData}</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Add ProposalList component */}
        {proposals.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Proposals</h2>
                <ProposalList 
                  proposals={proposals}
                  simdProposals={SIMD_PROPOSALS}
                  selectedProposal={null}
                  onSelectProposal={(proposal) => {
                    console.log('Selected proposal:', proposal);
                  }}
                  onCreateProposal={() => {}}
                  isLoading={loadingCounter > 0}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteInterface; 