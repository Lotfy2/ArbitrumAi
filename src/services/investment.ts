import { getAIResponse } from './ai';
import { getTokenBalance } from './blockchain';

export interface Portfolio {
  tokens: {
    symbol: string;
    balance: string;
    value: number;
    allocation: number;
  }[];
  totalValue: number;
}

export interface InvestmentStrategy {
  recommendations: {
    action: 'buy' | 'sell' | 'hold';
    token: string;
    amount: string;
    reason: string;
  }[];
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: 'short' | 'medium' | 'long';
}

export async function analyzePortfolio(
  address: string,
  tokenAddresses: string[]
): Promise<Portfolio> {
  const portfolio: Portfolio = {
    tokens: [],
    totalValue: 0
  };

  for (const tokenAddress of tokenAddresses) {
    const balance = await getTokenBalance(address, tokenAddress);
    // In a production environment, you would fetch real token prices
    const mockPrice = Math.random() * 100; // Mock price for demonstration
    const value = parseFloat(balance.balance) * mockPrice;

    portfolio.tokens.push({
      symbol: balance.symbol,
      balance: balance.balance,
      value,
      allocation: 0 // Will be calculated after total is known
    });

    portfolio.totalValue += value;
  }

  // Calculate allocations
  portfolio.tokens = portfolio.tokens.map(token => ({
    ...token,
    allocation: (token.value / portfolio.totalValue) * 100
  }));

  return portfolio;
}

export async function generateInvestmentStrategy(
  portfolio: Portfolio,
  riskProfile: string,
  goals: string
): Promise<InvestmentStrategy> {
  const prompt = `
    Analyze this portfolio and generate investment recommendations:
    Current Portfolio: ${JSON.stringify(portfolio)}
    Risk Profile: ${riskProfile}
    Investment Goals: ${goals}
    
    Provide specific recommendations for each token, including whether to buy, sell, or hold.
    Consider market conditions and risk management.
  `;

  const response = await getAIResponse([{ role: 'user', content: prompt }], 'investment analysis');
  
  try {
    // Parse the AI response into a structured format
    // In a production environment, you would want more robust parsing
    const recommendations = response.split('\n')
      .filter(line => line.includes(':'))
      .map(line => {
        const [action, details] = line.split(':');
        return {
          action: action.toLowerCase().includes('buy') ? 'buy' : 
                 action.toLowerCase().includes('sell') ? 'sell' : 'hold',
          token: details.split(' ')[1],
          amount: details.split(' ')[3] || '0',
          reason: details.split('because')[1]?.trim() || 'Based on market analysis'
        };
      });

    return {
      recommendations,
      riskLevel: riskProfile.toLowerCase().includes('high') ? 'high' : 
                 riskProfile.toLowerCase().includes('low') ? 'low' : 'medium',
      timeframe: goals.toLowerCase().includes('long') ? 'long' :
                 goals.toLowerCase().includes('short') ? 'short' : 'medium'
    };
  } catch (error) {
    console.error('Error parsing investment strategy:', error);
    throw new Error('Failed to generate investment strategy');
  }
}