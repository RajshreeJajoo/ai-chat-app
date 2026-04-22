import { useState, useCallback } from 'react';

// Browser interfaces ko accurately map karna
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  start: () => void;
  continuous:boolean;
  interimResults:boolean;
  // Event handlers ko specific type dena
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

export const useSpeech = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
const [isSpeaking, setIsSpeaking] = useState(false);
const speak = useCallback((text: string, shouldSpeak: boolean) => {
  if (!shouldSpeak) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  const voices = synth.getVoices();
  const hindiVoice = voices.find(v => v.lang === 'hi-IN') || voices[0];
  utterance.onstart = () => setIsSpeaking(true);
  utterance.onend = () => setIsSpeaking(false);
  utterance.onerror = () => setIsSpeaking(false);
  utterance.voice = hindiVoice;
  utterance.lang = text.match(/[a-zA-Z]/) ? 'en-US' : 'hi-IN';
//   utterance.lang = 'hi-IN';
  utterance.rate = 1.0; 
  utterance.pitch = 1.0; 
  
  synth.speak(utterance);
}, []);

  const startListening = useCallback((onResult: (text: string) => void): void => {
    const RecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!RecognitionConstructor) {
      console.error("Speech Recognition not supported.");
      return;
    }

    const recognition = new RecognitionConstructor();
    recognition.lang = 'en-US'; 
   recognition.continuous = true;
    recognition.interimResults = false;
    // Typed event handlers
    recognition.onstart = (): void => setIsListening(true);
    recognition.onend = (): void => setIsListening(false);
    
    // recognition.onresult = (event: SpeechRecognitionEvent): void => {
    // const transcript = Array.from(event.results)
    //     .map((result) => result[0].transcript)
    //     .join('');
    //   onResult(transcript);
    // };
    recognition.onresult = (event: SpeechRecognitionEvent): void => {
      // Sirf last index ka transcript lein (purana repeat nahi hoga)
      const lastIndex = event.results.length - 1;
      const transcript = event.results[lastIndex][0].transcript;
      onResult(transcript);
    };

    recognition.start();
  }, []);

  return { isListening, speak, startListening , isSpeaking , setIsSpeaking };
};