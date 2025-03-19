import axios from 'axios';

const AGENTSQL_API_KEY = 'pdBIgEJEY_x6e9UtBR9sVo_2cGr2wAk51n-01a0icY1m1tcgMv6NVA';
const AGENTSQL_ENDPOINT = 'https://api.agentsql.com/v1';

export interface BlockchainData {
  transactions: Array<{
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: string;
  }>;
  tokenTransfers: Array<{
    token: {
      symbol: string;
    };
    amount: string;
    from: string;
    to: string;
  }>;
  whaleAccounts: Array<{
    address: string;
    balance: string;
  }>;
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

async function queryBlockchain(query: string): Promise<any> {
  try {
    const response = await axios.post(
      AGENTSQL_ENDPOINT,
      { query },
      {
        headers: {
          'Authorization': `Bearer ${AGENTSQL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error querying blockchain:', errorMessage);
    return { data: [] };
  }
}

export async function fetchBlockchainData(): Promise<BlockchainData> {
  try {
    return {
      transactions: Array.from({ length: 10 }, (_, i) => ({
        hash: `0x${Math.random().toString(36).substring(2)}`,
        from: `0x${Math.random().toString(36).substring(2)}`,
        to: `0x${Math.random().toString(36).substring(2)}`,
        value: (Math.random() * 100).toString(),
        timestamp: new Date(Date.now() - i * 3600000).toISOString()
      })),
      tokenTransfers: Array.from({ length: 10 }, () => ({
        token: { symbol: 'ETH' },
        amount: (Math.random() * 1000).toString(),
        from: `0x${Math.random().toString(36).substring(2)}`,
        to: `0x${Math.random().toString(36).substring(2)}`
      })),
      whaleAccounts: Array.from({ length: 5 }, () => ({
        address: `0x${Math.random().toString(36).substring(2)}`,
        balance: (Math.random() * 1000000).toString()
      }))
    };
  } catch (error) {
    console.error('Error fetching blockchain data:', error instanceof Error ? error.message : 'Unknown error');
    return {
      transactions: [],
      tokenTransfers: [],
      whaleAccounts: []
    };
  }
}

function analyzeWhaleActivity(data: BlockchainData, symbol: string): MarketTrend['whaleActivity'] {
  try {
    const transfers = data.tokenTransfers.filter(t => t.token.symbol === symbol);
    const whaleAddresses = new Set(data.whaleAccounts.map(w => w.address.toLowerCase()));
    
    let buys = 0;
    let sells = 0;
    let netFlowValue = 0;

    transfers.forEach(transfer => {
      const isWhaleFrom = whaleAddresses.has(transfer.from.toLowerCase());
      const isWhaleTo = whaleAddresses.has(transfer.to.toLowerCase());
      const amount = parseFloat(transfer.amount || '0');

      if (isWhaleFrom && !isWhaleTo) {
        sells++;
        netFlowValue -= amount;
      } else if (!isWhaleFrom && isWhaleTo) {
        buys++;
        netFlowValue += amount;
      }
    });

    return {
      buys,
      sells,
      netFlow: netFlowValue.toString()
    };
  } catch (error) {
    console.error('Error analyzing whale activity:', error instanceof Error ? error.message : 'Unknown error');
    return {
      buys: 0,
      sells: 0,
      netFlow: '0'
    };
  }
}

function calculatePriceImpact(
  whaleActivity: MarketTrend['whaleActivity'],
  currentPrice: number
): MarketTrend['priceImpact'] {
  try {
    const netFlowNum = parseFloat(whaleActivity.netFlow);
    const impactFactor = 0.0001;
    const predictedChange = netFlowNum * impactFactor;
    
    const confidence = Math.min(
      Math.max(
        (Math.abs(whaleActivity.buys - whaleActivity.sells) / 
        Math.max(whaleActivity.buys + whaleActivity.sells, 1)) * 100,
        60
      ),
      95
    );

    return {
      predicted: currentPrice * (1 + predictedChange),
      confidence
    };
  } catch (error) {
    console.error('Error calculating price impact:', error instanceof Error ? error.message : 'Unknown error');
    return {
      predicted: currentPrice,
      confidence: 60
    };
  }
}

export async function analyzeMarketTrends(symbol: string, currentPrice: number): Promise<MarketTrend> {
  try {
    const data = await fetchBlockchainData();
    const whaleActivity = analyzeWhaleActivity(data, symbol);
    const priceImpact = calculatePriceImpact(whaleActivity, currentPrice);

    const metrics = {
      avg_price_change: Math.random() * 2 - 1,
      positive_changes: Math.floor(Math.random() * 100),
      negative_changes: Math.floor(Math.random() * 100)
    };

    let trend: MarketTrend['trend'] = 'neutral';
    let confidence = priceImpact.confidence;

    if (
      whaleActivity.buys > whaleActivity.sells * 1.5 &&
      metrics.avg_price_change > 0 &&
      metrics.positive_changes > metrics.negative_changes
    ) {
      trend = 'bullish';
      confidence = Math.min(confidence + 15, 95);
    } else if (
      whaleActivity.sells > whaleActivity.buys * 1.5 &&
      metrics.avg_price_change < 0 &&
      metrics.negative_changes > metrics.positive_changes
    ) {
      trend = 'bearish';
      confidence = Math.min(confidence + 15, 95);
    }

    return {
      symbol,
      trend,
      confidence,
      whaleActivity,
      priceImpact
    };
  } catch (error) {
    console.error('Error analyzing market trends:', error instanceof Error ? error.message : 'Unknown error');
    return {
      symbol,
      trend: 'neutral',
      confidence: 60,
      whaleActivity: {
        buys: 0,
        sells: 0,
        netFlow: '0'
      },
      priceImpact: {
        predicted: currentPrice,
        confidence: 60
      }
    };
  }
}