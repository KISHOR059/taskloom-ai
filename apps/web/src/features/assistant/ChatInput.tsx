import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowUp, Sparkles, SlidersHorizontal, Mic, MicOff } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { VoiceSettingsDialog } from "./voice/VoiceSettingsDialog";
import { useSpeechRecognition } from "./voice/useSpeechRecognition";
import { useSpeechSynthesis } from "./voice/useSpeechSynthesis";
import {
  DEFAULT_VOICE_SETTINGS,
  VOICE_SETTINGS_STORAGE_KEY,
  type VoiceSettings,
} from "./voice/voice.types";
import { notify } from "@/shared/lib/notifications";
import { cn } from "@/shared/lib/cn";

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  lastAssistantMessage?: string;
  className?: string;
}

export function ChatInput({
  onSendMessage,
  disabled,
  lastAssistantMessage,
  className,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const prevMsgRef = useRef<string | undefined>(undefined);
  const inputId = useId();

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<VoiceSettings>;
          const normalized: VoiceSettings = {
            ...DEFAULT_VOICE_SETTINGS,
            ...parsed,
            autoSpeak: false,
          };
          localStorage.setItem(VOICE_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch {
      // Ignore
    }
    return DEFAULT_VOICE_SETTINGS;
  });

  const {
    isListening,
    transcript,
    error: recognitionError,
    isSupported: isRecSupported,
    start: startListening,
    stop: stopListening,
    clearTranscript,
  } = useSpeechRecognition();

  const { isSpeaking, voices, speak, stop: stopSpeaking } = useSpeechSynthesis();

  // Progressive fallback for browsers without CSS field-sizing: content
  const adjustTextareaHeightFallback = useCallback(() => {
    if (typeof CSS !== "undefined" && CSS.supports("field-sizing", "content")) {
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 160);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeightFallback();
  }, [input, transcript, adjustTextareaHeightFallback]);

  // Display recognition errors
  useEffect(() => {
    if (recognitionError) {
      notify.error("Voice Recognition", recognitionError);
    }
  }, [recognitionError]);

  // Speak AI response when new assistant message arrives (if autoSpeak is enabled)
  useEffect(() => {
    if (
      lastAssistantMessage &&
      lastAssistantMessage !== prevMsgRef.current &&
      voiceSettings.autoSpeak &&
      !disabled &&
      !isListening
    ) {
      prevMsgRef.current = lastAssistantMessage;
      speak(lastAssistantMessage, voiceSettings, () => {
        if (voiceSettings.autoListen && isRecSupported) {
          startListening(voiceSettings.language, (finalText: string) => {
            if (finalText.trim()) {
              onSendMessage(finalText.trim());
            }
          });
        }
      });
    }
  }, [
    lastAssistantMessage,
    voiceSettings,
    disabled,
    isListening,
    isRecSupported,
    speak,
    startListening,
    onSendMessage,
  ]);

  const handleSendText = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setInput("");
    clearTranscript();
    if (
      textareaRef.current &&
      (typeof CSS === "undefined" || !CSS.supports("field-sizing", "content"))
    ) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleStartListening = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    startListening(voiceSettings.language, (finalText: string) => {
      if (finalText.trim()) {
        handleSendText(finalText);
      }
    });
  };

  const handleToggleListen = () => {
    if (isListening) {
      stopListening();
      const textToSubmit = transcript || input;
      if (textToSubmit.trim()) {
        handleSendText(textToSubmit);
      }
    } else {
      handleStartListening();
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isListening) {
      stopListening();
    }
    const textToSubmit = isListening ? transcript || input : input;
    handleSendText(textToSubmit);
  };

  // IME-safe Enter-to-submit (guards native isComposing and Safari keyCode === 229)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return;
      }
      formRef.current?.requestSubmit();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const displayInputValue = isListening ? transcript || input : input;
  const canSend = Boolean(displayInputValue.trim()) && !disabled;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Listening status indicator */}
      {isListening && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs text-primary backdrop-blur-sm animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span>Listening to your voice…</span>
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="text-[11px] font-semibold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Done
          </button>
        </div>
      )}

      {/* Floating Glassmorphic Composer Form */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="relative rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-lg shadow-black/5 dark:shadow-black/25 transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15"
      >
        <label htmlFor={inputId} className="sr-only">
          Ask Taskloom
        </label>
        <textarea
          id={inputId}
          ref={textareaRef}
          value={displayInputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? "Listening... speaking will transcribe here..."
              : "Ask Taskloom anything about your tasks, schedule, or productivity..."
          }
          disabled={disabled}
          rows={1}
          className="assistant-textarea-autosize assistant-scroller resize-none bg-transparent px-4 pt-3.5 pb-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 outline-none leading-relaxed overflow-y-auto"
        />

        {/* Composer Controls Bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            {/* Speech Recognition Toggle */}
            {isRecSupported && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleListen}
                    disabled={disabled}
                    aria-label={isListening ? "Stop voice input" : "Voice input"}
                    className={cn(
                      "size-8 rounded-xl transition-colors",
                      isListening
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70",
                    )}
                  >
                    {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-[11px]">{isListening ? "Stop listening" : "Voice input"}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Voice Settings Dialog Trigger */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Voice settings"
                  className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70"
                >
                  <SlidersHorizontal className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-[11px]">Voice settings</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-block text-[11px] text-muted-foreground/60 select-none">
              <kbd className="font-sans">↵</kbd> send • <kbd className="font-sans">shift+↵</kbd> newline
            </span>

            {/* Explicit Submit Button */}
            <Button
              type="submit"
              disabled={!canSend}
              size="icon"
              aria-label="Send prompt"
              className={cn(
                "size-8 rounded-xl transition-all duration-200",
                canSend
                  ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-95"
                  : "bg-muted text-muted-foreground/40 cursor-not-allowed",
              )}
            >
              {disabled ? (
                <Sparkles className="size-3.5 animate-spin text-primary" />
              ) : (
                <ArrowUp className="size-4 stroke-[2.5]" />
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Voice Settings Dialog */}
      <VoiceSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        voices={voices}
        settings={voiceSettings}
        onSaveSettings={setVoiceSettings}
      />
    </div>
  );
}

export default ChatInput;
