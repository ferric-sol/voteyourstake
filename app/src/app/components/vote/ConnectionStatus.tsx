import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ConnectionStatusProps {
  isConnected: boolean;
  hasStakeAccounts: boolean;
  onClick: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  hasStakeAccounts, 
  onClick 
}) => {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <WalletMultiButton />
      {isConnected ? (
        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
          Connected
        </Badge>
      ) : (
        <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
          Not Connected
        </Badge>
      )}
      {isConnected && !hasStakeAccounts && (
        <Button variant="outline" size="sm" onClick={onClick}>
          Check for Stake Accounts
        </Button>
      )}
    </div>
  );
};

export default ConnectionStatus; 