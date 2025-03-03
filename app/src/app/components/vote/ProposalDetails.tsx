"use client"

import React from 'react';
import { ProposalData, StakeAccountInfo } from './types';
import { formatNumber, calculatePercentage, formatRemainingTime, isProposalActive } from './utils';
// @ts-ignore
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore
import { Badge } from '@/components/ui/badge';
// @ts-ignore
import { Button } from '@/components/ui/button';
// @ts-ignore
import { Progress } from '@/components/ui/progress';
// @ts-ignore
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProposalDetailsProps {
  proposal: ProposalData;
  selectedStakeAccount: StakeAccountInfo | null;
  hasVoted: boolean;
  onVote: (vote: number) => void;
  onCloseProposal: () => void;
  isAuthority: boolean;
}

const ProposalDetails: React.FC<ProposalDetailsProps> = ({
  proposal,
  selectedStakeAccount,
  hasVoted,
  onVote,
  onCloseProposal,
  isAuthority
}) => {
  const totalVotes = Number(proposal.yesVotes) + Number(proposal.noVotes);
  const yesPercentage = calculatePercentage(proposal.yesVotes, totalVotes.toString());
  const noPercentage = calculatePercentage(proposal.noVotes, totalVotes.toString());
  const isActive = isProposalActive(proposal.endTime);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{proposal.title}</h2>
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Ended"}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>ID: {proposal.proposalId}</span>
        <span>{formatRemainingTime(proposal.endTime)}</span>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{proposal.description}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Voting Results</CardTitle>
          <CardDescription>
            Total votes: {formatNumber(proposal.voteCount)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Yes</span>
              <span>{formatNumber(proposal.yesVotes)} ({yesPercentage.toFixed(2)}%)</span>
            </div>
            <Progress value={yesPercentage} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>No</span>
              <span>{formatNumber(proposal.noVotes)} ({noPercentage.toFixed(2)}%)</span>
            </div>
            <Progress value={noPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
      
      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Cast Your Vote</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedStakeAccount ? (
              <p className="text-center text-muted-foreground">
                Please select a stake account to vote
              </p>
            ) : hasVoted ? (
              <p className="text-center text-muted-foreground">
                You have already voted with this stake account
              </p>
            ) : (
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onVote(1)}
                >
                  Vote Yes
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onVote(0)}
                >
                  Vote No
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {isAuthority && isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={onCloseProposal}
            >
              Close Proposal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProposalDetails; 