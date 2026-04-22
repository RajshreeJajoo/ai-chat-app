import { StopCircle , MicVocal ,Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  onStop: () => void;
  loading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onVoiceInput: () => void;
  isListening: boolean;
  isLastInputVoice:boolean;
  isSpeaking:boolean;
}
export const ChatInput = ({ input, setInput, onSend, onStop, loading, textareaRef ,onVoiceInput,isSpeaking , }: ChatInputProps) =>
    {
        // const isActionActive = loading || isListening || isSpeaking;
        return  (
  <div className="p-4 md:pb-8 max-w-3xl mx-auto w-full bg-white">
    <div className="flex gap-2 bg-white p-2 rounded-[24px] shadow-lg border border-gray-200 items-end">
      <textarea
        ref={textareaRef}
        rows={1}
        className="flex-1 p-3 outline-none text-black bg-transparent resize-none max-h-40 overflow-y-auto text-sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
         onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        placeholder="Sawal pucho..."
      />
     

 {loading || isSpeaking? (
        <StopCircle onClick={onStop} style={{marginBottom:'10px', color :"red"}}/>
      ) : (
               
        <>
        <button onClick={onSend} disabled={!input.trim()}><Send style={{marginBottom:'10px', color :"black"}}/></button>

         <MicVocal onClick={onVoiceInput} style={{marginBottom:'10px', color :"black"}}/>
        </>
    )}
     
      
    </div>
  </div>
    )
    };