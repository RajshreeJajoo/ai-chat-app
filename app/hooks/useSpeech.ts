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

const MAX_CHUNK_LENGTH = 220;

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

function splitTextForSpeech(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]?/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((current + " " + trimmed).trim().length <= MAX_CHUNK_LENGTH) {
      current = `${current} ${trimmed}`.trim();
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > MAX_CHUNK_LENGTH) {
        const parts = trimmed.match(new RegExp(`.{1,${MAX_CHUNK_LENGTH}}(\\s|$)`, "g")) ?? [trimmed];
        chunks.push(...parts.map((part) => part.trim()).filter(Boolean));
      } else {
        current = trimmed;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text];
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
    "English",
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

function waitForVoices(timeoutMs = 4000): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();

    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    const finish = () => {
      synth.removeEventListener("voiceschanged", onChange);
      resolve(synth.getVoices());
    };

    const onChange = () => {
      if ( synth.getVoices().length > 0) {
        finish();
      }
    };

    synth.addEventListener("voiceschanged", onChange);
    window.setTimeout(finish, timeoutMs);
  });
}

/** Unlock browser TTS — call on mic button click (before async API wait) */
export function primeSpeechSynthesis(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  const synth = window.speechSynthesis;
  synth.resume();

  const utterance = new SpeechSynthesisUtterance(" ");
  utterance.volume = 0;
  utterance.rate = 10;
  synth.speak(utterance);
}

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
      }
    };
  }, []);

  const startKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
    }

    keepAliveRef.current = setInterval(() => {
      const synth = window.speechSynthesis;
      if (!synth.speaking && !synth.pending) {
        if (keepAliveRef.current) {
          clearInterval(keepAliveRef.current);
          keepAliveRef.current = null;
        }
        return;
      }
      synth.pause();
      synth.resume();
    }, 8000);
  }, []);

  const speak = useCallback(
    async (text: string, onComplete?: () => void) => {
      const synth = window.speechSynthesis;
      setSpeechError(null);
      synth.cancel();

      await new Promise((resolve) => window.setTimeout(resolve, 80));

      const cleanText = stripMarkdownForSpeech(text);
      if (!cleanText) {
        onComplete?.();
        return;
      }

      if (!("speechSynthesis" in window)) {
        setSpeechError("Speech not supported in this browser.");
        onComplete?.();
        return;
      }

      const voices = await waitForVoices();
      voicesRef.current = voices;
      const voice = pickClearEnglishVoice(voices);
      const chunks = splitTextForSpeech(cleanText);

      let chunkIndex = 0;
      let hadError = false;

      const speakNext = () => {
        if (chunkIndex >= chunks.length) {
          setIsSpeaking(false);
          if (keepAliveRef.current) {
            clearInterval(keepAliveRef.current);
            keepAliveRef.current = null;
          }
          if (hadError) {
            setSpeechError("Voice playback failed. Text answer is shown instead.");
          }
          onComplete?.();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang ?? "en-US";
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
          if (chunkIndex === 0) {
            setIsSpeaking(true);
            startKeepAlive();
          }
        };

        utterance.onend = () => {
          chunkIndex += 1;
          speakNext();
        };

        utterance.onerror = () => {
          hadError = true;
          chunkIndex += 1;
          speakNext();
        };

        synth.resume();
        synth.speak(utterance);
      };

      speakNext();
    },
    [startKeepAlive]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const startListening = useCallback((onComplete: (text: string) => void): void => {
    const RecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!RecognitionConstructor) {
      setSpeechError("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setSpeechError(null);
    primeSpeechSynthesis();

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
      setSpeechError("Could not hear you. Please try again or type your question.");
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (finalTranscript) {
        onComplete(finalTranscript);
      }
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    speechError,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    setIsSpeaking,
  };
};
