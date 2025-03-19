import React from 'react';
import { ProposalAnalysis } from '../../services/governance/proposal-analyzer';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ProposalAnalysisViewProps {
  analysis: ProposalAnalysis;
}

export default function ProposalAnalysisView({ analysis }: ProposalAnalysisViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-3">Summary</h3>
        <p className="text-gray-300">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-500/10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-green-400">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="text-green-300">
                • {strength}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-500/10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">Areas of Consideration</h3>
          </div>
          <ul className="space-y-2">
            {analysis.weaknesses.map((weakness, index) => (
              <li key={index} className="text-red-300">
                • {weakness}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}