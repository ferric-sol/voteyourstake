import { VoteInterface } from './components/vote';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto">
        <div className="py-12">
          <h1 className="text-4xl font-bold text-center mb-2">Vote Your Stake</h1>
          <p className="text-gray-600 text-center mb-12">
            Cast your votes using your Solana stake accounts
          </p>
          <VoteInterface />
        </div>
      </div>
    </main>
  );
} 