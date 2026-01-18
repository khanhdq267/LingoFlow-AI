import React, { useState, useRef } from 'react';
import { VocabularyWord, SpeechEvaluation } from '../types';
import { Volume2, Mic, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { generateTTS, evaluatePronunciation } from '../services/geminiService';
import { blobToBase64, playBase64Audio } from '../utils/audioUtils';

interface WordCardProps {
  word: VocabularyWord;
  onNext?: () => void;
}

const WordCard: React.FC<WordCardProps> = ({ word, onNext }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [evaluation, setEvaluation] = useState<SpeechEvaluation | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handlePlayTTS = async () => {
    if (isPlayingTTS) return;
    setIsPlayingTTS(true);
    try {
      const audioData = await generateTTS(word.word + ". " + word.exampleSentence);
      if (audioData) {
        playBase64Audio(audioData);
      }
    } finally {
      setIsPlayingTTS(false);
    }
  };

  const startRecording = async () => {
    try {
      setEvaluation(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(blob);
        handleEvaluation(base64);
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleEvaluation = async (audioBase64: string) => {
    setIsEvaluating(true);
    try {
      const result = await evaluatePronunciation(audioBase64, word.word);
      setEvaluation(result);
    } catch (error) {
      console.error("Eval error", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-2xl w-full mx-auto border border-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white relative">
        <div className="flex justify-between items-start">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-3 bg-white/20 uppercase`}>
              {word.difficulty}
            </span>
            <h2 className="text-5xl font-bold mb-2 tracking-tight">{word.word}</h2>
            <p className="text-indigo-100 text-xl font-mono opacity-90">{word.ipa}</p>
          </div>
          <button 
            onClick={handlePlayTTS}
            disabled={isPlayingTTS}
            className="bg-white/20 hover:bg-white/30 p-4 rounded-full transition-colors backdrop-blur-sm"
          >
            {isPlayingTTS ? <Loader2 className="animate-spin" /> : <Volume2 size={32} />}
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8">
        <div className="mb-8">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Definition</h3>
          <p className="text-gray-800 text-lg leading-relaxed">{word.definition}</p>
        </div>

        <div className="mb-8 bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
          <h3 className="text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-2">Example</h3>
          <p className="text-indigo-900 text-lg italic">"{word.exampleSentence}"</p>
        </div>

        {/* Interaction Section */}
        <div className="flex flex-col items-center gap-6">
          {!evaluation && !isEvaluating && (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`
                group relative flex items-center justify-center w-24 h-24 rounded-full 
                transition-all duration-300 shadow-lg hover:shadow-indigo-500/30
                ${isRecording ? 'bg-red-500 scale-110' : 'bg-indigo-600 hover:bg-indigo-700'}
              `}
            >
              <Mic size={40} className="text-white z-10" />
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping"></span>
              )}
            </button>
          )}

          {isEvaluating && (
             <div className="flex flex-col items-center gap-3 text-indigo-600">
               <Loader2 className="animate-spin w-12 h-12" />
               <span className="font-medium animate-pulse">Analyzing pronunciation...</span>
             </div>
          )}

          {evaluation && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`p-6 rounded-2xl border-2 ${evaluation.score >= 80 ? 'border-green-100 bg-green-50' : 'border-orange-100 bg-orange-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {evaluation.score >= 80 ? <CheckCircle className="text-green-500" size={28}/> : <AlertCircle className="text-orange-500" size={28} />}
                    <h4 className="text-xl font-bold text-gray-800">Score: {evaluation.score}/100</h4>
                  </div>
                  <button 
                    onClick={() => setEvaluation(null)}
                    className="text-gray-400 hover:text-gray-600 text-sm underline"
                  >
                    Try Again
                  </button>
                </div>
                
                <p className="text-gray-700 mb-3">{evaluation.feedback}</p>
                
                {evaluation.mispronouncedPhonemes.length > 0 && (
                  <div className="mb-3">
                    <span className="text-sm font-semibold text-gray-500">Focus on: </span>
                    {evaluation.mispronouncedPhonemes.map((ph, idx) => (
                      <span key={idx} className="inline-block bg-white border px-2 py-0.5 rounded text-sm font-mono text-gray-700 mr-2 shadow-sm">
                        /{ph}/
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-start gap-2 text-sm text-gray-600 bg-white/50 p-3 rounded-lg">
                  <span className="font-bold">💡 Tip:</span>
                  <span>{evaluation.improvementTip}</span>
                </div>
              </div>

              {onNext && evaluation.score > 70 && (
                <button 
                  onClick={onNext}
                  className="mt-6 w-full py-4 bg-gray-900 text-white rounded-xl font-semibold shadow-lg hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  Next Word
                </button>
              )}
            </div>
          )}
          
          {!evaluation && !isEvaluating && (
            <p className="text-gray-400 text-sm font-medium">
              {isRecording ? "Release to stop..." : "Hold to record"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordCard;
