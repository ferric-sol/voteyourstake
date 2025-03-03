import React from 'react';
import { Button } from "@/components/ui/button";
import { StakeAccountInfo } from './types';

interface ProposalActionsProps {
  proposal: any;
  selectedStakeAccounts: StakeAccountInfo[];
  voteLoading: boolean;
  onVote: (proposal: any, voteValue: number) => void;
}

const ProposalActions: React.FC<ProposalActionsProps> = ({ 
  proposal, 
  selectedStakeAccounts, 
  voteLoading, 
  onVote 
}) => {
  const canVote = selectedStakeAccounts.length > 0;

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