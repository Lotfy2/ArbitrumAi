import { request, gql } from 'graphql-request';

const ARBITRUM_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/arbitrum/arbitrum-sepolia';

export interface BlockchainData {
  transactions: {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: string;
  }[];
  tokenTransfers: {
    token: {
      symbol: string;
    };
    amount: string;
    from: string;
    to: string;
  }[];
  whaleAccounts: {
    address: string;
    balance: string;
  }[];
}

export interface MarketTrend {
  symbol: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  whaleActivity: {
    buys: number;
    sells: number;
    netFlow: string;
  };
  priceImpact: {
    predicted: number;
    confidence: number;
  };
}

const blockchainQuery = gql`
  query GetBlockchainData {
    transactions(first: 100, orderBy: timestamp, orderDirection: desc) {
      id
      hash
      from
      to
      value
      timestamp
    }
    transfers: erc20Transfers(first: 100, orderBy: timestamp, orderDirection: desc) {
      token {
        symbol
      }
      amount
      from
      to
    }
    accounts(first: 10, orderBy: balance, orderDirection: desc) {
      id
      address
      balance
    }
  }
`;

export async function fetchBlockchainData(): Promise<BlockchainData> {
  try {
    const data = await request(ARBITRUM_ENDPOINT, blockchainQuery);
    return {
      transactions: data.transactions.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: tx.timestamp
      })),
      tokenTransfers: data.transfers.map((transfer: any) => ({
        token: {
          symbol: transfer.token.symbol
        },
        amount: transfer.amount,
        from: transfer.from,
        to: transfer.to
      })),
      whaleAccounts: data.accounts.map((account: any) => ({
        address: account.address,
        balance: account.balance
      }))
    };
  } catch (error) {
    console.error('Error fetching blockchain data:', error);
    throw new Error('Failed to fetch blockchain data');
  }
}

function analyzeWhaleActivity(data: BlockchainData, symbol: string): MarketTrend['whaleActivity'] {
  const transfers = data.tokenTransfers.filter(t => t.token.symbol === symbol);
  const whaleAddresses = new Set(data.whaleAccounts.map(w => w.address.toLowerCase()));
  
  let buys = 0;
  let sells = 0;
  let netFlow = BigInt(0);

  transfers.forEach(transfer => {
    const isWhaleFrom = whaleAddresses.has(transfer.from.toLowerCase());
    const isWhaleTo = whaleAddresses.has(transfer.to.toLowerCase());
    const amount = BigInt(transfer.amount);

    if (isWhaleFrom && !isWhaleTo) {
      sells++;
      netFlow -= amount;
    } else if (!isWhaleFrom && isWhaleTo) {
      buys++;
      netFlow += amount;
    }
  });

  return {
    buys,
    sells,
    netFlow: netFlow.toString()
  };
}

function calculatePriceImpact(
  whaleActivity: MarketTrend['whaleActivity'],
  currentPrice: number
): MarketTrend['priceImpact'] {
  const netFlowNum = Number(whaleActivity.netFlow);
  const impactFactor = 0.0001;
  const predictedChange = netFlowNum * impactFactor;
  
  const confidence = Math.min(
    Math.max(
      (Math.abs(whaleActivity.buys - whaleActivity.sells) / 
      (whaleActivity.buys + whaleActivity.sells)) * 100,
      60
    ),
    95
  );

  return {
    predicted: currentPrice * (1 + predictedChange),
    confidence
  };
}

export async function analyzeMarketTrends(symbol: string, currentPrice: number): Promise<MarketTrend> {
  const data = await fetchBlockchainData();
  const whaleActivity = analyzeWhaleActivity(data, symbol);
  const priceImpact = calculatePriceImpact(whaleActivity, currentPrice);

  let trend: MarketTrend['trend'] = 'neutral';
  let confidence = priceImpact.confidence;

  if (whaleActivity.buys > whaleActivity.sells * 1.5) {
    trend = 'bullish';
    confidence = Math.min(confidence + 10, 95);
  } else if (whaleActivity.sells > whaleActivity.buys * 1.5) {
    trend = 'bearish';
    confidence = Math.min(confidence + 10, 95);
  }

  return {
    symbol,
    trend,
    confidence,
    whaleActivity,
    priceImpact
  };
}