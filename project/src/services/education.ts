import { getAIResponse } from './ai';

const LESSONS = {
  'intro-sonic': {
    title: 'Introduction to Sonic Blockchain',
    sections: [
      'What is Sonic Blockchain?',
      'Key Features and Benefits',
      'Getting Started with Sonic',
      'Understanding Sonic Tokens'
    ]
  },
  'defi-fundamentals': {
    title: 'Fundamentals of DeFi',
    sections: [
      'Understanding DeFi Basics',
      'Common DeFi Protocols',
      'Yield Farming and Liquidity',
      'Risk Management in DeFi'
    ]
  }
};

export async function getLesson(lessonId: string, section: number) {
  const lesson = LESSONS[lessonId as keyof typeof LESSONS];
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  const sectionTitle = lesson.sections[section];
  if (!sectionTitle) {
    throw new Error('Section not found');
  }

  const context = `${lesson.title} - ${sectionTitle}`;
  const prompt = `Provide a detailed explanation of ${sectionTitle} in the context of ${lesson.title}. Include practical examples and key takeaways.`;

  return getAIResponse([{ role: 'user', content: prompt }], 'blockchain education');
}

export async function evaluateAnswer(lessonId: string, section: number, userAnswer: string) {
  const lesson = LESSONS[lessonId as keyof typeof LESSONS];
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  const sectionTitle = lesson.sections[section];
  const prompt = `Evaluate the following answer for the topic "${sectionTitle}" in ${lesson.title}. Provide feedback and suggestions for improvement:\n\n${userAnswer}`;

  return getAIResponse([{ role: 'user', content: prompt }], 'education evaluation');
}