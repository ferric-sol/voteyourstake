import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

// Load the IDL
const idlFile = path.join(__dirname, '../target/idl/voteyourstake.json');
const idl = JSON.parse(fs.readFileSync(idlFile, 'utf8'));

// Program ID from your code
const programId = new PublicKey('HaEmonFHu9RoLvn1EPreVcfDFmYGQqVdhUsADrAWorfL');

async function main() {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Create a program interface
  // @ts-ignore - Suppress "Type instantiation is excessively deep" error
  const program = new Program(idl, programId);

  console.log('Program ID:', programId.toString());
  console.log('Wallet:', provider.wallet.publicKey.toString());

  try {
    // Create a proposal
    const proposalId = 'SIMD-228';
    const title = 'Market-based emissions mechanism';
    const description = 'Proposal for introducing a programmatic market-based emission mechanism based on staking participation rate';
    const endTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now

    // Derive the proposal PDA
    const [proposalPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('proposal'), Buffer.from(proposalId)],
      programId
    );

    console.log('Creating proposal with ID:', proposalId);
    console.log('Proposal PDA:', proposalPDA.toString());

    // Initialize the proposal
    // @ts-ignore - Suppress "Type instantiation is excessively deep" error
    const tx = await program.methods
      .initializeProposal(
        proposalId,
        title,
        description,
        new anchor.BN(endTime)
      )
      .accounts({
        proposal: proposalPDA,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log('Transaction signature:', tx);
    console.log('Proposal created successfully!');

    // Fetch the proposal to verify it was created
    // @ts-ignore - Suppress "Property 'proposal' does not exist" error
    const proposal = await program.account.proposal.fetch(proposalPDA);
    console.log('Proposal data:', {
      authority: proposal.authority.toString(),
      proposalId: proposal.proposalId,
      title: proposal.title,
      description: proposal.description,
      yesVotes: proposal.yesVotes.toString(),
      noVotes: proposal.noVotes.toString(),
      endTime: new Date(proposal.endTime.toNumber() * 1000).toISOString(),
      isActive: proposal.isActive,
      voteCount: proposal.voteCount.toString()
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
); 