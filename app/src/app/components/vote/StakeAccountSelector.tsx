"use client"

import React from 'react';
import { StakeAccountInfo } from './types';
import { formatNumber } from './utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StakeAccountSelectorProps {
  stakeAccounts: StakeAccountInfo[];
  selectedStakeAccount: StakeAccountInfo | null;
  onSelectStakeAccount: (stakeAccount: StakeAccountInfo) => void;
  isLoading: boolean;
}

const StakeAccountSelector: React.FC<StakeAccountSelectorProps> = ({
  stakeAccounts,
  selectedStakeAccount,
  onSelectStakeAccount,
  isLoading
}) => {
  // Calculate total stake
  const totalStake = stakeAccounts.reduce(
    (sum, account) => sum + Number(account.stake),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Stake Accounts</CardTitle>
        <CardDescription>
          Total Stake: {formatNumber(totalStake)} SOL
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">Loading stake accounts...</p>
          </div>
        ) : stakeAccounts.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">No stake accounts found</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Stake (SOL)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stakeAccounts.map((account) => (
                  <TableRow
                    key={account.pubkey}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      selectedStakeAccount?.pubkey === account.pubkey
                        ? 'bg-muted'
                        : ''
                    }`}
                    onClick={() => onSelectStakeAccount(account)}
                  >
                    <TableCell className="font-mono text-xs">
                      {account.pubkey.substring(0, 4)}...{account.pubkey.substring(account.pubkey.length - 4)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(account.stake)}
                    </TableCell>
                    <TableCell className="text-center">
                      {account.hasVoted ? (
                        <Badge variant="secondary">Voted</Badge>
                      ) : (
                        <Badge variant="outline">Available</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default StakeAccountSelector; 