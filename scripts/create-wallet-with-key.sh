#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Creating New Wallet for Phantom Import ===${NC}"

# Check if Solana is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Create directory for keypairs if it doesn't exist
mkdir -p keypairs

# Generate a new wallet keypair
WALLET_KEYPAIR="keypairs/phantom_wallet.json"
echo -e "${YELLOW}Generating new wallet...${NC}"

# Create a temporary file for the seed phrase
SEED_PHRASE_FILE=$(mktemp)

# Generate the keypair and capture the seed phrase
solana-keygen new --no-passphrase --force -o "$WALLET_KEYPAIR" | grep -A 1 "seed phrase" | tail -n 1 > "$SEED_PHRASE_FILE"

# Get the seed phrase
SEED_PHRASE=$(cat "$SEED_PHRASE_FILE")

# Get wallet public key
WALLET_PUBKEY=$(solana-keygen pubkey "$WALLET_KEYPAIR")

echo -e "${GREEN}New wallet public key: ${WALLET_PUBKEY}${NC}"
echo -e "${GREEN}Seed phrase (for Phantom import): ${SEED_PHRASE}${NC}"

# Save the seed phrase to a file
echo "$SEED_PHRASE" > "keypairs/phantom_wallet_seed_phrase.txt"
echo -e "${YELLOW}Seed phrase saved to keypairs/phantom_wallet_seed_phrase.txt${NC}"

# Set Solana config to devnet
echo -e "${YELLOW}Setting Solana config to devnet...${NC}"
solana config set --url devnet

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
echo -e "${GREEN}Wallet public key: ${WALLET_PUBKEY}${NC}"
echo -e "${GREEN}Seed phrase: ${SEED_PHRASE}${NC}"
echo ""
echo -e "${YELLOW}Note: Make sure Phantom is set to Devnet network before importing${NC}"
echo -e "${YELLOW}Note: Keep your seed phrase secure! Anyone with this phrase can access your wallet.${NC}"

# Clean up the temporary file
rm "$SEED_PHRASE_FILE" 