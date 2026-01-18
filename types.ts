export interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface VocabularyWord {
  word: string;
  definition: string;
  exampleSentence: string;
  ipa: string; // International Phonetic Alphabet
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  contextNote?: string;
}

export interface SpeechEvaluation {
  score: number; // 0-100
  feedback: string;
  mispronouncedPhonemes: string[];
  improvementTip: string;
}

export enum AppState {
  TOPIC_SELECTION,
  LEARNING,
  SUMMARY
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
