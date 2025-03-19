import { getAIResponse, Message } from '../ai';

export interface ProposalAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export async function analyzeProposal(url: string): Promise<ProposalAnalysis> {
  try {
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are a governance proposal analyzer. When analyzing proposals:
        1. Always provide a clear, detailed summary
        2. List specific strengths with bullet points
        3. List potential concerns with bullet points
        Format your response exactly like this:
        Summary:
        [Your detailed summary here]

        Strengths:
        • [First strength]
        • [Second strength]
        • [Additional strengths...]

        Concerns:
        • [First concern]
        • [Second concern]
        • [Additional concerns...]`
      },
      {
        role: 'user',
        content: `Please analyze the governance proposal at ${url}. Follow the exact format specified above.`
      }
    ];

    const response = await getAIResponse(messages, 'governance');
    
    // Parse the response using the explicit sections
    const sections = response.split(/\n\n(?:Summary|Strengths|Concerns):\n/g).filter(Boolean);
    
    return {
      summary: sections[0]?.trim() || 'No summary available',
      strengths: (sections[1]?.match(/[•-]\s*([^\n]+)/g) || [])
        .map(item => item.replace(/^[•-]\s*/, '').trim()),
      weaknesses: (sections[2]?.match(/[•-]\s*([^\n]+)/g) || [])
        .map(item => item.replace(/^[•-]\s*/, '').trim())
    };
  } catch (error) {
    console.error('Error analyzing proposal:', error);
    throw new Error('Failed to analyze proposal');
  }
}