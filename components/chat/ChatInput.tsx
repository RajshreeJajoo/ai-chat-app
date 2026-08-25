import { StopCircle, MicVocal, Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  onStop: () => void;
  loading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onVoiceInput: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  isBusy: boolean;
}

export const ChatInput = ({
  input,
  setInput,
  onSend,
  onStop,
  loading,
  textareaRef,
  onVoiceInput,
  isListening,
  isSpeaking,
  isBusy,
}: ChatInputProps) => {
  return (
    <div className="p-4 md:pb-8 max-w-3xl mx-auto w-full bg-white">
      {(isListening || isSpeaking) && (
        <p className="text-xs text-center mb-2 text-purple-600 font-medium">
          {isListening ? "Listening… speak your question" : "Speaking answer…"}
        </p>
      )}
      <div className="flex gap-2 bg-white p-2 rounded-[24px] shadow-lg border border-gray-200 items-end">
        <textarea
          ref={textareaRef}
          rows={1}
          className="flex-1 p-3 outline-none text-black bg-transparent resize-none max-h-40 overflow-y-auto text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={isListening ? "Listening…" : "Type your question…"}
          disabled={isListening}
        />

        {isBusy ? (
          <button
            type="button"
            aria-label="Stop"
            onClick={onStop}
            className="mb-2.5 text-red-500"
          >
            <StopCircle />
          </button>
        ) : (
          <>
            <button
              type="button"
              aria-label="Send message"
              onClick={onSend}
              disabled={!input.trim()}
              className="mb-2.5 text-black disabled:opacity-30"
            >
              <Send />
            </button>
            <button
              type="button"
              aria-label="Ask with voice"
              onClick={onVoiceInput}
              className="mb-2.5 text-purple-600"
            >
              <MicVocal />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
