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
const anchor = __importStar(require("@project-serum/anchor"));
const web3_js_1 = require("@solana/web3.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Load the default wallet keypair
function loadWalletKey() {
    try {
        const home = process.env.HOME;
        if (!home)
            throw new Error('HOME environment variable is not defined');
        const keypairPath = path.join(home, '.config', 'solana', 'id.json');
        const keypairString = fs.readFileSync(keypairPath, 'utf8');
        const keypairData = JSON.parse(keypairString);
        return web3_js_1.Keypair.fromSecretKey(new Uint8Array(keypairData));
    }
    catch (error) {
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
// Main function to create all proposals
async function main() {
    try {
        console.log('Creating test proposals on devnet...');
        // Configure the connection to the cluster
        const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)('devnet'), 'confirmed');
        // Load the wallet
        const wallet = new anchor.Wallet(loadWalletKey());
        // Configure the client to use the local cluster
        const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
        anchor.setProvider(provider);
        // Your program ID
        const programId = new web3_js_1.PublicKey('HaEmonFHu9RoLvn1EPreVcfDFmYGQqVdhUsADrAWorfL');
        // Check wallet balance
        const balance = await connection.getBalance(wallet.publicKey);
        console.log(`Wallet balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
        // Request airdrop if balance is low
        if (balance < anchor.web3.LAMPORTS_PER_SOL) {
            console.log('Balance is low, requesting airdrop...');
            const signature = await connection.requestAirdrop(wallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
            await connection.confirmTransaction(signature, 'confirmed');
            const newBalance = await connection.getBalance(wallet.publicKey);
            console.log(`New wallet balance: ${newBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
        }
        // Create each proposal using direct RPC calls
        for (const proposal of proposals) {
            try {
                // Calculate the end time (7 days from now)
                const endTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
                // Derive the proposal PDA
                const [proposalPDA] = await web3_js_1.PublicKey.findProgramAddress([Buffer.from('proposal'), Buffer.from(proposal.id)], programId);
                console.log(`Creating proposal ${proposal.id} at address: ${proposalPDA.toBase58()}`);
                // Create a transaction instruction manually
                const ix = await createInitializeProposalInstruction(programId, proposalPDA, wallet.publicKey, proposal.id, proposal.title, proposal.description, endTime);
                // Create and send the transaction
                const tx = new anchor.web3.Transaction().add(ix);
                const txSignature = await provider.sendAndConfirm(tx);
                console.log(`Proposal ${proposal.id} created successfully! Tx: ${txSignature}`);
            }
            catch (error) {
                console.error(`Error creating proposal ${proposal.id}:`, error);
            }
        }
        console.log('All test proposals created successfully!');
    }
    catch (error) {
        console.error('Error in main function:', error);
    }
}
// Helper function to create the initialize proposal instruction
async function createInitializeProposalInstruction(programId, proposalPDA, authority, proposalId, title, description, endTime) {
    // Initialize proposal instruction discriminator
    const discriminator = Buffer.from([50, 73, 156, 98, 129, 149, 21, 158]);
    // Encode the arguments
    const proposalIdBuffer = Buffer.from(proposalId);
    const titleBuffer = Buffer.from(title);
    const descriptionBuffer = Buffer.from(description);
    const endTimeBuffer = Buffer.alloc(8);
    endTimeBuffer.writeBigInt64LE(BigInt(endTime));
    // Create the data buffer
    const dataLayout = [
        { len: discriminator.length, data: discriminator },
        { len: 4, data: Buffer.alloc(4) }, // proposalId length
        { len: proposalIdBuffer.length, data: proposalIdBuffer },
        { len: 4, data: Buffer.alloc(4) }, // title length
        { len: titleBuffer.length, data: titleBuffer },
        { len: 4, data: Buffer.alloc(4) }, // description length
        { len: descriptionBuffer.length, data: descriptionBuffer },
        { len: 8, data: endTimeBuffer }
    ];
    // Write the lengths
    dataLayout[1].data.writeUInt32LE(proposalIdBuffer.length, 0);
    dataLayout[3].data.writeUInt32LE(titleBuffer.length, 0);
    dataLayout[5].data.writeUInt32LE(descriptionBuffer.length, 0);
    // Concatenate all buffers
    const dataBuffer = Buffer.concat(dataLayout.map(item => item.data));
    // Create the instruction
    return new anchor.web3.TransactionInstruction({
        keys: [
            { pubkey: proposalPDA, isSigner: false, isWritable: true },
            { pubkey: authority, isSigner: true, isWritable: true },
            { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        programId,
        data: dataBuffer
    });
}
// Run the main function
main().then(() => process.exit(0), (error) => {
    console.error(error);
    process.exit(1);
});
