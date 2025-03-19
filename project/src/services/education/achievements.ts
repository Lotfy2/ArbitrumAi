import { ethers } from 'ethers';

const NFT_CONTRACT_ADDRESS = '0x3447b39026144176ff80a8869cfee56243fb6cce';

const NFT_ABI = [
  'function mint(address to, string memory tokenURI) public returns (uint256)',
  'function tokenURI(uint256 tokenId) public view returns (string memory)',
  'function balanceOf(address owner) public view returns (uint256)',
  'function ownerOf(uint256 tokenId) public view returns (address)'
];

export interface Achievement {
  id: string;
  lessonId: string;
  name: string;
  description: string;
  imageUrl: string;
  requiredScore: number;
}

export const achievements: Achievement[] = [
  {
    id: 'blockchain-basics-master',
    lessonId: 'blockchain-basics',
    name: 'Arbitrum Master',
    description: 'Successfully completed the Arbitrum Fundamentals course with a perfect score',
    imageUrl: 'https://images.unsplash.com/photo-1639322537228-f710d846310a',
    requiredScore: 100
  },
  {
    id: 'smart-contracts-expert',
    lessonId: 'smart-contracts',
    name: 'Smart Contract Expert',
    description: 'Mastered the concepts of Smart Contracts on Arbitrum with exceptional understanding',
    imageUrl: 'https://images.unsplash.com/photo-1639322537504-6427aaf97dde',
    requiredScore: 100
  }
];

export async function mintAchievementNFT(
  achievement: Achievement,
  userAddress: string,
  ethereum: any
): Promise<string> {
  if (!ethereum) {
    throw new Error('Ethereum provider not found');
  }

  try {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);

    const metadata = {
      name: achievement.name,
      description: achievement.description,
      image: achievement.imageUrl,
      attributes: [
        {
          trait_type: 'Course',
          value: achievement.lessonId
        },
        {
          trait_type: 'Achievement Type',
          value: 'Course Completion'
        },
        {
          trait_type: 'Date Earned',
          value: new Date().toISOString()
        }
      ]
    };

    const tokenURI = `ipfs://achievement/${achievement.id}`;

    await ethereum.request({ method: 'eth_requestAccounts' });

    const tx = await contract.mint(userAddress, tokenURI);
    const receipt = await tx.wait();

    if (!receipt.status) {
      throw new Error('Transaction failed');
    }

    return tx.hash;
  } catch (error: any) {
    console.error('Error minting achievement NFT:', error);
    throw new Error(error.message || 'Failed to mint achievement NFT');
  }
}