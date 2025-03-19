import { createPublicClient, http, parseEther, formatEther, createWalletClient, custom } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { ERC20_ABI } from './blockchain';

// Arbitrum Sepolia Camelot DEX Router
const ROUTER_ADDRESS = '0xc873fEcbd354f5A56E00E710B90EF4201db2448d';
const USDC_ADDRESS = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';
const WETH_ADDRESS = '0xE591bf0A0CF924A0674d7792db046B23CEbF5f34';

// Camelot Router ABI
const ROUTER_ABI = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' }
    ],
    name: 'getAmountsOut',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactETHForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForETH',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

// Configure the client
const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http('https://sepolia-rollup.arbitrum.io/rpc', {
    timeout: 20000,
    retryCount: 3,
    retryDelay: 1000,
    batch: { wait: 100 }
  })
});

export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  executionPrice: string;
  priceImpact: string;
  minimumReceived: string;
  route: {
    from: string;
    to: string;
    path: string[];
  };
}

export async function getSwapQuote(
  inputToken: string,
  outputToken: string,
  amount: string
): Promise<SwapQuote> {
  try {
    const inputAmount = parseEther(amount);
    const path = [inputToken, outputToken];

    // Get amounts out from the router
    let outputAmount;
    try {
      const amounts = await publicClient.readContract({
        address: ROUTER_ADDRESS as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [inputAmount, path]
      });
      outputAmount = amounts[1];
    } catch (error) {
      console.error('Error getting amounts out:', error);
      outputAmount = BigInt(Math.floor(Number(inputAmount) * 0.98)); // Fallback to 2% slippage
    }

    const executionPrice = Number(formatEther(outputAmount)) / Number(amount);
    const minimumReceived = (outputAmount * BigInt(995)) / BigInt(1000); // 0.5% slippage

    return {
      inputAmount: amount,
      outputAmount: formatEther(outputAmount),
      executionPrice: executionPrice.toFixed(6),
      priceImpact: '2.00',
      minimumReceived: formatEther(minimumReceived),
      route: { from: inputToken, to: outputToken, path }
    };
  } catch (error) {
    console.error('Error getting swap quote:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get swap quote');
  }
}

export async function executeSwap(quote: SwapQuote): Promise<string> {
  try {
    if (!window.ethereum) {
      throw new Error('No Web3 provider found');
    }

    const walletClient = createWalletClient({
      chain: arbitrumSepolia,
      transport: custom(window.ethereum)
    });

    const [account] = await walletClient.requestAddresses();
    if (!account) {
      throw new Error('No account found');
    }

    const inputAmount = parseEther(quote.inputAmount);
    const minOutput = parseEther(quote.minimumReceived);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes

    let txHash: `0x${string}`;

    if (quote.route.from === '0x0000000000000000000000000000000000000000') {
      // Swapping ETH for tokens
      txHash = await walletClient.writeContract({
        address: ROUTER_ADDRESS as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'swapExactETHForTokens',
        args: [minOutput, quote.route.path, account, deadline],
        value: inputAmount
      });
    } else {
      // Swapping tokens for ETH
      const approvalHash = await walletClient.writeContract({
        address: quote.route.from as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [ROUTER_ADDRESS, inputAmount]
      });

      await publicClient.waitForTransactionReceipt({ 
        hash: approvalHash,
        timeout: 60_000
      });

      txHash = await walletClient.writeContract({
        address: ROUTER_ADDRESS as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForETH',
        args: [inputAmount, minOutput, quote.route.path, account, deadline]
      });
    }

    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash,
      timeout: 60_000
    });
    
    if (!receipt.status) {
      throw new Error('Transaction reverted');
    }

    return txHash;
  } catch (error) {
    console.error('Error executing swap:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to execute swap');
  }
}