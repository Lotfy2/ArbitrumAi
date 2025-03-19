import React, { useState } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiConfig, createConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { configureChains } from 'wagmi';
import { arbitrumSepolia } from 'viem/chains';
import { Brain, Coins, PaintBucket, GalleryVerticalEnd, Users, ArrowLeft } from 'lucide-react';
import { Trading } from './components/sections/Trading';
import { NFTs } from './components/sections/NFTs';
import { Governance } from './components/sections/Governance';
import { Investment } from './components/sections/Investment';
import { Education } from './components/sections/Education';
import { Social } from './components/sections/Social';

// Configure wagmi
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID';
const metadata = {
  name: 'Arbitrum AI',
  description: 'AI-powered assistant for Arbitrum',
  url: 'https://your-website.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [arbitrumSepolia],
  [publicProvider()]
);

const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
});

createWeb3Modal({ wagmiConfig: config, projectId, chains, metadata });

const queryClient = new QueryClient();

function App() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    {
      id: 'trading',
      title: 'Trading',
      icon: <Coins className="w-6 h-6" />,
      description: 'Check balances, send and swap tokens',
      component: Trading
    },
    {
      id: 'nfts',
      title: 'NFTs',
      icon: <PaintBucket className="w-6 h-6" />,
      description: 'View and manage your NFTs',
      component: NFTs
    },
    {
      id: 'governance',
      title: 'Governance',
      icon: <GalleryVerticalEnd className="w-6 h-6" />,
      description: 'Analyze governance proposals',
      component: Governance
    },
    {
      id: 'investment',
      title: 'AI Investment',
      icon: <Brain className="w-6 h-6" />,
      description: 'AI-powered portfolio management',
      component: Investment
    },
    {
      id: 'education',
      title: 'Education',
      icon: <Brain className="w-6 h-6" />,
      description: 'Interactive blockchain learning',
      component: Education
    },
    {
      id: 'social',
      title: 'Social Trading',
      icon: <Users className="w-6 h-6" />,
      description: 'AI-powered social sentiment trading',
      component: Social
    }
  ];

  const ActiveComponent = activeSection 
    ? sections.find(s => s.id === activeSection)?.component 
    : null;

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                {activeSection && (
                  <button
                    onClick={() => setActiveSection(null)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-white" />
                  </button>
                )}
                <h1 className="text-3xl font-bold text-white">
                  {activeSection 
                    ? sections.find(s => s.id === activeSection)?.title 
                    : 'Arbitrum AI'}
                </h1>
              </div>
              <w3m-button />
            </div>
            
            {!activeSection ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-white/20 rounded-lg text-white">
                        {section.icon}
                      </div>
                      <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                    </div>
                    <p className="text-gray-300">{section.description}</p>
                    <div className="flex items-center gap-2 text-sm text-blue-400">
                      <Brain className="w-4 h-4" />
                      <span>AI-Powered</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                {ActiveComponent && <ActiveComponent />}
              </div>
            )}
          </div>
        </div>
      </QueryClientProvider>
    </WagmiConfig>
  );
}

export default App;