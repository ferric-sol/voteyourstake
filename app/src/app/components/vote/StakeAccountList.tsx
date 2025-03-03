import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { StakeAccountInfo } from './types';

interface StakeAccountListProps {
  stakeAccounts: StakeAccountInfo[];
  selectedStakeAccounts: StakeAccountInfo[];
  handleSelectStakeAccount: (account: StakeAccountInfo) => void;
  selectAllStakeAccounts: (selectAll: boolean) => void;
  formatNumber: (value: number | string) => string;
}

const StakeAccountList: React.FC<StakeAccountListProps> = ({
  stakeAccounts,
  selectedStakeAccounts,
  handleSelectStakeAccount,
  selectAllStakeAccounts,
  formatNumber
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Stake Accounts</h3>
        {stakeAccounts.length > 0 && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="select-all"
              checked={stakeAccounts.length > 0 && selectedStakeAccounts.length === stakeAccounts.filter(acc => !acc.hasVoted).length}
              onCheckedChange={(checked) => selectAllStakeAccounts(checked === true)}
            />
            <Label htmlFor="select-all">Select All Eligible</Label>
          </div>
        )}
      </div>

      {stakeAccounts.length === 0 ? (
        <Alert>
          <AlertTitle>No Stake Accounts Found</AlertTitle>
          <AlertDescription>
            You don't have any stake accounts associated with this wallet. Create a stake account to participate in voting.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakeAccounts.map((account) => (
            <div key={account.pubkey} className="border rounded-lg p-4 hover:bg-accent transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id={`stake-${account.pubkey}`}
                    checked={account.selected}
                    disabled={account.hasVoted}
                    onCheckedChange={() => handleSelectStakeAccount(account)}
                    className="mr-2"
                  />
                  <Label 
                    htmlFor={`stake-${account.pubkey}`}
                    className="font-mono text-xs truncate"
                  >
                    {account.pubkey.substring(0, 4)}...{account.pubkey.substring(account.pubkey.length - 4)}
                  </Label>
                </div>
                <span className="text-sm font-medium">
                  {formatNumber(account.stake)} SOL
                </span>
              </div>
              {account.hasVoted && (
                <Badge variant="secondary" className="mt-2">Already Voted</Badge>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Selected: {selectedStakeAccounts.length} account(s) with {formatNumber(
          selectedStakeAccounts.reduce((sum, acc) => sum + Number(acc.stake), 0)
        )} SOL</p>
      </div>
    </div>
  );
};

export default StakeAccountList; 