import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { StakeAccountInfo } from './types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  // Count eligible accounts (not voted and delegated to our validator)
  const eligibleAccounts = stakeAccounts.filter(acc => !acc.hasVoted && acc.isEligible);
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Stake Accounts</h3>
        {stakeAccounts.length > 0 && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="select-all"
              checked={eligibleAccounts.length > 0 && selectedStakeAccounts.length === eligibleAccounts.length}
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
            You don&apos;t have any stake accounts associated with this wallet. Create a stake account to participate in voting.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakeAccounts.map((account) => (
            <div 
              key={account.pubkey} 
              className={`border rounded-lg p-4 transition-colors ${
                account.isEligible ? 'hover:bg-accent' : 'opacity-70'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Checkbox 
                            id={`stake-${account.pubkey}`}
                            checked={account.selected}
                            disabled={account.hasVoted || !account.isEligible}
                            onCheckedChange={() => handleSelectStakeAccount(account)}
                            className="mr-2"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {account.hasVoted 
                          ? "This account has already voted" 
                          : !account.isEligible 
                            ? "This account is not delegated to the required validator" 
                            : "Select this account for voting"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
              <div className="flex flex-wrap gap-2 mt-2">
                {account.hasVoted && (
                  <Badge variant="secondary">Already Voted</Badge>
                )}
                {!account.isEligible && (
                  <Badge variant="destructive">Not Eligible</Badge>
                )}
                {account.isEligible && !account.hasVoted && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Eligible</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Selected: {selectedStakeAccounts.length} account(s) with {formatNumber(
          selectedStakeAccounts.reduce((sum, acc) => sum + Number(acc.stake), 0)
        )} SOL</p>
        <p className="mt-1 text-xs">
          Note: Only stake accounts delegated to validator 28rDkn...7Nps are eligible for voting.
        </p>
      </div>
    </div>
  );
};

export default StakeAccountList; 