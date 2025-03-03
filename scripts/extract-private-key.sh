#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if a keypair file was provided
if [ "$#" -ne 1 ]; then
    echo -e "${RED}Usage: $0 <keypair_file>${NC}"
    echo -e "${YELLOW}Example: $0 keypairs/new_wallet.json${NC}"
    exit 1
fi

KEYPAIR_FILE="$1"

# Check if the keypair file exists
if [ ! -f "$KEYPAIR_FILE" ]; then
    echo -e "${RED}Error: Keypair file $KEYPAIR_FILE does not exist.${NC}"
    exit 1
fi

echo -e "${GREEN}=== Extracting Private Key from $KEYPAIR_FILE ===${NC}"

# Get the public key
PUBKEY=$(solana-keygen pubkey "$KEYPAIR_FILE")
echo -e "${GREEN}Public key: $PUBKEY${NC}"

# Extract the private key (first 32 bytes of the keypair file)
# This is a bit hacky but works for Solana keypairs
echo -e "${YELLOW}Extracting private key...${NC}"
PRIVATE_KEY=$(python3 -c "
import json, base58, sys
with open('$KEYPAIR_FILE', 'r') as f:
    keypair = json.load(f)
# The first 32 bytes are the private key
private_key_bytes = bytes(keypair[:32])
# Encode in base58 for Phantom
private_key_base58 = base58.b58encode(private_key_bytes).decode('ascii')
print(private_key_base58)
")

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: Failed to extract private key. Make sure python3 and base58 are installed.${NC}"
    echo -e "${YELLOW}You can install base58 with: pip3 install base58${NC}"
    exit 1
fi

echo -e "${GREEN}Private key (for Phantom import): $PRIVATE_KEY${NC}"

# Save the private key to a file
echo "$PRIVATE_KEY" > "${KEYPAIR_FILE%.json}_private_key.txt"
echo -e "${YELLOW}Private key saved to ${KEYPAIR_FILE%.json}_private_key.txt${NC}"

echo -e "${GREEN}=== Private Key Extracted Successfully! ===${NC}"
echo -e "${YELLOW}To import your wallet into Phantom:${NC}"
echo -e "${YELLOW}1. Open Phantom wallet${NC}"
echo -e "${YELLOW}2. Click on the hamburger menu (three lines) in the top left${NC}"
echo -e "${YELLOW}3. Click 'Add/Connect Wallet'${NC}"
echo -e "${YELLOW}4. Select 'Import Private Key'${NC}"
echo -e "${YELLOW}5. Paste the private key: $PRIVATE_KEY${NC}"
echo -e "${YELLOW}6. Follow the prompts to complete the import${NC}"
echo ""
echo -e "${YELLOW}Note: Make sure Phantom is set to Devnet network before importing${NC}"
echo -e "${RED}IMPORTANT: Keep your private key secure! Anyone with this key can access your wallet.${NC}" 