import React from 'react';
import { Vote, CheckCircle2, XCircle } from 'lucide-react';

interface ProposalCardProps {
  id: string;
  title: string;
  status: 'active' | 'passed' | 'rejected';
  votingEndTime: string;
  yesPercentage: number;
}

export default function ProposalCard({ id, title, status, votingEndTime, yesPercentage }: ProposalCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Vote className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          {getStatusIcon()}
          <span className="ml-2 text-sm font-medium text-gray-400">#{id}</span>
        </div>
        <div className="text-sm text-gray-400">
          {status === 'active' ? 'Ends' : 'Ended'}: {votingEndTime}
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-3 text-white">{title}</h3>
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block text-blue-400">
              Yes: {yesPercentage}%
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold inline-block text-red-400">
              No: {100 - yesPercentage}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-700">
          <div
            style={{ width: `${yesPercentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
          />
        </div>
      </div>
    </div>
  );
}