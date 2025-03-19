import { z } from 'zod';
import { getAIResponse } from '../ai';

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  content: z.string(),
  quiz: z.array(z.object({
    id: z.string(),
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number(),
    explanation: z.string()
  }))
});

export type Lesson = z.infer<typeof LessonSchema>;

export const lessons: Lesson[] = [
  {
    id: 'blockchain-basics',
    title: 'Arbitrum Fundamentals',
    description: 'Learn the core concepts of Arbitrum and Layer 2 scaling',
    content: `
# Introduction to Arbitrum

Arbitrum is a Layer 2 scaling solution for Ethereum that dramatically reduces costs and latency. Let's explore the key concepts:

## What is Arbitrum?

Arbitrum is a Layer 2 rollup chain that inherits Ethereum's security while offering much lower fees and faster transactions. It processes transactions off the main Ethereum chain (Layer 1) but posts transaction data back to Ethereum.

## Key Components

1. **Rollups**
   - Bundles multiple transactions together
   - Posts compressed data to Ethereum
   - Inherits Ethereum's security

2. **Arbitrum Virtual Machine (AVM)**
   - Fully compatible with EVM
   - Runs Ethereum smart contracts
   - No code changes needed

3. **Fraud Proofs**
   - Ensures transaction validity
   - Allows challenge of invalid state
   - Maintains security

## How Does It Work?

1. Users submit transactions to Arbitrum
2. Transactions are bundled into rollups
3. Transaction data is posted to Ethereum
4. State is computed off-chain
5. Fraud proofs ensure correctness
6. Results are finalized on Ethereum

## Benefits

- Lower transaction fees
- Faster confirmations
- Ethereum security
- EVM compatibility
- Decentralized validation
    `,
    quiz: [
      {
        id: 'q1',
        question: 'What is the main advantage of Arbitrum?',
        options: [
          'Complete independence from Ethereum',
          'Lower fees while inheriting Ethereum security',
          'Slower but cheaper transactions',
          'New programming language'
        ],
        correctAnswer: 1,
        explanation: 'Arbitrum provides lower transaction fees while maintaining Ethereum\'s security through its Layer 2 rollup technology.'
      },
      {
        id: 'q2',
        question: 'How does Arbitrum achieve scalability?',
        options: [
          'By increasing block size',
          'Through a separate blockchain',
          'Using rollups to batch transactions',
          'By reducing security'
        ],
        correctAnswer: 2,
        explanation: 'Arbitrum uses rollup technology to batch multiple transactions together, reducing costs while maintaining security.'
      },
      {
        id: 'q3',
        question: 'What is the Arbitrum Virtual Machine (AVM)?',
        options: [
          'A new blockchain',
          'An EVM-compatible execution environment',
          'A cryptocurrency wallet',
          'A mining protocol'
        ],
        correctAnswer: 1,
        explanation: 'The AVM is an EVM-compatible execution environment that allows Ethereum smart contracts to run without modifications.'
      }
    ]
  },
  {
    id: 'smart-contracts',
    title: 'Smart Contracts on Arbitrum',
    description: 'Understanding smart contract development and deployment on Arbitrum',
    content: `
# Smart Contracts on Arbitrum

Learn how to develop and deploy smart contracts on Arbitrum's Layer 2 solution.

## Smart Contract Compatibility

1. **EVM Compatibility**
   - Full Solidity support
   - Existing Ethereum contracts work as-is
   - Same development tools

2. **Key Differences**
   - Lower gas costs
   - Faster confirmations
   - L1 to L2 messaging

3. **Development Tools**
   - Hardhat
   - Truffle
   - Foundry
   - Remix

## Best Practices

1. **Gas Optimization**
   - Batch operations
   - Efficient storage
   - State compression

2. **Security Considerations**
   - L1 to L2 messaging security
   - Fraud proof awareness
   - Cross-chain interactions

3. **Testing**
   - Local development
   - Testnet deployment
   - Integration testing
    `,
    quiz: [
      {
        id: 'q1',
        question: 'What makes Arbitrum smart contracts special?',
        options: [
          'They require a new programming language',
          'They are identical to Ethereum contracts but cheaper to execute',
          'They cannot interact with Ethereum',
          'They are slower but more secure'
        ],
        correctAnswer: 1,
        explanation: 'Arbitrum smart contracts are identical to Ethereum contracts but benefit from lower execution costs on Layer 2.'
      },
      {
        id: 'q2',
        question: 'Which development tools can you use with Arbitrum?',
        options: [
          'Only Arbitrum-specific tools',
          'Standard Ethereum tools like Hardhat and Truffle',
          'Only web-based tools',
          'Java development kit'
        ],
        correctAnswer: 1,
        explanation: 'Arbitrum supports all standard Ethereum development tools like Hardhat and Truffle due to its EVM compatibility.'
      },
      {
        id: 'q3',
        question: 'What is important to consider when developing on Arbitrum?',
        options: [
          'L1 to L2 messaging and gas optimization',
          'New programming paradigms',
          'Different smart contract language',
          'Slower execution times'
        ],
        correctAnswer: 0,
        explanation: 'When developing on Arbitrum, it\'s important to consider L1 to L2 messaging patterns and gas optimization strategies.'
      }
    ]
  }
];

export async function generateLesson(topic: string): Promise<Lesson> {
  try {
    const contentPrompt = `Create a comprehensive lesson about ${topic} in the context of Arbitrum and Layer 2 scaling. Include:
    1. A detailed explanation with sections and subsections
    2. Real-world examples and applications
    3. Key concepts and terminology
    4. Technical details where appropriate
    
    Format the content in markdown with proper headings, lists, and emphasis.`;

    const content = await getAIResponse([
      { role: 'system', content: 'You are an expert blockchain educator specializing in Arbitrum and Layer 2 scaling. Create detailed, accurate, and engaging content.' },
      { role: 'user', content: contentPrompt }
    ], 'education');

    const quizPrompt = `Create 3 multiple-choice questions to test understanding of ${topic} in the context of Arbitrum. 
    Format your response exactly like this example:
    {
      "questions": [
        {
          "question": "What is the main advantage of Arbitrum?",
          "options": [
            "Higher gas fees",
            "Lower fees while maintaining security",
            "Independent blockchain",
            "Slower transactions"
          ],
          "correctAnswer": 1,
          "explanation": "Arbitrum's main advantage is providing lower fees while maintaining Ethereum's security through Layer 2 scaling."
        }
      ]
    }`;

    const quizResponse = await getAIResponse([
      { role: 'system', content: 'You are an expert at creating educational assessments for Arbitrum and Layer 2 scaling. Generate clear, challenging questions that test understanding.' },
      { role: 'user', content: quizPrompt }
    ], 'education');

    let quiz;
    try {
      const parsedQuiz = JSON.parse(quizResponse);
      quiz = parsedQuiz.questions.map((q: any, index: number) => ({
        id: `generated-${Date.now()}-${index}`,
        ...q
      }));
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', parseError);
      quiz = [
        {
          id: `generated-${Date.now()}-0`,
          question: `What is the most important aspect of ${topic} in Arbitrum?`,
          options: [
            'Option A',
            'Option B',
            'Option C',
            'Option D'
          ],
          correctAnswer: 0,
          explanation: 'This is a default question due to generation error.'
        }
      ];
    }

    const lesson: Lesson = {
      id: `generated-${Date.now()}`,
      title: `Understanding ${topic} on Arbitrum`,
      description: `A comprehensive guide to ${topic} in the context of Arbitrum and Layer 2 scaling`,
      content,
      quiz
    };

    const validatedLesson = LessonSchema.parse(lesson);
    return validatedLesson;

  } catch (error) {
    console.error('Error generating lesson:', error);
    throw new Error('Failed to generate lesson content');
  }
}