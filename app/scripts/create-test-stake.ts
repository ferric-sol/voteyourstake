import * as web3 from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

// Load the local keypair for testing
const loadKeypair = (filename: string): web3.Keypair => {
  const keypairFile = fs.readFileSync(filename, 'utf-8');
  const keypairData = JSON.parse(keypairFile);
  return web3.Keypair.fromSecretKey(new Uint8Array(keypairData));
};

async function main() {
  // Configure the client to use devnet
  const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
  
  // Load the wallet keypair
  const walletKeypair = loadKeypair(path.resolve(process.env.HOME || '', '.config/solana/id.json'));
  
  console.log('Creating test stake accounts on devnet...');
  console.log('Wallet address:', walletKeypair.publicKey.toBase58());
  
  // Check wallet balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`Wallet balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
  
  if (balance < web3.LAMPORTS_PER_SOL * 2) {
    console.log('Requesting airdrop...');
    const signature = await connection.requestAirdrop(
      walletKeypair.publicKey,
      1 * web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    console.log('Airdrop confirmed');
  }
  
  // Create 3 stake accounts with different amounts
  const stakeAmounts = [0.1, 0.2, 0.3]; // SOL - using smaller amounts for devnet
  
  for (let i = 0; i < stakeAmounts.length; i++) {
    const stakeAmount = stakeAmounts[i];
    console.log(`Creating stake account #${i+1} with ${stakeAmount} SOL...`);
    
    // Create a new stake account keypair
    const stakeAccount = web3.Keypair.generate();
    
    // Calculate the rent-exempt reserve for a stake account
    const rentExemptReserve = await connection.getMinimumBalanceForRentExemption(
      web3.StakeProgram.space
    );
    
    // Create stake account transaction
    const createStakeAccountTx = web3.StakeProgram.createAccount({
      fromPubkey: walletKeypair.publicKey,
      stakePubkey: stakeAccount.publicKey,
      authorized: {
        staker: walletKeypair.publicKey,
        withdrawer: walletKeypair.publicKey,
      },
      lamports: rentExemptReserve + stakeAmount * web3.LAMPORTS_PER_SOL,
    });
    
    // Get a recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    createStakeAccountTx.recentBlockhash = blockhash;
    createStakeAccountTx.feePayer = walletKeypair.publicKey;
    
    // Sign the transaction
    createStakeAccountTx.sign(walletKeypair, stakeAccount);
    
    // Send the transaction
    const signature = await web3.sendAndConfirmTransaction(
      connection,
      createStakeAccountTx,
      [walletKeypair, stakeAccount]
    );
    
    console.log(`Stake account #${i+1} created with address: ${stakeAccount.publicKey.toBase58()}`);
    console.log(`Transaction signature: ${signature}`);
    
    // Get validator identity to delegate to
    const validators = await connection.getVoteAccounts();
    if (validators.current.length === 0 && validators.delinquent.length === 0) {
      console.log('No validators found. Skipping delegation.');
      continue;
    }
    
    // Choose the first validator
    const validator = validators.current[0] || validators.delinquent[0];
    const validatorVoteAccount = new web3.PublicKey(validator.votePubkey);
    
    console.log(`Delegating to validator: ${validatorVoteAccount.toBase58()}`);
    
    // Delegate stake transaction
    const delegateTx = web3.StakeProgram.delegate({
      stakePubkey: stakeAccount.publicKey,
      authorizedPubkey: walletKeypair.publicKey,
      votePubkey: validatorVoteAccount,
    });
    
    // Get a recent blockhash
    const { blockhash: delegateBlockhash } = await connection.getLatestBlockhash();
    delegateTx.recentBlockhash = delegateBlockhash;
    delegateTx.feePayer = walletKeypair.publicKey;
    
    // Sign and send the transaction
    const delegateSignature = await web3.sendAndConfirmTransaction(
      connection,
      delegateTx,
      [walletKeypair]
    );
    
    console.log(`Stake delegated. Transaction signature: ${delegateSignature}`);
  }
  
  console.log('Test stake accounts created and delegated successfully!');
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
); 