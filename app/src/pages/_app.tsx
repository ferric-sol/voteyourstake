import type { AppProps } from 'next/app';
import '@solana/wallet-adapter-react-ui/styles.css';
import '../app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
} 