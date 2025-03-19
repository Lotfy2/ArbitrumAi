import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { fetchWalletNFTs, NFT, transferNFT, NFT_CONTRACT_ADDRESS } from '../../services/nft';
import { ImageOff, ExternalLink, Loader2, RefreshCw, Send } from 'lucide-react';

export function NFTs() {
  const { address } = useAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferTo, setTransferTo] = useState<string>('');
  const [transferringNft, setTransferringNft] = useState<NFT | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  async function loadNFTs() {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedNFTs = await fetchWalletNFTs(address);
      setNfts(fetchedNFTs);
    } catch (err) {
      setError('Failed to load NFTs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNFTs();
  }, [address]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringNft || !transferTo || !address) return;

    setTransferring(true);
    setTransferError(null);
    try {
      await transferNFT(transferringNft.tokenId, address, transferTo);
      await loadNFTs(); // Refresh NFTs after transfer
      setTransferringNft(null);
      setTransferTo('');
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : 'Failed to transfer NFT');
    } finally {
      setTransferring(false);
    }
  };

  if (!address) {
    return (
      <div className="text-center py-12 text-white/60">
        Please connect your wallet to view your NFTs
      </div>
    );
  }

  return (
    <div className="text-white space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Your NFTs</h2>
        <button
          onClick={loadNFTs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-red-400 bg-red-400/20 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && nfts.length === 0 && (
        <div className="text-center py-12 text-white/60">
          No NFTs found in this wallet
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfts.map((nft) => (
          <div
            key={nft.id}
            className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-colors"
          >
            <div className="aspect-square relative">
              {nft.image ? (
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1639322537504-6427aaf97dde';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <ImageOff className="w-8 h-8 text-white/40" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{nft.name || 'Unnamed NFT'}</h3>
                  <p className="text-sm text-white/60">
                    {nft.description || `Token ID: ${nft.tokenId}`}
                  </p>
                </div>
                <a
                  href={`https://testnet.sonicscan.org/token/${NFT_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <button
                onClick={() => setTransferringNft(nft)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                Transfer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Transfer Modal */}
      {transferringNft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Transfer NFT</h3>
            <p className="text-gray-400 mb-4">
              Transferring {transferringNft.name} (ID: {transferringNft.tokenId})
            </p>
            
            {transferError && (
              <div className="mb-4 text-red-400 bg-red-400/20 p-3 rounded-lg">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransfer}>
              <input
                type="text"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="Recipient address (0x...)"
                className="w-full bg-white/10 rounded-lg px-4 py-2 mb-4"
                disabled={transferring}
              />
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTransferringNft(null);
                    setTransferTo('');
                    setTransferError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  disabled={transferring}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!transferTo || transferring}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {transferring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Transfer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}