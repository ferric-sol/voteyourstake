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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@project-serum/anchor"));
const anchor_1 = require("@project-serum/anchor");
const web3_js_1 = require("@solana/web3.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const idl_1 = require("../src/components/vote/idl");
// Load the local keypair for testing
const loadKeypair = (filename) => {
    const keypairFile = fs_1.default.readFileSync(filename, 'utf-8');
    const keypairData = JSON.parse(keypairFile);
    return anchor.web3.Keypair.fromSecretKey(new Uint8Array(keypairData));
};
async function main() {
    // Configure the client to use devnet
    const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)('devnet'), 'confirmed');
    // Load the deployer keypair
    const walletKeypair = loadKeypair(path_1.default.resolve(process.env.HOME || '', '.config/solana/id.json'));
    const wallet = new anchor.Wallet(walletKeypair);
    // Create the provider
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    // Set the provider as the default one
    anchor.setProvider(provider);
    // Get the program ID from the IDL
    const programId = new web3_js_1.PublicKey(idl_1.idl.programId);
    // Create the program interface
    const program = new anchor_1.Program(idl_1.idl, programId);
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
        allProposals.forEach((item, index) => {
            const account = item.account;
            const pubkey = item.publicKey;
            console.log(`\nProposal #${index + 1}:`);
            console.log(`Address: ${pubkey.toString()}`);
            console.log(`ID: ${account.proposalId}`);
            console.log(`Title: ${account.title}`);
            console.log(`Description: ${account.description}`);
            console.log(`Authority: ${account.authority.toString()}`);
            console.log(`Yes Votes: ${Number(account.yesVotes) / web3_js_1.LAMPORTS_PER_SOL} SOL`);
            console.log(`No Votes: ${Number(account.noVotes) / web3_js_1.LAMPORTS_PER_SOL} SOL`);
            console.log(`End Time: ${new Date(Number(account.endTime) * 1000).toLocaleString()}`);
            console.log(`Is Active: ${account.isActive}`);
            console.log(`Vote Count: ${Number(account.voteCount)}`);
        });
    }
    catch (error) {
        console.error('Error fetching proposals:', error);
    }
}
main().then(() => process.exit(0), (error) => {
    console.error(error);
    process.exit(1);
});
