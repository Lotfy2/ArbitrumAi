import React from 'react';
import { useAccount } from 'wagmi';
import { TrendingUp, Users, MessageSquare, BarChart2 } from 'lucide-react';
import { ChatSection } from '../ChatSection';

export function Social() {
  const { address } = useAccount();

  if (!address) {
    return (
      <div className="text-center py-12 text-white/60">
        Please connect your wallet to access social features
      </div>
    );
  }

  return (
    <div className="text-white space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold">Trading Activity</h3>
          </div>
          <div className="text-center py-4 text-gray-400">
            No recent activity
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold">Social Signals</h3>
          </div>
          <div className="text-center py-4 text-gray-400">
            No signals available
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold">Discussions</h3>
          </div>
          <div className="text-center py-4 text-gray-400">
            No active discussions
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart2 className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-semibold">Market Sentiment</h3>
          </div>
          <div className="text-center py-4 text-gray-400">
            No data available
          </div>
        </div>
      </div>

      <ChatSection section="social" context="social trading and market sentiment" />
    </div>
  );
}