import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  MessageCircle,
  User,
  Loader2,
  Mic,
} from 'lucide-react';
import { sendChatMessage, buildWhatsAppLink } from '../services/api';
import { VapiVoiceAssistant } from './VapiVoiceAssistant';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const INITIAL_GREETING: ChatMessage = {
  role: 'assistant',
  text: `Hello and welcome to **Munachiama | Chiama21 Hommie Foods**! 🍷✨ 

I am **Munachiama AI**, your intelligent culinary concierge. I can assist you with:
- 🍹 Cold-pressed natural drinks, Zobo & Parfait menus
- 🥟 Gourmet small chops, finger food platters & pricing
- 📅 Event catering bookings & wedding beverage bars
- 💳 Payment options, bank transfer details & delivery policies

How may I serve you today? You can type a message below or tap **Talk to Munachiama AI** for a real-time spoken voice conversation!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const SUGGESTED_PROMPTS = [
  '🍹 What natural drinks do you offer?',
  '🥟 Gourmet small chops platters & prices',
  '📅 How do I book event catering in Port Harcourt?',
  '💳 Payment details & delivery rules',
];

export const AiChatModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');

  // Text Chat State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('chiama_ai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // Ignore fallback
    }
    return [INITIAL_GREETING];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save text conversation history
  useEffect(() => {
    try {
      localStorage.setItem('chiama_ai_chat_history', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Auto-scroll text chat
  useEffect(() => {
    if (isOpen && activeTab === 'text') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading, activeTab]);

  // Handle sending text message
  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setLoading(true);

    try {
      const historyContext = updatedMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await sendChatMessage(query, historyContext);

      const aiMsg: ChatMessage = {
        role: 'assistant',
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('[AiChatModal Text AI Chat Error]:', err);
      const errorMsg: ChatMessage = {
        role: 'assistant',
        text: `I'm sorry, I'm having a temporary issue connecting to the AI assistant. Please try again in a moment, or contact us on WhatsApp at **+234 806 512 4134**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Reset conversation memory with Munachiama AI?')) {
      setMessages([INITIAL_GREETING]);
      localStorage.removeItem('chiama_ai_chat_history');
    }
  };

  // Formatting helper for text bold/linebreaks
  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={lIdx} className={lIdx > 0 ? 'mt-1.5' : ''}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-[#D4AF37]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  const whatsappLink = buildWhatsAppLink();

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 group flex items-center gap-2.5 bg-gradient-to-r from-[#2D1B1B] via-[#4A0E17] to-[#1A0507] text-[#FFF8F0] px-4 py-3 rounded-full border border-[#D4AF37]/60 shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:border-[#D4AF37] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Ask Munachiama AI Concierge"
          id="ask-ai-floating-btn"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-[#1A0507] transition-colors">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#1A0507]" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-[#D4AF37] tracking-wider uppercase flex items-center gap-1">
              <span>Munachiama AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-[11px] text-[#E8DCC4]/80">Ask Menu, Catering & Vapi Voice</div>
          </div>
          <span className="sm:hidden text-xs font-medium text-[#D4AF37]">Ask AI</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:left-6 sm:w-[450px] h-[600px] max-h-[88vh] z-50 bg-[#1A0507] border border-[#D4AF37]/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2D1B1B] via-[#4A0E17] to-[#1A0507] px-4 py-3 border-b border-[#D4AF37]/30 flex flex-col gap-2 select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#997A15] p-0.5 shadow-md">
                  <div className="w-full h-full bg-[#1A0507] rounded-full flex items-center justify-center text-[#D4AF37]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#1A0507]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#FFF8F0] tracking-wide flex items-center gap-2">
                    Munachiama AI Concierge
                  </div>
                  <div className="text-[11px] text-[#D4AF37]/90 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Vapi Voice & Gemini Chat • Online</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 rounded-lg text-[#E8DCC4]/70 hover:text-[#D4AF37] hover:bg-white/5 transition-colors cursor-pointer"
                  title="Clear Chat History"
                  aria-label="Clear chat memory"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[#E8DCC4]/70 hover:text-[#FFF8F0] hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close Chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-[#120304] p-1 rounded-xl border border-[#D4AF37]/20 text-xs">
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'text'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89428] text-[#1A0507] font-bold shadow'
                    : 'text-[#E8DCC4]/70 hover:text-[#FFF8F0]'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Text Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('voice')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'voice'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89428] text-[#1A0507] font-bold shadow'
                    : 'text-[#E8DCC4]/70 hover:text-[#FFF8F0]'
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>🎙️ Talk to Munachiama AI</span>
              </button>
            </div>
          </div>

          {/* TAB 1: TEXT CHAT */}
          {activeTab === 'text' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#1A0507] to-[#0F0304] text-sm">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-[#2D1B1B] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`relative max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-lg ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-[#4A0E17] to-[#360A10] text-[#FFF8F0] border border-[#D4AF37]/30 rounded-tr-xs'
                          : 'bg-[#2D1B1B]/90 text-[#E8DCC4] border border-[#D4AF37]/20 rounded-tl-xs'
                      }`}
                    >
                      <div className="text-xs">{formatText(msg.text)}</div>
                      <div className="text-[10px] text-right mt-1.5 opacity-40 text-[#E8DCC4]">
                        {msg.timestamp}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-[#4A0E17] border border-[#D4AF37]/30 flex items-center justify-center text-[#E8DCC4] shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-full bg-[#2D1B1B] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="bg-[#2D1B1B]/90 text-[#D4AF37] border border-[#D4AF37]/20 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      <span>Munachiama AI is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {messages.length <= 2 && !loading && (
                <div className="px-3 py-2 bg-[#1A0507] border-t border-[#D4AF37]/15">
                  <div className="text-[10px] text-[#D4AF37]/80 uppercase tracking-wider font-semibold mb-1.5 px-1">
                    Suggested Inquiries:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSend(prompt)}
                        className="text-left text-[11px] bg-[#2D1B1B] hover:bg-[#4A0E17] text-[#E8DCC4] hover:text-[#D4AF37] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-4 py-1.5 bg-[#0F0304] border-t border-[#D4AF37]/10 flex items-center justify-between text-[11px]">
                <span className="text-[#E8DCC4]/60">Prefer human customer support?</span>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D4AF37] hover:underline flex items-center gap-1 font-medium"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-400" />
                  <span>WhatsApp Us</span>
                </a>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 bg-[#1A0507] border-t border-[#D4AF37]/30 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask Munachiama AI about menu, orders..."
                  disabled={loading}
                  className="flex-1 bg-[#2D1B1B] text-[#FFF8F0] placeholder-[#E8DCC4]/40 text-xs px-3.5 py-2.5 rounded-xl border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  id="ai-chat-input-field"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B89428] hover:from-[#E5C158] hover:to-[#CBA632] disabled:opacity-40 disabled:cursor-not-allowed text-[#1A0507] p-2.5 rounded-xl font-bold shadow-md transition-all cursor-pointer flex items-center justify-center shrink-0"
                  aria-label="Send message"
                  id="ai-chat-send-btn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: REAL-TIME VAPI VOICE ASSISTANT */}
          {activeTab === 'voice' && (
            <VapiVoiceAssistant
              className="flex-1 border-none rounded-none"
              onTranscriptMessage={(transcript) => {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    text: `🎙️ Voice AI: ${transcript}`,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ]);
              }}
            />
          )}
        </div>
      )}
    </>
  );
};
