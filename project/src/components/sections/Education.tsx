import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Book, Award, ChevronLeft, CheckCircle, XCircle, BookOpen, GraduationCap, Clock, Plus, Loader2 } from 'lucide-react';
import { lessons, generateLesson, type Lesson } from '../../services/education/lessons';
import { achievements, mintAchievementNFT } from '../../services/education/achievements';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true
});

const renderer = new marked.Renderer();
renderer.heading = (text, level) => {
  const className = `text-${level === 1 ? '3xl' : level === 2 ? '2xl' : 'xl'} font-bold mb-4 mt-6 text-white`;
  return `<h${level} class="${className}">${text}</h${level}>`;
};

renderer.paragraph = (text) => {
  return `<p class="text-gray-300 mb-4 leading-relaxed">${text}</p>`;
};

renderer.list = (body, ordered) => {
  const type = ordered ? 'ol' : 'ul';
  return `<${type} class="list-${ordered ? 'decimal' : 'disc'} pl-6 mb-4 text-gray-300 space-y-2">${body}</${type}>`;
};

renderer.listitem = (text) => {
  return `<li class="text-gray-300">${text}</li>`;
};

renderer.code = (code, language) => {
  return `<pre class="bg-gray-800 rounded-lg p-4 mb-4 overflow-x-auto">
    <code class="text-sm font-mono text-gray-300">${code}</code>
  </pre>`;
};

marked.use({ renderer });

interface QuizState {
  currentQuestion: number;
  answers: number[];
  submitted: boolean;
  score: number;
}

export function Education() {
  const { isConnected, address } = useAccount();
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [generatedLesson, setGeneratedLesson] = useState<Lesson | null>(null);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    answers: [],
    submitted: false,
    score: 0
  });
  const [showingQuiz, setShowingQuiz] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState(false);

  const currentLesson = selectedLesson 
    ? (generatedLesson?.id === selectedLesson ? generatedLesson : lessons.find(l => l.id === selectedLesson))
    : null;

  const handleGenerateLesson = async () => {
    if (!topic.trim()) return;
    
    setGenerating(true);
    try {
      const lesson = await generateLesson(topic);
      setGeneratedLesson(lesson);
      setSelectedLesson(lesson.id);
      setShowTopicInput(false);
      setTopic('');
    } catch (error) {
      console.error('Error generating lesson:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartQuiz = () => {
    setShowingQuiz(true);
    setQuizState({
      currentQuestion: 0,
      answers: [],
      submitted: false,
      score: 0
    });
    setMintError(null);
    setMintSuccess(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (quizState.submitted) return;

    const newAnswers = [...quizState.answers];
    newAnswers[quizState.currentQuestion] = answerIndex;
    setQuizState({ ...quizState, answers: newAnswers });
  };

  const handleNextQuestion = () => {
    if (currentLesson && quizState.currentQuestion < currentLesson.quiz.length - 1) {
      setQuizState({ ...quizState, currentQuestion: quizState.currentQuestion + 1 });
    }
  };

  const handlePreviousQuestion = () => {
    if (quizState.currentQuestion > 0) {
      setQuizState({ ...quizState, currentQuestion: quizState.currentQuestion - 1 });
    }
  };

  const calculateScore = () => {
    if (!currentLesson) return 0;
    const correctAnswers = quizState.answers.reduce((count, answer, index) => {
      return count + (answer === currentLesson.quiz[index].correctAnswer ? 1 : 0);
    }, 0);
    return Math.round((correctAnswers / currentLesson.quiz.length) * 100);
  };

  const handleSubmitQuiz = async () => {
    if (!currentLesson || !address || !window.ethereum) return;

    const score = calculateScore();
    setQuizState({ ...quizState, submitted: true, score });

    if (score === 100) {
      const achievement = achievements.find(a => a.lessonId === currentLesson.id);
      if (achievement) {
        setMinting(true);
        setMintError(null);
        setMintSuccess(false);
        
        try {
          const txHash = await mintAchievementNFT(achievement, address, window.ethereum);
          console.log('NFT minted successfully:', txHash);
          setMintSuccess(true);
        } catch (error) {
          console.error('Error minting achievement:', error);
          setMintError(
            error instanceof Error 
              ? error.message 
              : 'Failed to mint achievement NFT. Please try again.'
          );
        } finally {
          setMinting(false);
        }
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center text-white p-12 bg-white/5 rounded-xl">
        <GraduationCap className="w-16 h-16 mb-4 text-blue-400" />
        <h2 className="text-2xl font-bold mb-2">Welcome to Arbitrum Academy</h2>
        <p className="text-gray-400 text-center max-w-md">
          Connect your wallet to start learning about Arbitrum and earn NFT achievements.
        </p>
      </div>
    );
  }

  return (
    <div className="text-white space-y-8">
      {!selectedLesson ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Arbitrum Academy</h2>
              <p className="text-gray-400">Master Arbitrum and earn NFT achievements</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <Award className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Available Achievements</p>
                  <p className="text-xl font-bold">{achievements.length}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTopicInput(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Lesson
              </button>
            </div>
          </div>

          {showTopicInput && (
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Create a Custom Lesson</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter an Arbitrum topic (e.g., Rollups, Nitro, Cross-chain)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={generating}
                />
                <button
                  onClick={handleGenerateLesson}
                  disabled={!topic.trim() || generating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-5 h-5" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...(generatedLesson ? [generatedLesson] : []), ...lessons].map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson.id)}
                className="group bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-6 cursor-pointer hover:from-white/15 hover:to-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <Book className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold group-hover:text-blue-400 transition-colors">
                      {lesson.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>15-20 min</span>
                      <span>•</span>
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span>NFT Achievement</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">{lesson.description}</p>
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Start Learning</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : currentLesson ? (
        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedLesson(null);
              setShowingQuiz(false);
              setQuizState({
                currentQuestion: 0,
                answers: [],
                submitted: false,
                score: 0
              });
              setMintError(null);
              setMintSuccess(false);
            }}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Lessons
          </button>

          {!showingQuiz ? (
            <>
              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>15-20 min</span>
                  </div>
                </div>
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked(currentLesson.content) }}
                />
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleStartQuiz}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Award className="w-5 h-5" />
                  Take Quiz & Earn NFT
                </button>
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">Quiz: {currentLesson.title}</h3>
              
              {quizState.submitted ? (
                <div className="space-y-8">
                  <div className="text-center">
                    <h4 className="text-3xl font-bold mb-4">Your Score: {quizState.score}%</h4>
                    {quizState.score === 100 ? (
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                          <CheckCircle className="w-20 h-20 text-green-500 relative z-10" />
                        </div>
                        <p className="text-xl text-green-400">Congratulations! You've earned an NFT achievement!</p>
                        {minting ? (
                          <div className="flex items-center gap-3 text-blue-400">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                            <p>Minting your achievement NFT...</p>
                          </div>
                        ) : mintSuccess ? (
                          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                            <p className="text-green-400">NFT minted successfully!</p>
                          </div>
                        ) : mintError ? (
                          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                            <p className="text-red-400 mb-3">{mintError}</p>
                            <button
                              onClick={handleSubmitQuiz}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              Try Minting Again
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
                          <XCircle className="w-20 h-20 text-red-500 relative z-10" />
                        </div>
                        <p className="text-xl text-red-400">Keep learning and try again to earn the NFT achievement!</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => {
                        setShowingQuiz(false);
                        setQuizState({
                          currentQuestion: 0,
                          answers: [],
                          submitted: false,
                          score: 0
                        });
                        setMintError(null);
                        setMintSuccess(false);
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Review Lesson
                    </button>
                    <button
                      onClick={handleStartQuiz}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      Question {quizState.currentQuestion + 1} of {currentLesson.quiz.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${((quizState.currentQuestion + 1) / currentLesson.quiz.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">
                        {Math.round(((quizState.currentQuestion + 1) / currentLesson.quiz.length) * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <p className="text-xl font-medium">
                      {currentLesson.quiz[quizState.currentQuestion].question}
                    </p>
                    <div className="grid gap-3">
                      {currentLesson.quiz[quizState.currentQuestion].options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          className={`w-full text-left p-4 rounded-lg transition-all duration-300 ${
                            quizState.answers[quizState.currentQuestion] === index
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                              : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                              quizState.answers[quizState.currentQuestion] === index
                                ? 'border-white bg-white/20'
                                : 'border-gray-500'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            {option}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={quizState.currentQuestion === 0}
                      className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {quizState.currentQuestion === currentLesson.quiz.length - 1 ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={quizState.answers.length !== currentLesson.quiz.length}
                        className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Award className="w-5 h-5" />
                        Submit
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        disabled={quizState.answers[quizState.currentQuestion] === undefined}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}