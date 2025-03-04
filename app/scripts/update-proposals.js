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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var anchor = __importStar(require("@coral-xyz/anchor"));
var anchor_1 = require("@coral-xyz/anchor");
var web3_js_1 = require("@solana/web3.js");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var idl_1 = require("../src/app/components/vote/idl");
// Define the SIMD proposals with updated information
var SIMD_PROPOSALS = [
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
    var keypairData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return web3_js_1.Keypair.fromSecretKey(new Uint8Array(keypairData));
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var connection, walletKeypair, wallet, balance, signature, provider, programId, program, _i, SIMD_PROPOSALS_1, proposal, proposalPDA, proposalAccount, error_1, _a, SIMD_PROPOSALS_2, proposal, proposalPDA, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)('devnet'), 'confirmed');
                    walletKeypair = loadKeypair(path.resolve(process.env.HOME || '', '.config/solana/id.json'));
                    wallet = new anchor.Wallet(walletKeypair);
                    console.log('Using wallet address:', walletKeypair.publicKey.toBase58());
                    return [4 /*yield*/, connection.getBalance(walletKeypair.publicKey)];
                case 1:
                    balance = _b.sent();
                    console.log("Wallet balance: ".concat(balance / 1000000000, " SOL"));
                    if (!(balance < 1000000000)) return [3 /*break*/, 4];
                    console.log('Requesting airdrop...');
                    return [4 /*yield*/, connection.requestAirdrop(walletKeypair.publicKey, 1000000000 // 1 SOL
                        )];
                case 2:
                    signature = _b.sent();
                    return [4 /*yield*/, connection.confirmTransaction(signature)];
                case 3:
                    _b.sent();
                    console.log('Airdrop confirmed');
                    _b.label = 4;
                case 4:
                    provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
                    // Set the provider as the default one
                    anchor.setProvider(provider);
                    programId = new web3_js_1.PublicKey(idl_1.idl.address);
                    program = new anchor_1.Program(idl_1.idl, programId);
                    console.log('Updating proposals on devnet...');
                    _i = 0, SIMD_PROPOSALS_1 = SIMD_PROPOSALS;
                    _b.label = 5;
                case 5:
                    if (!(_i < SIMD_PROPOSALS_1.length)) return [3 /*break*/, 13];
                    proposal = SIMD_PROPOSALS_1[_i];
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 11, , 12]);
                    proposalPDA = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('proposal'), Buffer.from(proposal.id)], program.programId)[0];
                    console.log("Checking if proposal ".concat(proposal.id, " exists at address: ").concat(proposalPDA.toString()));
                    return [4 /*yield*/, connection.getAccountInfo(proposalPDA)];
                case 7:
                    proposalAccount = _b.sent();
                    if (!proposalAccount) return [3 /*break*/, 9];
                    console.log("Closing proposal ".concat(proposal.id, "..."));
                    // Close the proposal
                    return [4 /*yield*/, program.methods
                            .closeProposal()
                            .accounts({
                            proposal: proposalPDA,
                            authority: walletKeypair.publicKey,
                        })
                            .signers([walletKeypair])
                            .rpc()];
                case 8:
                    // Close the proposal
                    _b.sent();
                    console.log("Proposal ".concat(proposal.id, " closed successfully!"));
                    return [3 /*break*/, 10];
                case 9:
                    console.log("Proposal ".concat(proposal.id, " does not exist, no need to close."));
                    _b.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    error_1 = _b.sent();
                    console.error("Error closing proposal ".concat(proposal.id, ":"), error_1);
                    return [3 /*break*/, 12];
                case 12:
                    _i++;
                    return [3 /*break*/, 5];
                case 13:
                    _a = 0, SIMD_PROPOSALS_2 = SIMD_PROPOSALS;
                    _b.label = 14;
                case 14:
                    if (!(_a < SIMD_PROPOSALS_2.length)) return [3 /*break*/, 19];
                    proposal = SIMD_PROPOSALS_2[_a];
                    _b.label = 15;
                case 15:
                    _b.trys.push([15, 17, , 18]);
                    return [4 /*yield*/, createProposal(program, proposal.id, proposal.title, proposal.description, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                        walletKeypair)];
                case 16:
                    proposalPDA = _b.sent();
                    console.log("Proposal ".concat(proposal.id, " created successfully at address: ").concat(proposalPDA.toString()));
                    return [3 /*break*/, 18];
                case 17:
                    error_2 = _b.sent();
                    console.error("Error creating proposal ".concat(proposal.id, ":"), error_2);
                    return [3 /*break*/, 18];
                case 18:
                    _a++;
                    return [3 /*break*/, 14];
                case 19:
                    console.log('Proposals updated successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
function createProposal(program, proposalId, title, description, endDate, walletKeypair) {
    return __awaiter(this, void 0, void 0, function () {
        var proposalPDA, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    proposalPDA = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('proposal'), Buffer.from(proposalId)], program.programId)[0];
                    console.log("Creating proposal ".concat(proposalId, " at address: ").concat(proposalPDA.toString()));
                    // Call the initializeProposal instruction based on the IDL
                    return [4 /*yield*/, program.methods
                            .initializeProposal(proposalId, title, description, new anchor.BN(Math.floor(endDate.getTime() / 1000)) // Convert to Unix timestamp
                        )
                            .accounts({
                            proposal: proposalPDA,
                            authority: walletKeypair.publicKey,
                            systemProgram: anchor.web3.SystemProgram.programId,
                        })
                            .signers([walletKeypair])
                            .rpc()];
                case 1:
                    // Call the initializeProposal instruction based on the IDL
                    _a.sent();
                    return [2 /*return*/, proposalPDA];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error creating proposal ".concat(proposalId, ":"), error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error('Error:', error);
    process.exit(1);
});
