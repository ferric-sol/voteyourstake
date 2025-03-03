import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProposalActions from './ProposalActions';
import { StakeAccountInfo } from './types';

interface ProposalCardProps {
  proposal: any;
  selectedStakeAccounts: StakeAccountInfo[];
  voteLoading: boolean;
  onVote: (proposal: any, voteValue: number) => void;
  formatNumber: (value: number | string) => string;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  selectedStakeAccounts,
  voteLoading,
  onVote,
  formatNumber
}) => {
  return (
    <Card key={proposal.id} className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-xl font-semibold">{proposal.title}</h4>
          <Badge variant={proposal.isClosed ? "destructive" : "outline"}>
            {proposal.isClosed ? "Closed" : "Active"}
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
        
        {!proposal.isClosed && (
          <ProposalActions 
            proposal={proposal}
            selectedStakeAccounts={selectedStakeAccounts}
            voteLoading={voteLoading}
            onVote={onVote}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalCard; 