#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

VOTE_ACCOUNT="28rDknpdBPNu5RU9yxbVqqHwnbXB9qaCigw1M53g7Nps"
STAKE_AMOUNT=0.5 # SOL
NUM_ACCOUNTS=2

echo -e "${GREEN}=== Creating New Wallet and ${NUM_ACCOUNTS} Stake Accounts on Devnet ===${NC}"

# Check if Solana is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set Solana config to devnet
echo -e "${YELLOW}Setting Solana config to devnet...${NC}"
solana config set --url devnet

# Create directory for keypairs if it doesn't exist
mkdir -p keypairs

# Generate a new wallet keypair
WALLET_KEYPAIR="keypairs/new_wallet.json"
echo -e "${YELLOW}Generating new wallet...${NC}"
solana-keygen new --no-passphrase --force -o "$WALLET_KEYPAIR"
WALLET_PUBKEY=$(solana-keygen pubkey "$WALLET_KEYPAIR")

echo -e "${GREEN}New wallet public key: ${WALLET_PUBKEY}${NC}"

# Display the seed phrase for manual recovery
echo -e "${YELLOW}Please save the seed phrase shown above to recover your wallet if needed.${NC}"

# Request airdrop for the new wallet with retry
echo -e "${YELLOW}Requesting airdrop of 2 SOL...${NC}"
MAX_RETRIES=5
RETRY_COUNT=0
AIRDROP_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$AIRDROP_SUCCESS" = false ]; do
    if solana airdrop 2 "$WALLET_PUBKEY"; then
        AIRDROP_SUCCESS=true
        echo -e "${GREEN}Airdrop successful!${NC}"
    else
        RETRY_COUNT=$((RETRY_COUNT+1))
        echo -e "${YELLOW}Airdrop failed. Retrying in 5 seconds... (Attempt $RETRY_COUNT of $MAX_RETRIES)${NC}"
        sleep 5
    fi
done

if [ "$AIRDROP_SUCCESS" = false ]; then
    echo -e "${RED}Failed to airdrop after $MAX_RETRIES attempts. Please try again later.${NC}"
    exit 1
fi

sleep 2

# Check wallet balance
BALANCE=$(solana balance "$WALLET_PUBKEY" | awk '{print $1}')
echo -e "${YELLOW}New wallet balance: ${BALANCE} SOL${NC}"

# Create and delegate stake accounts
for i in $(seq 1 $NUM_ACCOUNTS); do
    echo -e "${YELLOW}Creating stake account ${i}...${NC}"
    
    # Generate keypair for stake account
    STAKE_KEYPAIR="keypairs/new_stake_account_${i}.json"
    solana-keygen new --no-passphrase --force -o "$STAKE_KEYPAIR"
    STAKE_PUBKEY=$(solana-keygen pubkey "$STAKE_KEYPAIR")
    
    echo -e "${GREEN}Stake account ${i} public key: ${STAKE_PUBKEY}${NC}"
    
    # Create stake account
    solana create-stake-account --from "$WALLET_KEYPAIR" "$STAKE_KEYPAIR" ${STAKE_AMOUNT}
    
    # Delegate stake to vote account
    echo -e "${YELLOW}Delegating stake account ${i} to vote account ${VOTE_ACCOUNT}...${NC}"
    solana delegate-stake --keypair "$WALLET_KEYPAIR" "$STAKE_PUBKEY" "$VOTE_ACCOUNT"
    
    echo -e "${GREEN}Stake account ${i} created and delegated successfully!${NC}"
done

# Check final wallet balance
FINAL_BALANCE=$(solana balance "$WALLET_PUBKEY" | awk '{print $1}')
echo -e "${YELLOW}Final wallet balance: ${FINAL_BALANCE} SOL${NC}"

echo -e "${GREEN}=== All stake accounts created and delegated successfully! ===${NC}"
echo -e "${YELLOW}To import your wallet into Phantom:${NC}"
echo -e "${YELLOW}1. Open Phantom wallet${NC}"
echo -e "${YELLOW}2. Click on the hamburger menu (three lines) in the top left${NC}"
echo -e "${YELLOW}3. Click 'Add/Connect Wallet'${NC}"
echo -e "${YELLOW}4. Select 'Import Private Key'${NC}"
echo -e "${YELLOW}5. Use the seed phrase displayed when the wallet was created${NC}"
echo -e "${YELLOW}6. Follow the prompts to complete the import${NC}"
echo ""
echo -e "${GREEN}Wallet public key: ${WALLET_PUBKEY}${NC}"
echo ""
echo -e "${YELLOW}Note: Make sure Phantom is set to Devnet network before importing${NC}"
echo -e "${YELLOW}Note: It may take some time for the stake to become active${NC}" 