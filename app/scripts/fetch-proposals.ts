import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { PublicKey, Connection, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { idl } from '../src/app/components/vote/idl';

// Load the local keypair for testing
const loadKeypair = (filename: string): anchor.web3.Keypair => {
  const keypairFile = fs.readFileSync(filename, 'utf-8');
  const keypairData = JSON.parse(keypairFile);
  return anchor.web3.Keypair.fromSecretKey(new Uint8Array(keypairData));
};

async function main() {
  // Configure the client to use devnet
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Load the deployer keypair
  const walletKeypair = loadKeypair(path.resolve(process.env.HOME || '', '.config/solana/id.json'));
  const wallet = new anchor.Wallet(walletKeypair);
  
  // Create the provider
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    { commitment: 'confirmed' }
  );
  
  // Set the provider as the default one
  anchor.setProvider(provider);
  
  // Get the program ID from the IDL
  const programId = new PublicKey(idl.programId);
  
  // Create the program interface
  const program = new Program(idl as anchor.Idl, programId);
  
  console.log('Fetching proposals from devnet...');
  
  try {
    // @ts-ignore - Property 'proposal' does not exist on type 'AccountNamespace<any>'
    const allProposals = await program.account.proposal.all();
    
    if (allProposals.length === 0) {
      console.log('No proposals found.');
      return;
    }
    
    console.log(`Found ${allProposals.length} proposals:`);
    
    // Format and display each proposal
    allProposals.forEach((item: any, index: number) => {
      const account = item.account;
      const pubkey = item.publicKey;
      
      console.log(`\nProposal #${index + 1}:`);
      console.log(`Address: ${pubkey.toString()}`);
      console.log(`ID: ${account.proposalId}`);
      console.log(`Title: ${account.title}`);
      console.log(`Description: ${account.description}`);
      console.log(`Authority: ${account.authority.toString()}`);
      console.log(`Yes Votes: ${Number(account.yesVotes) / LAMPORTS_PER_SOL} SOL`);
      console.log(`No Votes: ${Number(account.noVotes) / LAMPORTS_PER_SOL} SOL`);
      console.log(`End Time: ${new Date(Number(account.endTime) * 1000).toLocaleString()}`);
      console.log(`Is Active: ${account.isActive}`);
      console.log(`Vote Count: ${Number(account.voteCount)}`);
    });
    
  } catch (error) {
    console.error('Error fetching proposals:', error);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
); 