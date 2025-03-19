import { ethers } from 'ethers';

// NFT Contract address on Arbitrum Sepolia
export const NFT_CONTRACT_ADDRESS = '0xa1D348F7f0cd143DEE750553714b84d8ec2bf116';

// NFT Contract ABI for basic ERC721 functions
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)'
];

export interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  tokenId: string;
  explorer?: string;
}

export async function fetchWalletNFTs(address?: string): Promise<NFT[]> {
  try {
    if (!address) {
      return [];
    }

    const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    const nftContract = new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      ERC721_ABI,
      provider
    );

    let totalSupply;
    try {
      totalSupply = await nftContract.totalSupply();
    } catch (error) {
      console.warn('Could not get total supply, will try alternative method:', error);
      totalSupply = 100; // Fallback to checking first 100 tokens
    }

    let collectionName = 'Arbitrum NFT Collection';
    try {
      collectionName = await nftContract.name();
    } catch (error) {
      console.warn('Error fetching collection name:', error);
    }

    const ownedNFTs: NFT[] = [];
    for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
      try {
        const owner = await nftContract.ownerOf(tokenId);
        if (owner.toLowerCase() === address.toLowerCase()) {
          let metadata = {
            name: `NFT #${tokenId}`,
            description: 'Arbitrum NFT',
            image: 'https://images.unsplash.com/photo-1639322537504-6427aaf97dde'
          };

          try {
            const tokenUri = await nftContract.tokenURI(tokenId);
            if (tokenUri) {
              const url = tokenUri.startsWith('ipfs://')
                ? `https://ipfs.io/ipfs/${tokenUri.slice(7)}`
                : tokenUri;

              const response = await fetch(url);
              if (response.ok) {
                const data = await response.json();
                metadata = {
                  name: data.name || metadata.name,
                  description: data.description || metadata.description,
                  image: data.image?.startsWith('ipfs://')
                    ? `https://ipfs.io/ipfs/${data.image.slice(7)}`
                    : data.image || metadata.image
                };
              }
            }
          } catch (error) {
            console.warn(`Error fetching metadata for token ${tokenId}:`, error);
          }

          ownedNFTs.push({
            id: NFT_CONTRACT_ADDRESS,
            tokenId: tokenId.toString(),
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            collection: collectionName,
            explorer: `https://sepolia.arbiscan.io/token/${NFT_CONTRACT_ADDRESS}/${tokenId}`
          });
        }
      } catch (error) {
        console.warn(`Token ${tokenId} check failed:`, error);
        continue;
      }
    }

    return ownedNFTs;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}

export async function transferNFT(
  tokenId: string,
  from: string,
  to: string
): Promise<string> {
  try {
    if (!window.ethereum) {
      throw new Error('No Web3 provider found');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const nftContract = new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      ERC721_ABI,
      signer
    );

    const owner = await nftContract.ownerOf(tokenId);
    if (owner.toLowerCase() !== from.toLowerCase()) {
      throw new Error('You do not own this NFT');
    }

    const tx = await nftContract.transferFrom(from, to, tokenId);
    await tx.wait();

    return tx.hash;
  } catch (error) {
    console.error('Error transferring NFT:', error);
    throw error;
  }
}