import { getAIResponse } from '../ai';
import { TokenBalance } from '../blockchain';
import { analyzeMarketTrends } from '../blockchain/agentsql';

export interface PortfolioAsset {
  symbol: string;
  balance: string;
  value: number;
  change24h: number;
  risk: 'low' | 'medium' | 'high';
  volatility: number;
}

export interface PortfolioAnalysis {
  assets: PortfolioAsset[];
  totalValue: number;
  riskScore: number;
  diversificationScore: number;
  recommendations: {
    action: 'buy' | 'sell' | 'hold';
    asset: string;
    amount: string;
    reason: string;
    confidence: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}

const MARKET_DATA = {
  SONIC: {
    price: 1.50,
    change24h: 2.5,
    volatility: 0.15,
    volume24h: 1000000,
    marketCap: 10000000,
    liquidityUSD: 500000
  }
};

function calculateRiskScore(asset: PortfolioAsset, marketData: typeof MARKET_DATA[keyof typeof MARKET_DATA]): number {
  try {
    const volatilityScore = Math.min((marketData.volatility * 100) / 0.5, 100);
    const marketCapScore = Math.min((marketData.marketCap / 1000000000), 100);
    const liquidityScore = Math.min((marketData.liquidityUSD / 1000000000), 100);
    
    const weights = {
      volatility: 0.4,
      marketCap: 0.3,
      liquidity: 0.3
    };

    return Math.min(
      (volatilityScore * weights.volatility) +
      (marketCapScore * weights.marketCap) +
      (liquidityScore * weights.liquidity),
      100
    );
  } catch (error) {
    console.error('Error calculating risk score:', error);
    return 50; // Default medium risk score
  }
}

function calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' {
  if (riskScore < 30) return 'low';
  if (riskScore < 70) return 'medium';
  return 'high';
}

async function generateRecommendation(
  asset: PortfolioAsset,
  marketData: typeof MARKET_DATA[keyof typeof MARKET_DATA],
  portfolioContext: {
    totalValue: number;
    riskScore: number;
    riskTolerance: string;
  }
) {
  try {
    const marketTrend = await analyzeMarketTrends(asset.symbol, marketData.price);
    const assetValue = parseFloat(asset.balance) * marketData.price;
    const portfolioShare = (assetValue / portfolioContext.totalValue) * 100;

    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = marketTrend.confidence;
    let priority: 'low' | 'medium' | 'high' = 'medium';
    let reason = '';
    let suggestedAmount = '0';

    if (marketTrend.trend === 'bullish' && portfolioShare < 30) {
      action = 'buy';
      priority = 'medium';
      suggestedAmount = `$${Math.round(portfolioContext.totalValue * 0.05)}`;
      reason = `Bullish market trend with ${confidence}% confidence`;
    } else if (marketTrend.trend === 'bearish' && portfolioShare > 20) {
      action = 'sell';
      priority = 'medium';
      suggestedAmount = `${Math.round(parseFloat(asset.balance) * 0.2)} tokens`;
      reason = `Bearish market trend with ${confidence}% confidence`;
    } else {
      action = 'hold';
      priority = 'low';
      reason = `Stable market conditions`;
    }

    if (portfolioContext.riskScore > 70 && portfolioContext.riskTolerance === 'conservative') {
      priority = 'high';
      action = 'sell';
      reason = 'Portfolio risk exceeds tolerance level';
      suggestedAmount = `${Math.round(parseFloat(asset.balance) * 0.2)} tokens`;
    }

    return {
      action,
      asset: asset.symbol,
      amount: suggestedAmount,
      reason,
      confidence,
      priority
    };
  } catch (error) {
    console.error('Error generating recommendation:', error);
    return {
      action: 'hold',
      asset: asset.symbol,
      amount: '0',
      reason: 'Unable to generate recommendation due to market data unavailability',
      confidence: 60,
      priority: 'low'
    };
  }
}

export async function analyzePortfolio(
  balances: TokenBalance[],
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
): Promise<PortfolioAnalysis> {
  try {
    const assets: PortfolioAsset[] = balances.map(balance => {
      const marketData = MARKET_DATA[balance.symbol as keyof typeof MARKET_DATA] || MARKET_DATA.SONIC;
      const value = parseFloat(balance.balance) * marketData.price;
      
      return {
        symbol: balance.symbol,
        balance: balance.balance,
        value,
        change24h: marketData.change24h,
        risk: 'medium',
        volatility: marketData.volatility
      };
    });

    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    
    const weightedRiskScore = assets.reduce((score, asset) => {
      const weight = asset.value / totalValue;
      const marketData = MARKET_DATA[asset.symbol as keyof typeof MARKET_DATA] || MARKET_DATA.SONIC;
      return score + (calculateRiskScore(asset, marketData) * weight);
    }, 0);

    const diversificationScore = Math.min(
      (assets.length * 20) + 
      (100 - (assets.reduce((max, asset) => 
        Math.max(max, (asset.value / totalValue) * 100), 0))),
      100
    );

    const recommendations = await Promise.all(
      assets.map(asset => {
        const marketData = MARKET_DATA[asset.symbol as keyof typeof MARKET_DATA] || MARKET_DATA.SONIC;
        return generateRecommendation(
          asset,
          marketData,
          {
            totalValue,
            riskScore: weightedRiskScore,
            riskTolerance
          }
        );
      })
    );

    return {
      assets: assets.map(asset => ({
        ...asset,
        risk: calculateRiskLevel(calculateRiskScore(
          asset,
          MARKET_DATA[asset.symbol as keyof typeof MARKET_DATA] || MARKET_DATA.SONIC
        ))
      })),
      totalValue,
      riskScore: weightedRiskScore,
      diversificationScore,
      recommendations
    };
  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    // Return a safe fallback state
    return {
      assets: balances.map(balance => ({
        symbol: balance.symbol,
        balance: balance.balance,
        value: parseFloat(balance.balance) * MARKET_DATA.SONIC.price,
        change24h: 0,
        risk: 'medium',
        volatility: 0.15
      })),
      totalValue: balances.reduce((sum, balance) => 
        sum + (parseFloat(balance.balance) * MARKET_DATA.SONIC.price), 0),
      riskScore: 50,
      diversificationScore: 50,
      recommendations: balances.map(balance => ({
        action: 'hold',
        asset: balance.symbol,
        amount: '0',
        reason: 'Unable to generate recommendation due to market data unavailability',
        confidence: 60,
        priority: 'low'
      }))
    };
  }
}