'use client';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter, CoinbaseWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo, useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';

// Import our custom wallet adapter styles
import './wallet-adapter.css';

export function Providers({ children }: { children: React.ReactNode }) {
  // Use a specific RPC endpoint for better reliability
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
          <Toaster />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 