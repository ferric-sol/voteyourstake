import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProposalActions from './ProposalActions';
import { StakeAccountInfo, ProposalData } from './types';

interface ProposalCardProps {
  proposal: ProposalData;
  selectedStakeAccounts: StakeAccountInfo[];
  voteLoading: boolean;
  onVote: (proposal: ProposalData, voteValue: number) => void;
  formatNumber: (value: number | string) => string;
  disableVoting?: boolean;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  selectedStakeAccounts,
  voteLoading,
  onVote,
  formatNumber,
  disableVoting = false
}) => {
  return (
    <Card key={proposal.id || proposal.proposalId} className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-xl font-semibold">{proposal.title}</h4>
          <Badge variant={!proposal.isActive ? "destructive" : "outline"}>
            {!proposal.isActive ? "Closed" : "Active"}
          </Badge>
        </div>
        
        <p className="text-muted-foreground mb-4">{proposal.description}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-800 font-semibold">Yes Votes</div>
            <div className="text-2xl font-bold">{formatNumber(proposal.yesVotes)} SOL</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-red-800 font-semibold">No Votes</div>
            <div className="text-2xl font-bold">{formatNumber(proposal.noVotes)} SOL</div>
          </div>
        </div>
        
        {proposal.isActive && !disableVoting && (
          <ProposalActions 
            proposal={proposal}
            selectedStakeAccounts={selectedStakeAccounts}
            voteLoading={voteLoading}
            onVote={onVote}
          />
        )}
        
        {proposal.isActive && disableVoting && (
          <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
            Voting is disabled because you don't have any eligible stake accounts.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalCard; 