import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Link2, ExternalLink, CheckCircle, AlertCircle, Loader2, Vote, GalleryVerticalEnd } from 'lucide-react';
import { analyzeProposal, type ProposalAnalysis } from '../../services/governance/proposal-analyzer';

export function Governance() {
  const { address } = useAccount();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ProposalAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeProposal(url);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze proposal');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center text-white p-12 bg-white/5 rounded-xl">
        <Vote className="w-16 h-16 mb-4 text-blue-400" />
        <h2 className="text-2xl font-bold mb-2">Welcome to SonicX Governance</h2>
        <p className="text-gray-400 text-center max-w-md">
          Connect your wallet to participate in governance and analyze proposals.
        </p>
      </div>
    );
  }

  return (
    <div className="text-white space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Governance</h1>
          <p className="text-gray-400">Analyze and participate in SonicX governance</p>
        </div>
        <div className="bg-white/10 rounded-lg p-4">
          <GalleryVerticalEnd className="w-6 h-6 text-blue-400 mb-1" />
          <p className="text-sm text-gray-400">Active Proposals</p>
          <p className="text-xl font-bold">0</p>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Proposal Analysis</h2>
        <form onSubmit={handleAnalyze} className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter proposal URL to analyze..."
                className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Vote className="w-5 h-5" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-lg flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6">
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
                    <li key={index} className="text-green-300 flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{strength}</span>
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
                    <li key={index} className="text-red-300 flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {!analysis && !error && !loading && (
          <div className="text-center py-8 text-gray-400">
            <Vote className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Enter a proposal URL above to analyze its potential impact and implications.</p>
          </div>
        )}
      </div>
    </div>
  );
}