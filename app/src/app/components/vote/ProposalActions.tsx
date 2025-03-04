import React from 'react';
import { Button } from "@/components/ui/button";
import { StakeAccountInfo, ProposalData } from './types';

interface ProposalActionsProps {
  proposal: ProposalData;
  selectedStakeAccounts: StakeAccountInfo[];
  voteLoading: boolean;
  onVote: (proposal: ProposalData, voteValue: number) => void;
}

const ProposalActions: React.FC<ProposalActionsProps> = ({ 
  proposal, 
  selectedStakeAccounts, 
  voteLoading, 
  onVote 
}) => {
  // Check if any of the selected stake accounts are eligible
  const eligibleStakeAccounts = selectedStakeAccounts.filter(acc => acc.isEligible);
  const canVote = eligibleStakeAccounts.length > 0;

  return (
    <div className="flex justify-end space-x-2 mt-4">
      <Button 
        variant="outline" 
        onClick={() => onVote(proposal, 0)}
        disabled={!canVote || voteLoading}
      >
        {voteLoading ? 'Voting...' : 'Vote NO'}
      </Button>
      <Button 
        onClick={() => onVote(proposal, 1)}
        disabled={!canVote || voteLoading}
      >
        {voteLoading ? 'Voting...' : 'Vote YES'}
      </Button>
    </div>
  );
};

export default ProposalActions; 