import { useState, useCallback, useEffect, useRef } from "react";

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

/** Strip markdown so TTS reads naturally */
export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " Here is a code example. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__|\*|_|~~)/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function pickClearEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const preferred = [
    "Google US English",
    "Samantha",
    "Microsoft Zira",
    "Microsoft David",
    "Alex",
    "Karen",
    "Daniel",
  ];

  for (const name of preferred) {
    const match = voices.find((v) => v.name.includes(name) && v.lang.startsWith("en"));
    if (match) return match;
  }

  return (
    voices.find((v) => v.lang === "en-US" && !v.localService) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0]
  );
}

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const speak = useCallback((text: string, onComplete?: () => void) => {
    const synth = window.speechSynthesis;
    synth.cancel();

    const cleanText = stripMarkdownForSpeech(text);
    if (!cleanText) {
      onComplete?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = voicesRef.current.length
      ? voicesRef.current
      : synth.getVoices();

    const voice = pickClearEnglishVoice(voices);
    if (voice) utterance.voice = voice;

    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onComplete?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onComplete?.();
    };

    synth.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(
    (onComplete: (text: string) => void): void => {
      const RecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!RecognitionConstructor) {
        console.error("Speech Recognition not supported.");
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new RecognitionConstructor();
      recognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      let finalTranscript = "";

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        finalTranscript = event.results[0][0].transcript.trim();
      };

      recognition.onerror = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        if (finalTranscript) {
          onComplete(finalTranscript);
        }
      };

      recognition.start();
    },
    []
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    setIsSpeaking,
  };
};
