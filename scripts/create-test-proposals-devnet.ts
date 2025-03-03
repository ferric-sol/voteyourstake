import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

// Configure the connection to the cluster
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Configure the client to use the local cluster
anchor.setProvider(
  new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(loadWalletKey()),
    { preflightCommitment: 'confirmed' }
  )
);

// Your program ID from the IDL
const programId = new PublicKey('HaEmonFHu9RoLvn1EPreVcfDFmYGQqVdhUsADrAWorfL');

// Load the IDL
const idl = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../target/idl/voteyourstake.json'),
    'utf8'
  )
);

// Create the program interface
const program = new Program(idl, programId);

// Load the default wallet keypair
function loadWalletKey(): Keypair {
  try {
    const home = process.env.HOME;
    if (!home) throw new Error('HOME environment variable is not defined');
    
    const keypairPath = path.join(home, '.config', 'solana', 'id.json');
    const keypairString = fs.readFileSync(keypairPath, 'utf8');
    const keypairData = JSON.parse(keypairString);
    return Keypair.fromSecretKey(new Uint8Array(keypairData));
  } catch (error) {
    console.error('Error loading wallet key:', error);
    throw error;
  }
}

// Define the proposals to create
const proposals = [
  {
    id: 'SIMD-228',
    title: 'Increase Validator Commission to 8%',
    description: 'This proposal aims to increase the validator commission from the current 5% to 8% to better support network security and validator operations.',
    link: 'https://forum.solana.com/t/proposal-increase-validator-commission/123',
  },
  {
    id: 'SIMD-123',
    title: 'Add New Governance Features',
    description: 'Implement additional governance features including delegation of voting power and time-locked proposals to enhance the governance process.',
    link: 'https://forum.solana.com/t/proposal-governance-enhancements/456',
  }
];

// Function to create a proposal
async function createProposal(
  proposalId: string,
  title: string,
  description: string,
  link: string
): Promise<void> {
  try {
    // Calculate the end time (7 days from now)
    const endTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    
    // Derive the proposal PDA
    const [proposalPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('proposal'), Buffer.from(proposalId)],
      program.programId
    );
    
    console.log(`Creating proposal ${proposalId} at address: ${proposalPDA.toBase58()}`);
    
    // Initialize the proposal
    await program.methods
      .initializeProposal(
        proposalId,
        title,
        description,
        new anchor.BN(endTime)
      )
      .accounts({
        proposal: proposalPDA,
        authority: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log(`Proposal ${proposalId} created successfully!`);
  } catch (error) {
    console.error(`Error creating proposal ${proposalId}:`, error);
  }
}

// Main function to create all proposals
async function main() {
  console.log('Creating test proposals on devnet...');
  
  // Check wallet balance
  const balance = await connection.getBalance(program.provider.wallet.publicKey);
  console.log(`Wallet balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
  
  // Create each proposal
  for (const proposal of proposals) {
    await createProposal(
      proposal.id,
      proposal.title,
      proposal.description,
      proposal.link
    );
  }
  
  console.log('All test proposals created successfully!');
}

// Run the main function
main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
); 