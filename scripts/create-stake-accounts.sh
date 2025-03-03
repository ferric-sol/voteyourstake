#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

VOTE_ACCOUNT="28rDknpdBPNu5RU9yxbVqqHwnbXB9qaCigw1M53g7Nps"
STAKE_AMOUNT=1 # SOL
NUM_ACCOUNTS=2

echo -e "${GREEN}=== Creating ${NUM_ACCOUNTS} Stake Accounts on Devnet ===${NC}"

# Check if Solana is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set Solana config to devnet
echo -e "${YELLOW}Setting Solana config to devnet...${NC}"
solana config set --url devnet

# Check wallet balance
BALANCE=$(solana balance | awk '{print $1}')
echo -e "${YELLOW}Current wallet balance: ${BALANCE} SOL${NC}"

# Calculate required balance (simple calculation without bc)
REQUIRED_BALANCE=$(($STAKE_AMOUNT * $NUM_ACCOUNTS + 1))
echo -e "${YELLOW}Required balance: ${REQUIRED_BALANCE} SOL${NC}"

# Request airdrop if balance is low
if (( $(echo "$BALANCE < $REQUIRED_BALANCE" | bc -l 2>/dev/null || echo 1) )); then
    echo -e "${YELLOW}Requesting airdrop of 2 SOL...${NC}"
    solana airdrop 2
    sleep 2
    BALANCE=$(solana balance | awk '{print $1}')
    echo -e "${YELLOW}New wallet balance: ${BALANCE} SOL${NC}"
    
    # Check if we need more SOL
    if (( $(echo "$BALANCE < $REQUIRED_BALANCE" | bc -l 2>/dev/null || echo 1) )); then
        echo -e "${YELLOW}Requesting another airdrop of 2 SOL...${NC}"
        solana airdrop 2
        sleep 2
        BALANCE=$(solana balance | awk '{print $1}')
        echo -e "${YELLOW}New wallet balance: ${BALANCE} SOL${NC}"
    fi
fi

# Create directory for keypairs if it doesn't exist
mkdir -p keypairs

# Create and delegate stake accounts
for i in $(seq 1 $NUM_ACCOUNTS); do
    echo -e "${YELLOW}Creating stake account ${i}...${NC}"
    
    # Generate keypair for stake account
    STAKE_KEYPAIR="keypairs/stake_account_${i}.json"
    solana-keygen new --no-passphrase --force -o "$STAKE_KEYPAIR"
    STAKE_PUBKEY=$(solana-keygen pubkey "$STAKE_KEYPAIR")
    
    echo -e "${GREEN}Stake account ${i} public key: ${STAKE_PUBKEY}${NC}"
    
    # Create stake account
    solana create-stake-account --from ~/.config/solana/id.json "$STAKE_KEYPAIR" ${STAKE_AMOUNT}
    
    # Delegate stake to vote account
    echo -e "${YELLOW}Delegating stake account ${i} to vote account ${VOTE_ACCOUNT}...${NC}"
    solana delegate-stake "$STAKE_PUBKEY" "$VOTE_ACCOUNT"
    
    # Export private key in base58 format for Phantom import
    PRIVATE_KEY=$(solana-keygen recover --outfile /dev/stdout < "$STAKE_KEYPAIR" | head -n1)
    echo -e "${GREEN}Private key for stake account ${i} (for Phantom import): ${PRIVATE_KEY}${NC}"
    echo "$PRIVATE_KEY" > "keypairs/stake_account_${i}_private_key.txt"
    
    echo -e "${GREEN}Stake account ${i} created and delegated successfully!${NC}"
    echo -e "${YELLOW}Private key saved to keypairs/stake_account_${i}_private_key.txt${NC}"
    echo ""
done

echo -e "${GREEN}=== All stake accounts created and delegated successfully! ===${NC}"
echo -e "${YELLOW}To import these keys into Phantom:${NC}"
echo -e "${YELLOW}1. Open Phantom wallet${NC}"
echo -e "${YELLOW}2. Click on the hamburger menu (three lines) in the top left${NC}"
echo -e "${YELLOW}3. Click 'Add/Connect Wallet'${NC}"
echo -e "${YELLOW}4. Select 'Import Private Key'${NC}"
echo -e "${YELLOW}5. Paste the private key from the respective keypairs/stake_account_X_private_key.txt file${NC}"
echo -e "${YELLOW}6. Follow the prompts to complete the import${NC}"
echo ""
echo -e "${YELLOW}Note: Make sure Phantom is set to Devnet network before importing${NC}"
echo -e "${YELLOW}Note: It may take some time for the stake to become active${NC}" 