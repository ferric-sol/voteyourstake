import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { PublicKey, Keypair, Connection, clusterApiUrl } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { idl } from '../src/app/components/vote/idl';

// Load the local keypair for testing
const loadKeypair = (filename: string): Keypair => {
  const keypairFile = fs.readFileSync(filename, 'utf-8');
  const keypairData = JSON.parse(keypairFile);
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
};

// Define the SIMD proposals with exact descriptions from VoteInterface
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

async function main() {
  // Configure the client to use devnet
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Load the deployer keypair (this should be the same keypair used to deploy the program)
  const walletKeypair = loadKeypair(path.resolve(process.env.HOME || '', '.config/solana/id.json'));
  const wallet = new anchor.Wallet(walletKeypair);
  
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
  
  console.log('Creating test proposals on devnet...');
  
  // Create Proposal 228
  const proposal228 = await createProposal(
    program,
    "SIMD-228",
    SIMD_PROPOSALS[0].title,
    SIMD_PROPOSALS[0].description,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    walletKeypair
  );
  
  // Create Proposal 123
  const proposal123 = await createProposal(
    program,
    "SIMD-123",
    SIMD_PROPOSALS[1].title,
    SIMD_PROPOSALS[1].description,
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    walletKeypair
  );
  
  console.log('Test proposals created successfully!');
  console.log('Proposal 228:', proposal228.toString());
  console.log('Proposal 123:', proposal123.toString());
}

async function createProposal(
  program: Program,
  proposalId: string,
  title: string,
  description: string,
  endDate: Date,
  walletKeypair: Keypair
): Promise<PublicKey> {
  try {
    // Derive the proposal PDA
    const [proposalPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('proposal'), Buffer.from(proposalId)],
      program.programId
    );
    
    console.log(`Creating proposal ${proposalId} at address: ${proposalPDA.toString()}`);
    
    // Call the initializeProposal instruction based on the IDL
    await program.methods
      .initializeProposal(
        proposalId,
        title,
        description,
        new anchor.BN(Math.floor(endDate.getTime() / 1000)) // Convert to Unix timestamp
      )
      .accounts({
        proposal: proposalPDA,
        authority: walletKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([walletKeypair])
      .rpc();
    
    return proposalPDA;
  } catch (error) {
    console.error(`Error creating proposal ${proposalId}:`, error);
    throw error;
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
); 