import * as anchor from '@coral-xyz/anchor';
import { Program, Wallet } from '@coral-xyz/anchor';
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  clusterApiUrl, 
  Transaction, 
  SendOptions,
  SystemProgram,
  TransactionInstruction
} from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { idl } from '../src/app/components/vote/idl';
import * as borsh from 'borsh';

// Define the SIMD proposals with updated information
const SIMD_PROPOSALS = [
  {
    id: "SIMD-228",
    title: "Market-based emissions mechanism",
    description: "Proposal for introducing a programmatic market-based emission mechanism based on staking participation rate",
    link: "https://forum.solana.com/t/proposal-for-introducing-a-programmatic-market-based-emission-mechanism-based-on-staking-participation-rate/3294"
  },
  {
    id: "SIMD-123",
    title: "Block rewards distribution",
    description: "Proposal for an in-protocol distribution of block rewards to stakers",
    link: "https://forum.solana.com/t/proposal-for-an-in-protocol-distribution-of-block-rewards-to-stakers/3295"
  }
];

// Helper function to load a keypair from a file
function loadKeypair(filePath: string): Keypair {
  const keypairData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
}

// Helper function to send and confirm a transaction
async function sendAndConfirmTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: Keypair[]
): Promise<string> {
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = signers[0].publicKey;
  
  transaction.sign(...signers);
  
  const rawTransaction = transaction.serialize();
  const signature = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
  
  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}

// Define instruction discriminators
const CLOSE_PROPOSAL_DISCRIMINATOR = Buffer.from([211, 98, 63, 178, 96, 121, 142, 236]);
const INITIALIZE_PROPOSAL_DISCRIMINATOR = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);

async function main() {
  // Configure the client to use devnet
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Load the deployer keypair (this should be the same keypair used to deploy the program)
  const walletKeypair = loadKeypair(path.resolve(process.env.HOME || '', '.config/solana/id.json'));
  
  console.log('Using wallet address:', walletKeypair.publicKey.toBase58());
  
  // Check wallet balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`Wallet balance: ${balance / 1000000000} SOL`);
  
  if (balance < 1000000000) {
    console.log('Requesting airdrop...');
    const signature = await connection.requestAirdrop(
      walletKeypair.publicKey,
      1000000000 // 1 SOL
    );
    await connection.confirmTransaction(signature);
    console.log('Airdrop confirmed');
  }
  
  // Get the program ID from the IDL
  const programId = new PublicKey(idl.address);
  
  console.log('Updating proposals on devnet...');
  
  // First, close existing proposals
  for (const proposal of SIMD_PROPOSALS) {
    try {
      // Derive the proposal PDA
      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('proposal'), Buffer.from(proposal.id)],
        programId
      );
      
      console.log(`Checking if proposal ${proposal.id} exists at address: ${proposalPDA.toString()}`);
      
      // Check if the proposal exists
      const proposalAccount = await connection.getAccountInfo(proposalPDA);
      
      if (proposalAccount) {
        console.log(`Closing proposal ${proposal.id}...`);
        
        // Create a transaction to close the proposal
        const closeProposalIx = new TransactionInstruction({
          keys: [
            { pubkey: proposalPDA, isSigner: false, isWritable: true },
            { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: false },
          ],
          programId,
          data: CLOSE_PROPOSAL_DISCRIMINATOR,
        });
        
        const transaction = new Transaction().add(closeProposalIx);
        
        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [walletKeypair]
        );
        
        console.log(`Proposal ${proposal.id} closed successfully! Signature: ${signature}`);
      } else {
        console.log(`Proposal ${proposal.id} does not exist, no need to close.`);
      }
    } catch (error) {
      console.error(`Error closing proposal ${proposal.id}:`, error);
    }
  }
  
  // Now create new proposals
  for (const proposal of SIMD_PROPOSALS) {
    try {
      // Derive the proposal PDA
      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('proposal'), Buffer.from(proposal.id)],
        programId
      );
      
      console.log(`Creating proposal ${proposal.id} at address: ${proposalPDA.toString()}`);
      
      // Prepare the data for the initialize proposal instruction
      const endTime = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000); // 30 days from now
      
      // Create a buffer to hold the instruction data
      const dataLayout = Buffer.alloc(1000); // Allocate enough space
      
      // Write the discriminator
      INITIALIZE_PROPOSAL_DISCRIMINATOR.copy(dataLayout, 0);
      
      // Write the proposal ID (as a string)
      const proposalIdBuffer = Buffer.from(proposal.id);
      dataLayout.writeUInt32LE(proposalIdBuffer.length, 8); // String length
      proposalIdBuffer.copy(dataLayout, 12);
      
      // Calculate offset for title
      const titleOffset = 12 + proposalIdBuffer.length;
      
      // Write the title
      const titleBuffer = Buffer.from(proposal.title);
      dataLayout.writeUInt32LE(titleBuffer.length, titleOffset);
      titleBuffer.copy(dataLayout, titleOffset + 4);
      
      // Calculate offset for description
      const descOffset = titleOffset + 4 + titleBuffer.length;
      
      // Write the description
      const descBuffer = Buffer.from(proposal.description);
      dataLayout.writeUInt32LE(descBuffer.length, descOffset);
      descBuffer.copy(dataLayout, descOffset + 4);
      
      // Calculate offset for end time
      const endTimeOffset = descOffset + 4 + descBuffer.length;
      
      // Write the end time (as a u64/BN)
      dataLayout.writeBigUInt64LE(BigInt(endTime), endTimeOffset);
      
      // Calculate the actual data length
      const dataLength = endTimeOffset + 8;
      
      // Create the initialize proposal instruction
      const initProposalIx = new TransactionInstruction({
        keys: [
          { pubkey: proposalPDA, isSigner: false, isWritable: true },
          { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId,
        data: dataLayout.slice(0, dataLength),
      });
      
      const transaction = new Transaction().add(initProposalIx);
      
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [walletKeypair]
      );
      
      console.log(`Proposal ${proposal.id} created successfully! Signature: ${signature}`);
    } catch (error) {
      console.error(`Error creating proposal ${proposal.id}:`, error);
    }
  }
  
  console.log('Proposals updated successfully!');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 