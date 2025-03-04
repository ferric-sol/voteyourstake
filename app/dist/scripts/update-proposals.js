"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const idl_1 = require("../src/app/components/vote/idl");
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
function loadKeypair(filePath) {
    const keypairData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return web3_js_1.Keypair.fromSecretKey(new Uint8Array(keypairData));
}
async function main() {
    // Configure the client to use devnet
    const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)('devnet'), 'confirmed');
    // Load the deployer keypair (this should be the same keypair used to deploy the program)
    const walletKeypair = loadKeypair(path.resolve(process.env.HOME || '', '.config/solana/id.json'));
    const wallet = new anchor.Wallet(walletKeypair);
    console.log('Using wallet address:', walletKeypair.publicKey.toBase58());
    // Check wallet balance
    const balance = await connection.getBalance(walletKeypair.publicKey);
    console.log(`Wallet balance: ${balance / 1000000000} SOL`);
    if (balance < 1000000000) {
        console.log('Requesting airdrop...');
        const signature = await connection.requestAirdrop(walletKeypair.publicKey, 1000000000 // 1 SOL
        );
        await connection.confirmTransaction(signature);
        console.log('Airdrop confirmed');
    }
    // Create the provider
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    // Set the provider as the default one
    anchor.setProvider(provider);
    // Get the program ID from the IDL
    const programId = new web3_js_1.PublicKey(idl_1.idl.address);
    // Create the program interface
    // @ts-ignore - Suppress TypeScript errors for now
    const program = new anchor_1.Program(idl_1.idl, programId);
    console.log('Updating proposals on devnet...');
    // First, close existing proposals
    for (const proposal of SIMD_PROPOSALS) {
        try {
            // Derive the proposal PDA
            const [proposalPDA] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('proposal'), Buffer.from(proposal.id)], program.programId);
            console.log(`Checking if proposal ${proposal.id} exists at address: ${proposalPDA.toString()}`);
            // Check if the proposal exists
            const proposalAccount = await connection.getAccountInfo(proposalPDA);
            if (proposalAccount) {
                console.log(`Closing proposal ${proposal.id}...`);
                // Close the proposal
                await program.methods
                    .closeProposal()
                    .accounts({
                    proposal: proposalPDA,
                    authority: walletKeypair.publicKey,
                })
                    .signers([walletKeypair])
                    .rpc();
                console.log(`Proposal ${proposal.id} closed successfully!`);
            }
            else {
                console.log(`Proposal ${proposal.id} does not exist, no need to close.`);
            }
        }
        catch (error) {
            console.error(`Error closing proposal ${proposal.id}:`, error);
        }
    }
    // Now create new proposals
    for (const proposal of SIMD_PROPOSALS) {
        try {
            // Create a new proposal
            const proposalPDA = await createProposal(program, proposal.id, proposal.title, proposal.description, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            walletKeypair);
            console.log(`Proposal ${proposal.id} created successfully at address: ${proposalPDA.toString()}`);
        }
        catch (error) {
            console.error(`Error creating proposal ${proposal.id}:`, error);
        }
    }
    console.log('Proposals updated successfully!');
}
async function createProposal(program, proposalId, title, description, endDate, walletKeypair) {
    try {
        // Derive the proposal PDA
        const [proposalPDA] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('proposal'), Buffer.from(proposalId)], program.programId);
        console.log(`Creating proposal ${proposalId} at address: ${proposalPDA.toString()}`);
        // Call the initializeProposal instruction based on the IDL
        await program.methods
            .initializeProposal(proposalId, title, description, new anchor.BN(Math.floor(endDate.getTime() / 1000)) // Convert to Unix timestamp
        )
            .accounts({
            proposal: proposalPDA,
            authority: walletKeypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
            .signers([walletKeypair])
            .rpc();
        return proposalPDA;
    }
    catch (error) {
        console.error(`Error creating proposal ${proposalId}:`, error);
        throw error;
    }
}
main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
