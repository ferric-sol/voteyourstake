"use client"

import React from 'react';
import { ProposalData, SIMDProposal } from './types';
import { formatRemainingTime, isProposalActive } from './utils';
// @ts-ignore
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore
import { Badge } from '@/components/ui/badge';
// @ts-ignore
import { Button } from '@/components/ui/button';
// @ts-ignore
import { Loader2 } from 'lucide-react';

interface ProposalListProps {
  proposals: ProposalData[];
  simdProposals: SIMDProposal[];
  selectedProposal: ProposalData | null;
  onSelectProposal: (proposal: ProposalData) => void;
  onCreateProposal: (simdProposal: SIMDProposal) => void;
  isLoading?: boolean;
}

const ProposalList: React.FC<ProposalListProps> = ({
  proposals,
  simdProposals,
  selectedProposal,
  onSelectProposal,
  onCreateProposal,
  isLoading = false
}) => {
  // Add console log to debug
  console.log('ProposalList render - isLoading:', isLoading, 'proposals:', proposals.length);
  
  // Filter SIMD proposals that don't have an on-chain proposal yet
  const pendingSIMDProposals = simdProposals.filter(simd => 
    !proposals.some(p => p.proposalId === simd.id)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Active Proposals</h2>
      
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No active proposals found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {proposals.map((proposal) => (
            <Card 
              key={proposal.pubkey.toString()}
              className={`cursor-pointer transition-all hover:border-primary ${
                selectedProposal?.pubkey.toString() === proposal.pubkey.toString() 
                  ? 'border-2 border-primary' 
                  : ''
              }`}
              onClick={() => onSelectProposal(proposal)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{proposal.title}</CardTitle>
                  <Badge variant={isProposalActive(proposal.endTime) ? "default" : "secondary"}>
                    {isProposalActive(proposal.endTime) ? "Active" : "Ended"}
                  </Badge>
                </div>
                <CardDescription>
                  ID: {proposal.proposalId}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {proposal.description}
                </p>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-0">
                <span className="text-sm text-muted-foreground">
                  {formatRemainingTime(proposal.endTime)}
                </span>
                <span className="text-sm font-medium">
                  {proposal.voteCount} votes
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {pendingSIMDProposals.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mt-8">Pending SIMD Proposals</h2>
          <div className="grid grid-cols-1 gap-4">
            {pendingSIMDProposals.map((simd) => (
              <Card key={simd.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{simd.title}</CardTitle>
                  <CardDescription>
                    ID: {simd.id}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {simd.description}
                  </p>
                </CardContent>
                
                <CardFooter className="flex justify-end pt-0">
                  <Button 
                    variant="outline" 
                    onClick={() => onCreateProposal(simd)}
                  >
                    Create Proposal
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProposalList; 