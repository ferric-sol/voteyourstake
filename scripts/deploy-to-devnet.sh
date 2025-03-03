#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Deploying VoteYourStake to Devnet ===${NC}"

# Check if Solana is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}Error: Anchor CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set Solana config to devnet
echo -e "${YELLOW}Setting Solana config to devnet...${NC}"
solana config set --url devnet

# Check wallet balance
BALANCE=$(solana balance)
echo -e "${YELLOW}Current wallet balance: ${BALANCE}${NC}"

# Request airdrop if balance is low
if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo -e "${YELLOW}Requesting airdrop of 2 SOL...${NC}"
    solana airdrop 2
    sleep 2
    NEW_BALANCE=$(solana balance)
    echo -e "${YELLOW}New wallet balance: ${NEW_BALANCE}${NC}"
fi

# Build the program
echo -e "${YELLOW}Building the program...${NC}"
anchor build

# Get the program ID from the keypair
PROGRAM_ID=$(solana-keygen pubkey target/deploy/voteyourstake-keypair.json)
echo -e "${GREEN}Program ID: ${PROGRAM_ID}${NC}"

# Update the program ID in the code if needed
CURRENT_ID=$(grep -o 'declare_id!("[^"]*")' programs/voteyourstake/src/lib.rs | cut -d'"' -f2)

if [ "$CURRENT_ID" != "$PROGRAM_ID" ]; then
    echo -e "${YELLOW}Updating program ID in the code...${NC}"
    # Use sed to replace the program ID in lib.rs
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS requires an empty string for -i
        sed -i '' "s/declare_id!(\"$CURRENT_ID\")/declare_id!(\"$PROGRAM_ID\")/g" programs/voteyourstake/src/lib.rs
    else
        # Linux
        sed -i "s/declare_id!(\"$CURRENT_ID\")/declare_id!(\"$PROGRAM_ID\")/g" programs/voteyourstake/src/lib.rs
    fi
    
    # Also update the program ID in the frontend IDL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS requires an empty string for -i
        sed -i '' "s/\"programId\": \"$CURRENT_ID\"/\"programId\": \"$PROGRAM_ID\"/g" app/src/components/vote/idl.ts
    else
        # Linux
        sed -i "s/\"programId\": \"$CURRENT_ID\"/\"programId\": \"$PROGRAM_ID\"/g" app/src/components/vote/idl.ts
    fi
    
    echo -e "${YELLOW}Program ID updated. Rebuilding...${NC}"
    anchor build
fi

# Deploy the program to devnet
echo -e "${YELLOW}Deploying to devnet...${NC}"
anchor deploy --provider.cluster devnet

# Generate the IDL
echo -e "${YELLOW}Generating IDL...${NC}"
anchor idl init --filepath target/idl/voteyourstake.json "$PROGRAM_ID" --provider.cluster devnet

echo -e "${GREEN}=== Deployment completed successfully! ===${NC}"
echo -e "${GREEN}Program ID: ${PROGRAM_ID}${NC}"
echo -e "${YELLOW}Make sure to update this ID in your frontend code if needed.${NC}" 