'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter, CoinbaseWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo, useEffect, useState } from 'react';

// Import our custom wallet adapter styles
import './wallet-adapter.css';

export function Providers({ children }: { children: React.ReactNode }) {
  // Use Devnet instead of localhost
  const network = WalletAdapterNetwork.Devnet;
  
  // Use a specific RPC endpoint for better reliability
  // const endpoint = clusterApiUrl(network);
  const endpoint = "https://api.devnet.solana.com";
  
  // Add more wallet adapters for better compatibility
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new CoinbaseWalletAdapter()
  ], []);
  
  // Add client-side rendering check to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {mounted && children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 