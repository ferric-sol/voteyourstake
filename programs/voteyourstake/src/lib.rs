use anchor_lang::prelude::*;
use anchor_lang::solana_program::stake::state::StakeStateV2;
use anchor_lang::solana_program::hash::{hashv, Hash};
use std::ops::Not;
use std::str::FromStr;
use anchor_lang::Discriminator;

declare_id!("HaEmonFHu9RoLvn1EPreVcfDFmYGQqVdhUsADrAWorfL");

#[program]
pub mod voteyourstake {
    use super::*;

    pub fn initialize_proposal(
        ctx: Context<InitializeProposal>,
        proposal_id: String,
        title: String,
        description: String,
        end_time: i64,
    ) -> Result<()> {
        // Validate inputs to save gas on failed transactions
        require!(proposal_id.len() <= 32, VoteError::ProposalIdTooLong);
        require!(title.len() <= 64, VoteError::TitleTooLong);
        require!(description.len() <= 256, VoteError::DescriptionTooLong);
        
        // Ensure end_time is in the future
        let clock = Clock::get()?;
        require!(end_time > clock.unix_timestamp, VoteError::InvalidEndTime);
        
        let proposal = &mut ctx.accounts.proposal;
        proposal.authority = ctx.accounts.authority.key();
        proposal.proposal_id = proposal_id;
        proposal.title = title;
        proposal.description = description;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.end_time = end_time;
        proposal.is_active = true;
        proposal.vote_count = 0;
        proposal.merkle_root = [0; 32]; // Initialize with zeros
        
        Ok(())
    }

    pub fn cast_vote(
        ctx: Context<CastVote>,
        vote: u8,
    ) -> Result<()> {
        // Validate vote option early to save gas
        require!(vote <= 1, VoteError::InvalidVoteOption);
        
        let proposal = &mut ctx.accounts.proposal;
        let stake_account_pubkey = ctx.accounts.stake_account.key();
        let voter_pubkey = ctx.accounts.voter.key();
        
        // Check if voting period has ended
        let clock = Clock::get()?;
        require!(
            proposal.end_time > clock.unix_timestamp,
            VoteError::VotingPeriodEnded
        );
        
        // Check if proposal is active
        require!(
            proposal.is_active,
            VoteError::ProposalInactive
        );
        
        // Verify the stake account's authorized withdrawer matches the voter
        let stake_state = ctx.accounts.stake_account.stake_state()?;
        
        match stake_state {
            StakeStateV2::Stake(meta, stake, _stake_flags) => {
                // Verify the voter is authorized
                require!(
                    meta.authorized.withdrawer == voter_pubkey,
                    VoteError::UnauthorizedVoter
                );

                // Verify the stake account is delegated to our validator
                let validator_vote_pubkey = Pubkey::from_str("C616NHpqpaiYpqVAv619QL73vEqKJs1mjsJLtAuCzMX6").unwrap();
                require!(
                    stake.delegation.voter_pubkey == validator_vote_pubkey,
                    VoteError::NotDelegatedToValidator
                );

                // Get the stake weight (active stake)
                let stake_weight = stake.delegation.stake;
                
                // Initialize the vote record account
                // The account is now created automatically by Anchor due to the init constraint
                let vote_record = &mut ctx.accounts.vote_record_account;
                vote_record.stake_account = stake_account_pubkey;
                vote_record.proposal = proposal.key();

                // Update vote counts based on yes/no
                match vote {
                    1 => proposal.yes_votes += stake_weight,
                    0 => proposal.no_votes += stake_weight,
                    _ => unreachable!(), // We already validated vote is 0 or 1
                }
                
                // Update the vote count
                proposal.vote_count += 1;
                
                // Update the Merkle root using proper Merkle tree approach
                // Create a leaf node for this vote
                let leaf = create_leaf_node(
                    &stake_account_pubkey, 
                    &proposal.key(), 
                    vote, 
                    stake_weight
                );
                
                // Update the merkle root
                proposal.merkle_root = update_merkle_root(&proposal.merkle_root, &leaf);
                
                Ok(())
            },
            _ => Err(VoteError::InvalidStakeAccount.into())
        }
    }
    
    pub fn close_proposal(ctx: Context<CloseProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        
        // Ensure only the authority can close the proposal
        require!(
            proposal.authority == ctx.accounts.authority.key(),
            VoteError::UnauthorizedAction
        );
        
        // Mark the proposal as inactive
        proposal.is_active = false;
        
        Ok(())
    }
}

// Create a leaf node for the Merkle tree
fn create_leaf_node(
    stake_account: &Pubkey,
    proposal: &Pubkey,
    vote: u8,
    stake_weight: u64,
) -> [u8; 32] {
    // Combine all vote data into a single hash
    let hash = hashv(&[
        stake_account.as_ref(),
        proposal.as_ref(),
        &[vote],
        &stake_weight.to_le_bytes(),
    ]);
    
    let mut result = [0u8; 32];
    result.copy_from_slice(hash.as_ref());
    result
}

// Update the Merkle root with a new leaf
fn update_merkle_root(current_root: &[u8; 32], new_leaf: &[u8; 32]) -> [u8; 32] {
    // If this is the first vote (root is all zeros), just use the leaf as the root
    if current_root.iter().all(|&x| x == 0) {
        return *new_leaf;
    }
    
    // Otherwise, hash the current root with the new leaf to create a new root
    // This is a simplified approach - a full implementation would maintain a balanced tree
    let hash = hashv(&[current_root, new_leaf]);
    
    let mut result = [0u8; 32];
    result.copy_from_slice(hash.as_ref());
    result
}

#[derive(Accounts)]
#[instruction(proposal_id: String, title: String, description: String, end_time: i64)]
pub struct InitializeProposal<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + // discriminator
               32 + // authority: Pubkey
               4 + min(proposal_id.len(), 32) + // proposal_id: String (limited to 32 chars)
               4 + min(title.len(), 64) + // title: String (limited to 64 chars)
               4 + min(description.len(), 256) + // description: String (limited to 256 chars)
               8 + // yes_votes: u64
               8 + // no_votes: u64
               8 + // end_time: i64
               1 + // is_active: bool
               8 + // vote_count: u64
               32, // merkle_root: [u8; 32]
        seeds = [b"proposal", proposal_id.as_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    
    /// CHECK: Stake account is verified in the instruction
    pub stake_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub voter: Signer<'info>,
    
    // Modified to use Anchor's init constraint for proper PDA handling
    #[account(
        init,
        payer = voter,
        space = 8 + 32 + 32, // discriminator + stake_account pubkey + proposal pubkey
        seeds = [
            b"vote_record",
            proposal.key().as_ref(),
            stake_account.key().as_ref()
        ],
        bump
    )]
    pub vote_record_account: Account<'info, VoteRecord>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    
    #[account(
        constraint = proposal.authority == authority.key() @ VoteError::UnauthorizedAction
    )]
    pub authority: Signer<'info>,
}

#[account]
pub struct Proposal {
    pub authority: Pubkey,
    pub proposal_id: String,
    pub title: String,
    pub description: String,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub end_time: i64,
    pub is_active: bool,
    pub vote_count: u64,
    pub merkle_root: [u8; 32],
}

#[account]
pub struct VoteRecord {
    pub stake_account: Pubkey,
    pub proposal: Pubkey,
}

#[error_code]
pub enum VoteError {
    #[msg("Unauthorized voter")]
    UnauthorizedVoter,
    
    #[msg("Invalid vote option - must be 0 or 1")]
    InvalidVoteOption,
    
    #[msg("Invalid stake account - must be initialized stake account")]
    InvalidStakeAccount,
    
    #[msg("This stake account has already voted")]
    AlreadyVoted,
    
    #[msg("Unauthorized action")]
    UnauthorizedAction,
    
    #[msg("Voting period has ended")]
    VotingPeriodEnded,
    
    #[msg("Proposal is no longer active")]
    ProposalInactive,
    
    #[msg("Proposal ID too long - maximum 32 characters")]
    ProposalIdTooLong,
    
    #[msg("Title too long - maximum 64 characters")]
    TitleTooLong,
    
    #[msg("Description too long - maximum 256 characters")]
    DescriptionTooLong,
    
    #[msg("End time must be in the future")]
    InvalidEndTime,
    
    #[msg("Stake account is not delegated to the validator")]
    NotDelegatedToValidator,
}

trait StakeAccountLoader {
    fn stake_state(&self) -> Result<StakeStateV2>;
}

impl<'info> StakeAccountLoader for AccountInfo<'info> {
    fn stake_state(&self) -> Result<StakeStateV2> {
        let data = self.try_borrow_data()?;
        let stake_state = anchor_lang::solana_program::borsh::try_from_slice_unchecked::<StakeStateV2>(&data)
            .map_err(|_| error!(VoteError::InvalidStakeAccount))?;
        Ok(stake_state)
    }
}

// Helper function to limit string length for account space calculation
const fn min(a: usize, b: usize) -> usize {
    if a < b { a } else { b }
}
