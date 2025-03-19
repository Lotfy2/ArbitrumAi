import axios from 'axios';
import { z } from 'zod';

const API_KEY = 'tgp_v1_8ZIsu-74iX0v3klU0f3J04Sb7h4gyVLcO78ajMv1Ask';
const API_URL = 'https://api.together.xyz/v1/chat/completions';

// Schema definitions for type safety
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
});

const AIResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string()
    })
  }))
});

const SentimentSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  score: z.number().min(-1).max(1)
});

export type Message = z.infer<typeof MessageSchema>;
export type SentimentResponse = z.infer<typeof SentimentSchema>;

function sanitizeMessage(message: Message): { role: string; content: string } {
  return {
    role: String(message.role),
    content: String(message.content)
  };
}

export async function getAIResponse(
  messages: Message[],
  context: string
): Promise<string> {
  try {
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant specialized in ${context}. Provide accurate and helpful responses.`
    };

    const sanitizedMessages = [
      sanitizeMessage(systemMessage),
      ...messages.map(sanitizeMessage)
    ];

    const response = await axios.post(
      API_URL,
      {
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        messages: sanitizedMessages,
        temperature: 0.7,
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const parsedResponse = AIResponseSchema.safeParse(response.data);
    if (!parsedResponse.success) {
      console.error('Response validation failed:', parsedResponse.error);
      return 'Failed to process the response. Please try again.';
    }

    return parsedResponse.data.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    if (error instanceof Error) {
      console.error('AI API Error:', error.message);
    }
    return 'I apologize, but I encountered an error processing your request. Please try again.';
  }
}

export async function analyzeSentiment(text: string): Promise<SentimentResponse> {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: 'Analyze the sentiment of the following text and return a JSON object with sentiment (positive, negative, or neutral) and a score from -1 to 1.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const parsedResponse = AIResponseSchema.safeParse(response.data);
    if (!parsedResponse.success) {
      console.error('Response validation failed:', parsedResponse.error);
      return { sentiment: 'neutral', score: 0 };
    }

    try {
      const content = parsedResponse.data.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);
      const parsedResult = SentimentSchema.safeParse(result);
      
      if (parsedResult.success) {
        return parsedResult.data;
      }
    } catch (parseError) {
      console.error('Failed to parse sentiment result:', parseError);
    }
    
    return { sentiment: 'neutral', score: 0 };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Sentiment Analysis Error:', error.message);
    }
    return { sentiment: 'neutral', score: 0 };
  }
}