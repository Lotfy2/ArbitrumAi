import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Brain, TrendingUp, AlertTriangle, ArrowUpRight, Wallet, BarChart2, PieChart } from 'lucide-react';
import { getTokenBalance } from '../../services/blockchain';
import { ChatSection } from '../ChatSection';

export function Investment() {
  const { address } = useAccount();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      loadBalance();
    }
  }, [address]);

  const loadBalance = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const tokenBalance = await getTokenBalance(address);
      setBalance(tokenBalance.balance);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="text-center py-12 text-white/60">
        Please connect your wallet to access investment features
      </div>
    );
  }

  return (
    <div className="text-white space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Portfolio Balance</h2>
          </div>
          <p className="text-2xl font-bold">{balance} ETH</p>
          <p className="text-sm text-gray-400">Native token</p>
        </div>
      </div>

      <ChatSection section="investment" context="investment analysis and portfolio management" />
    </div>
  );
}