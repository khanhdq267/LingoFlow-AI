import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Topic, VocabularyWord, SpeechEvaluation } from "../types";

// Helper to get AI instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a list of suggested topics for vocabulary learning.
 */
export const generateTopics = async (userInterests: string = ""): Promise<Topic[]> => {
  const ai = getAI();
  const prompt = userInterests 
    ? `Generate 6 diverse vocabulary learning topics based on this interest: "${userInterests}".` 
    : "Generate 6 diverse and engaging vocabulary learning topics ranging from Business to Travel to Daily Life.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a helpful language tutor. Output strictly valid JSON.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            icon: { type: Type.STRING, description: "A valid lucide-react icon name (e.g., 'Briefcase', 'Coffee', 'Plane')" }
          },
          required: ["id", "name", "description", "icon"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

/**
 * Generates vocabulary words for a specific topic.
 */
export const generateVocabulary = async (topicName: string): Promise<VocabularyWord[]> => {
  const ai = getAI();
  const prompt = `Generate 5 useful vocabulary words or idioms related to the topic: "${topicName}". Include IPA pronunciation and a usage example.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            definition: { type: Type.STRING },
            exampleSentence: { type: Type.STRING },
            ipa: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
            contextNote: { type: Type.STRING }
          },
          required: ["word", "definition", "exampleSentence", "ipa", "difficulty"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

/**
 * Generates TTS audio for a given text.
 * Returns a base64 string of the audio.
 */
export const generateTTS = async (text: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

/**
 * Evaluates user speech pronunciation against a target word/phrase.
 */
export const evaluatePronunciation = async (audioBase64: string, targetText: string): Promise<SpeechEvaluation> => {
  const ai = getAI();
  
  // Clean base64 header if present
  const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z]+;base64,/, "");

  const prompt = `
    Analyze the user's pronunciation of the word/phrase: "${targetText}".
    Focus on clarity, intonation, and phoneme accuracy.
    Provide a score (0-100), identify any mispronounced sounds, and give a helpful tip.
    Be encouraging but precise.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "audio/webm; codecs=opus", // Assuming webm from browser recording
            data: cleanBase64
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          mispronouncedPhonemes: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvementTip: { type: Type.STRING }
        },
        required: ["score", "feedback", "mispronouncedPhonemes", "improvementTip"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
