#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

EXISTING_WALLET="keypairs/new_wallet.json"
TRANSFER_AMOUNT=3.5 # SOL to transfer to the new wallet

echo -e "${GREEN}=== Creating New Wallet with Seed Phrase for Phantom Import ===${NC}"

# Check if Solana is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if existing wallet exists
if [ ! -f "$EXISTING_WALLET" ]; then
    echo -e "${RED}Error: Existing wallet file $EXISTING_WALLET does not exist.${NC}"
    exit 1
fi

# Set Solana config to devnet
echo -e "${YELLOW}Setting Solana config to devnet...${NC}"
solana config set --url devnet

# Create directory for keypairs if it doesn't exist
mkdir -p keypairs

# Generate a new wallet keypair with seed phrase
WALLET_KEYPAIR="keypairs/phantom_wallet.json"
echo -e "${YELLOW}Generating new wallet with seed phrase...${NC}"

# Create a temporary file for the output
OUTPUT_FILE=$(mktemp)

# Generate the keypair and capture the output
solana-keygen new --no-bip39-passphrase --force -o "$WALLET_KEYPAIR" > "$OUTPUT_FILE" 2>&1

# Extract the seed phrase
SEED_PHRASE=$(grep -A 1 "recovery phrase:" "$OUTPUT_FILE" | tail -n 1 | tr -d '[:space:]')

# Get wallet public key
NEW_WALLET_PUBKEY=$(solana-keygen pubkey "$WALLET_KEYPAIR")

echo -e "${GREEN}New wallet public key: ${NEW_WALLET_PUBKEY}${NC}"
echo -e "${GREEN}Seed phrase (for Phantom import): ${SEED_PHRASE}${NC}"

# Save the seed phrase to a file
echo "$SEED_PHRASE" > "keypairs/phantom_wallet_seed_phrase.txt"
echo -e "${YELLOW}Seed phrase saved to keypairs/phantom_wallet_seed_phrase.txt${NC}"

# Transfer SOL from existing wallet to new wallet
echo -e "${YELLOW}Transferring ${TRANSFER_AMOUNT} SOL from existing wallet to new wallet...${NC}"
EXISTING_WALLET_PUBKEY=$(solana-keygen pubkey "$EXISTING_WALLET")
echo -e "${YELLOW}Existing wallet public key: ${EXISTING_WALLET_PUBKEY}${NC}"

solana transfer --from "$EXISTING_WALLET" "$NEW_WALLET_PUBKEY" "$TRANSFER_AMOUNT" --allow-unfunded-recipient

# Check new wallet balance
sleep 2
NEW_BALANCE=$(solana balance "$NEW_WALLET_PUBKEY" | awk '{print $1}')
echo -e "${YELLOW}New wallet balance: ${NEW_BALANCE} SOL${NC}"

echo -e "${GREEN}=== Wallet Created Successfully! ===${NC}"
echo -e "${YELLOW}To import your wallet into Phantom:${NC}"
echo -e "${YELLOW}1. Open Phantom wallet${NC}"
echo -e "${YELLOW}2. Click on the hamburger menu (three lines) in the top left${NC}"
echo -e "${YELLOW}3. Click 'Add/Connect Wallet'${NC}"
echo -e "${YELLOW}4. Select 'Import Wallet'${NC}"
echo -e "${YELLOW}5. Choose 'Recovery Phrase'${NC}"
echo -e "${YELLOW}6. Enter the seed phrase: ${SEED_PHRASE}${NC}"
echo -e "${YELLOW}7. Follow the prompts to complete the import${NC}"
echo ""
echo -e "${GREEN}Wallet public key: ${NEW_WALLET_PUBKEY}${NC}"
echo -e "${GREEN}Seed phrase: ${SEED_PHRASE}${NC}"
echo ""
echo -e "${YELLOW}Note: Make sure Phantom is set to Devnet network before importing${NC}"
echo -e "${YELLOW}Note: Keep your seed phrase secure! Anyone with this phrase can access your wallet.${NC}"

# Clean up the temporary file
rm "$OUTPUT_FILE" 