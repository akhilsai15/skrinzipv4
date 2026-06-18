export const MOCK_TRANSLATIONS: Record<
  string,
  { translated: string; from: string; to: string; confidence: number }
> = {
  "నమస్కారం! ఎలా ఉన్నావు?": {
    translated: "Hello! How are you?",
    from: "Telugu",
    to: "English",
    confidence: 0.98,
  },
  "వైబ్ చూశావా? చాలా బాగుంది!": {
    translated: "Did you see the vibe? It's really good!",
    from: "Telugu",
    to: "English",
    confidence: 0.95,
  },
  "आज रात गेम खेलते हैं?": {
    translated: "Shall we play a game tonight?",
    from: "Hindi",
    to: "English",
    confidence: 0.97,
  },
  "நன்றி மச்சான்!": {
    translated: "Thanks bro!",
    from: "Tamil",
    to: "English",
    confidence: 0.94,
  },
  "ಹೇಗಿದ್ದೀರಿ? ಚೆನ್ನಾಗಿದ್ದೀರಾ?": {
    translated: "How are you? Are you doing well?",
    from: "Kannada",
    to: "English",
    confidence: 0.96,
  },
  "ഹലോ! സുഖമാണോ?": {
    translated: "Hello! Are you well?",
    from: "Malayalam",
    to: "English",
    confidence: 0.95,
  },
};

export const detectLanguage = (text: string): string => {
  if (/[\u0C00-\u0C7F]/.test(text)) return "Telugu";
  if (/[\u0900-\u097F]/.test(text)) return "Hindi";
  if (/[\u0B80-\u0BFF]/.test(text)) return "Tamil";
  if (/[\u0C80-\u0CFF]/.test(text)) return "Kannada";
  if (/[\u0D00-\u0D7F]/.test(text)) return "Malayalam";
  return "English";
};

export const getTranslation = (text: string) => {
  return MOCK_TRANSLATIONS[text] || null;
};
