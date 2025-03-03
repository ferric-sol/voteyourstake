import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { idl } from './idl';

/**
 * Custom hook for initializing an Anchor program
 * @returns The initialized Anchor program or null if initialization fails
 */
export const useAnchorProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program | null>(null);

  const initializeProgram = useCallback(async () => {
    if (!wallet.publicKey) {
      console.log('Wallet not connected, cannot initialize program');
      return null;
    }
    
    try {
      console.log('Initializing program...');
      
      // Validate the IDL structure
      if (!idl || !idl.metadata || !idl.types || !idl.accounts) {
        console.error('IDL is missing required fields:', idl);
      }
      
      // Debug log IDL accounts and types
      console.log('IDL accounts structure:', idl.accounts);
      console.log('IDL types structure:', idl.types);
      
      // Ensure the Proposal account is defined in the IDL
      const proposalAccount = idl.accounts?.find(acc => acc.name === 'Proposal');
      console.log('Found Proposal account in IDL:', proposalAccount);
      
      // Ensure wallet has the required methods
      if (!wallet.signTransaction || !wallet.signAllTransactions) {
        console.error('Wallet is missing required methods for Anchor');
        return null;
      }
      
      // Create an Anchor wallet adapter
      const anchorWallet = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      };
      
      // Create a provider
      const provider = new AnchorProvider(
        connection,
        anchorWallet,
        { commitment: 'confirmed' }
      );
      
      // Create the program with just idl and provider
      console.log('Creating program instance...');
      const program = new Program(idl as Idl, provider);
      
      // Debug log the initialized program
      console.log('Program initialized successfully');
      console.log('Program ID:', program.programId.toString());
      console.log('Program account decoders available:', !!program.coder?.accounts);
      
      return program;
    } catch (error) {
      console.error('Failed to initialize program:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return null;
    }
  }, [connection, wallet]);

  useEffect(() => {
    if (wallet.publicKey) {
      initializeProgram().then(setProgram);
    } else {
      setProgram(null);
    }
  }, [wallet.publicKey, initializeProgram]);

  return program;
}; 