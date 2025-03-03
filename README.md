# Vote Your Stake - Solana Voting System

A decentralized voting system built on Solana that allows users to cast votes weighted by their stake accounts.

## Features

- Connect with any Solana wallet
- View and select from your stake accounts
- Cast weighted votes using your stake amount
- Secure verification of stake account ownership
- Real-time vote tracking

## Project Structure

- `/programs/voteyourstake`: Anchor program (Rust) implementing the voting logic
- `/app`: Next.js frontend application
- `/tests`: Program tests

## Prerequisites

- Node.js 16+ and npm
- Rust and Cargo
- Solana CLI tools
- Anchor CLI
- A Solana wallet (e.g., Phantom)

## Setup

1. Install dependencies:

```bash
# Install Anchor dependencies
npm install

# Install frontend dependencies
cd app
npm install
```

2. Build the Anchor program:

```bash
anchor build
```

3. Deploy the program to devnet:

```bash
anchor deploy
```

4. Update the program ID in both:
   - `programs/voteyourstake/src/lib.rs`
   - `app/src/app/components/VoteInterface.tsx`

5. Start the frontend:

```bash
cd app
npm run dev
```

## Usage

1. Connect your Solana wallet
2. The app will automatically fetch your stake accounts
3. Select a stake account to vote with
4. Choose Yes/No to cast your vote
5. Confirm the transaction in your wallet

## Development

- The Anchor program uses PDAs to store vote accounts
- Votes are weighted by the active stake amount
- Frontend automatically creates vote accounts when needed
- Proper error handling for invalid stake accounts and unauthorized votes

## Security

- Verifies stake account ownership through authorized withdrawer
- Uses PDAs for secure vote account management
- Implements proper access control checks
- Validates all inputs and account relationships

## License

MIT # voteyourstake
