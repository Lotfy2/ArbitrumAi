import { createPublicClient, http, parseEther, formatEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

// Configure the public client with proper timeout and retry settings
export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http('https://sepolia-rollup.arbitrum.io/rpc', {
    timeout: 20000,
    retryCount: 3,
    retryDelay: 1000,
    batch: {
      wait: 100
    }
  })
});

// ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  }
] as const;

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`Attempt ${attempt} failed:`, lastError.message);
      if (attempt === maxRetries) break;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

export async function getTokenBalance(address: string, tokenAddress?: string): Promise<TokenBalance> {
  try {
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid address format');
    }

    const formattedAddress = address as `0x${string}`;

    // For native token balance
    if (!tokenAddress) {
      const balance = await retryOperation(
        async () => publicClient.getBalance({ address: formattedAddress })
      );

      return {
        symbol: 'ETH',
        balance: formatEther(balance),
        decimals: 18
      };
    }

    // For ERC20 tokens, first verify the contract exists and is valid
    try {
      const code = await publicClient.getBytecode({ address: tokenAddress as `0x${string}` });
      if (!code || code === '0x') {
        throw new Error('Token contract not found');
      }
    } catch (error) {
      console.error('Error verifying token contract:', error);
      return {
        symbol: 'UNKNOWN',
        balance: '0',
        decimals: 18
      };
    }

    const formattedTokenAddress = tokenAddress as `0x${string}`;

    // Try to get token info and balance
    try {
      const [balance, symbol, decimals] = await Promise.all([
        retryOperation(async () => 
          publicClient.readContract({
            address: formattedTokenAddress,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [formattedAddress]
          })
        ),
        retryOperation(async () =>
          publicClient.readContract({
            address: formattedTokenAddress,
            abi: ERC20_ABI,
            functionName: 'symbol',
            args: []
          })
        ),
        retryOperation(async () =>
          publicClient.readContract({
            address: formattedTokenAddress,
            abi: ERC20_ABI,
            functionName: 'decimals',
            args: []
          })
        )
      ]);

      return {
        symbol,
        balance: formatEther(balance),
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('Error reading token data:', error);
      return {
        symbol: 'UNKNOWN',
        balance: '0',
        decimals: 18
      };
    }
  } catch (error) {
    console.error('Error in getTokenBalance:', error);
    return {
      symbol: tokenAddress ? 'UNKNOWN' : 'ETH',
      balance: '0',
      decimals: 18
    };
  }
}