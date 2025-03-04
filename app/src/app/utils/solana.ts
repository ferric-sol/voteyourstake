import { Connection, PublicKey, LAMPORTS_PER_SOL, StakeProgram } from '@solana/web3.js';
import { StakeAccountInfo } from '../components/vote/types';

// Our validator pubkey that stake accounts must be delegated to
const VALIDATOR_VOTE_PUBKEY = new PublicKey('28rDknpdBPNu5RU9yxbVqqHwnbXB9qaCigw1M53g7Nps');

/**
 * Gets stake accounts for a wallet
 * @param connection Solana connection
 * @param walletPublicKey The wallet public key
 * @returns Array of stake accounts
 */
export const getStakeAccounts = async (
  connection: Connection,
  walletPublicKey: PublicKey
): Promise<StakeAccountInfo[]> => {
  try {
    console.log('Fetching stake accounts for wallet:', walletPublicKey.toString());
    
    // Get all accounts owned by the Stake Program with the wallet as the authorizer
    const accounts = await connection.getParsedProgramAccounts(
      StakeProgram.programId,
      {
        filters: [
          // Filter for stake accounts that have a withdrawer matching the wallet's pubkey
          {
            memcmp: {
              offset: 44, // Offset for the withdrawer authority in the stake account data
              bytes: walletPublicKey.toBase58(),
            },
          },
        ],
      }
    );
    
    console.log('Found stake accounts:', accounts.length);
    
    if (accounts.length === 0) {
      return [];
    }
    
    // Map accounts to our format
    const mappedAccounts = accounts
      .map((acc): StakeAccountInfo | null => {
        const parsedData = (acc.account.data as any).parsed.info;
        const stakeData = parsedData.stake;
        
        // Calculate the actual stake amount (delegated stake)
        const stakeAmount = stakeData?.delegation?.stake 
          ? stakeData.delegation.stake / LAMPORTS_PER_SOL 
          : 0;
        
        // Get the withdrawer authority pubkey if available
        const withdrawerAuthority = parsedData.meta?.authorized?.withdrawer || null;
        
        // Double-check that we're the withdrawer authority
        const isWithdrawer = withdrawerAuthority && 
                          walletPublicKey && 
                          withdrawerAuthority === walletPublicKey.toString();
        
        // We'll only include accounts where we're the withdrawer authority
        // This prevents confusion and errors when trying to vote
        if (!isWithdrawer) {
          console.log(`Skipping stake account ${acc.pubkey.toString()} - not the withdrawer authority`);
          return null;
        }
        
        // Get the validator vote pubkey this stake account is delegated to (if any)
        const validatorVote = stakeData?.delegation?.voter || null;
        
        // Check if this stake account is delegated to our validator
        const isEligible = validatorVote === VALIDATOR_VOTE_PUBKEY.toString();
        
        return {
          pubkey: acc.pubkey.toString(),
          stake: stakeAmount,
          withdrawer: withdrawerAuthority,
          staker: parsedData.meta?.authorized?.staker || withdrawerAuthority,
          validatorVote: validatorVote,
          isEligible: isEligible,
          hasVoted: false, // This will be checked later
          selected: false,
        };
      })
      .filter((acc): acc is StakeAccountInfo => acc !== null);
    
    console.log('Mapped stake accounts:', mappedAccounts);
    return mappedAccounts;
  } catch (error) {
    console.error('Error fetching stake accounts:', error);
    throw error;
  }
}; 