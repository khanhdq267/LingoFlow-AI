import React, { useState, useEffect } from 'react';
import { Topic, VocabularyWord, AppState } from './types';
import { generateTopics, generateVocabulary } from './services/geminiService';
import TopicGrid from './components/TopicGrid';
import WordCard from './components/WordCard';
import { Sparkles, ArrowLeft, BrainCircuit } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.TOPIC_SELECTION);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [loadingVocab, setLoadingVocab] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Initial load
  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setLoadingTopics(true);
    try {
      const data = await generateTopics();
      setTopics(data);
    } catch (e) {
      console.error("Failed to load topics", e);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleTopicSelect = async (topic: Topic) => {
    setSelectedTopic(topic);
    setLoadingVocab(true);
    setAppState(AppState.LEARNING);
    try {
      const words = await generateVocabulary(topic.name);
      setVocabulary(words);
      setCurrentWordIndex(0);
    } catch (e) {
      console.error("Failed to load vocab", e);
      setAppState(AppState.TOPIC_SELECTION); // Revert on error
    } finally {
      setLoadingVocab(false);
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < vocabulary.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setAppState(AppState.SUMMARY);
    }
  };

  const resetApp = () => {
    setAppState(AppState.TOPIC_SELECTION);
    setSelectedTopic(null);
    setVocabulary([]);
    setCurrentWordIndex(0);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <BrainCircuit size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-indigo-900">LingoFlow AI</span>
          </div>
          {appState === AppState.LEARNING && selectedTopic && (
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500">
              <span>{selectedTopic.name}</span>
              <span className="text-slate-300">•</span>
              <span>{currentWordIndex + 1} / {vocabulary.length}</span>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        
        {/* VIEW: Topic Selection */}
        {appState === AppState.TOPIC_SELECTION && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="text-center space-y-4 py-8">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                What do you want to <br className="hidden sm:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  master today?
                </span>
              </h1>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Select a topic below, and our AI will craft a personalized lesson with pronunciation coaching.
              </p>
            </header>
            
            <TopicGrid 
              topics={topics} 
              onSelect={handleTopicSelect} 
              loading={loadingTopics} 
            />
            
            <div className="flex justify-center mt-12">
               <button 
                onClick={loadTopics} 
                className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                disabled={loadingTopics}
               >
                 <Sparkles size={16} /> Refresh Topics
               </button>
            </div>
          </div>
        )}

        {/* VIEW: Learning Mode */}
        {appState === AppState.LEARNING && (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
            <button 
              onClick={resetApp}
              className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} /> Back to Topics
            </button>

            {loadingVocab ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-lg font-medium text-slate-600 animate-pulse">Generating your lesson...</p>
              </div>
            ) : vocabulary.length > 0 ? (
              <div key={currentWordIndex}> {/* Key helps React reset state between words */}
                <WordCard 
                  word={vocabulary[currentWordIndex]} 
                  onNext={handleNextWord} 
                />
                
                {/* Progress Bar */}
                <div className="mt-8 flex items-center gap-2">
                   <div className="h-2 flex-grow bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                        style={{ width: `${((currentWordIndex + 1) / vocabulary.length) * 100}%` }}
                      />
                   </div>
                   <span className="text-xs font-semibold text-slate-400 min-w-[3rem] text-right">
                     {Math.round(((currentWordIndex + 1) / vocabulary.length) * 100)}%
                   </span>
                </div>
              </div>
            ) : (
              <div className="text-center p-10">
                <p>Something went wrong loading the vocabulary.</p>
                <button onClick={resetApp} className="text-indigo-600 underline mt-4">Go Home</button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: Summary */}
        {appState === AppState.SUMMARY && (
          <div className="text-center py-16 animate-in zoom-in duration-500">
             <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 text-green-600 rounded-full mb-6">
               <Sparkles size={48} />
             </div>
             <h2 className="text-4xl font-bold text-slate-900 mb-4">Lesson Complete!</h2>
             <p className="text-xl text-slate-500 mb-10 max-w-lg mx-auto">
               You've practiced {vocabulary.length} new words in <span className="font-semibold text-indigo-600">{selectedTopic?.name}</span>.
             </p>
             <button 
               onClick={resetApp}
               className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1"
             >
               Start New Topic
             </button>
          </div>
        )}
      </main>
    </div>
  );
}
