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
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  PhoneCall,
} from 'lucide-react';
import { sendChatMessage, buildWhatsAppLink } from '../services/api';

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

How may I serve you today? You can type a message below or tap **Live Voice** for a real-time spoken conversation!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const SUGGESTED_PROMPTS = [
  '🍹 What natural drinks do you offer?',
  '🥟 Gourmet small chops platters & prices',
  '📅 How do I book event catering in Port Harcourt?',
  '💳 Payment details & delivery rules',
];

// Converts 32-bit Float PCM to Base64 16-bit PCM for Gemini Live
function float32To16BitPCMBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  let binary = '';
  const bytes = new Uint8Array(int16Array.buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

  // Live Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<
    'idle' | 'connecting' | 'listening' | 'speaking' | 'error'
  >('idle');
  const [voiceErrorMessage, setVoiceErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  // Audio Context & WebSocket References for Voice Mode
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

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

  // Clean up voice session when modal closes or switches tab
  useEffect(() => {
    if (!isOpen || activeTab === 'text') {
      stopVoiceSession();
    }
  }, [isOpen, activeTab]);

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
      const errorMsg: ChatMessage = {
        role: 'assistant',
        text: `I apologize for the brief technical issue. Please feel free to reach out directly to our team on WhatsApp at **+234 806 512 4134** or call us for immediate assistance.`,
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

  // Playback raw 24kHz PCM from Gemini Live
  const playLiveAudioChunk = (base64Pcm: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      const ctx = outputAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const binary = atob(base64Pcm);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
      }

      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;
      setVoiceStatus('speaking');

      source.onended = () => {
        if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
          setVoiceStatus('listening');
        }
      };
    } catch (e) {
      console.error('Live Audio Playback Error:', e);
    }
  };

  // Start Gemini Live API Real-Time Voice Session
  const startVoiceSession = async () => {
    try {
      setVoiceStatus('connecting');
      setVoiceErrorMessage('');
      setLiveTranscript('');

      // Determine websocket protocol
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/live`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('[Live Voice] Connected to server WebSocket');
        setIsVoiceActive(true);
        setVoiceStatus('listening');

        // Request microphone access
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              sampleRate: 16000,
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
          mediaStreamRef.current = stream;

          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const inputCtx = new AudioCtx({ sampleRate: 16000 });
          inputAudioCtxRef.current = inputCtx;

          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          source.connect(processor);
          processor.connect(inputCtx.destination);

          processor.onaudioprocess = (e) => {
            if (isMuted || ws.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const base64PCM = float32To16BitPCMBase64(inputData);
            ws.send(JSON.stringify({ audio: base64PCM }));
          };
        } catch (micErr: any) {
          console.error('[Live Voice] Microphone access error:', micErr);
          setVoiceStatus('error');
          setVoiceErrorMessage(
            'Microphone access was denied. Please allow microphone permissions to speak with Munachiama AI.'
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            setVoiceStatus('error');
            setVoiceErrorMessage(data.error);
            return;
          }

          if (data.audio) {
            playLiveAudioChunk(data.audio);
          }

          if (data.text) {
            setLiveTranscript(data.text);
            // Append to shared text message history
            if (data.role === 'assistant') {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant' && last.text.startsWith('🎙️ Live Voice:')) {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, text: `🎙️ Live Voice: ${data.text}` },
                  ];
                } else {
                  return [
                    ...prev,
                    {
                      role: 'assistant',
                      text: `🎙️ Live Voice: ${data.text}`,
                      timestamp: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                    },
                  ];
                }
              });
            }
          }

          if (data.interrupted) {
            nextStartTimeRef.current = 0;
            setVoiceStatus('listening');
          }
        } catch (e) {
          console.error('[Live Voice] Error handling message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('[Live Voice] WebSocket error:', err);
        setVoiceStatus('error');
        setVoiceErrorMessage('Voice server connection failed. Please try again.');
      };

      ws.onclose = () => {
        console.log('[Live Voice] WebSocket closed');
        setIsVoiceActive(false);
        if (voiceStatus !== 'error') {
          setVoiceStatus('idle');
        }
      };
    } catch (err: any) {
      console.error('[Live Voice] Setup failed:', err);
      setVoiceStatus('error');
      setVoiceErrorMessage('Could not initiate voice session: ' + err.message);
    }
  };

  // Stop Live Voice Session
  const stopVoiceSession = () => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {}
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (e) {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch (e) {}
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }

    setIsVoiceActive(false);
    setVoiceStatus('idle');
    nextStartTimeRef.current = 0;
  };

  // Safe formatting helper for text bold/linebreaks
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
            <div className="text-[11px] text-[#E8DCC4]/80">Ask Menu, Catering & Live Voice</div>
          </div>
          <span className="sm:hidden text-xs font-medium text-[#D4AF37]">Ask AI</span>
        </button>
      )}

      {/* Floating Chat Modal / Drawer Window */}
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
                    <span>Gemini Live API • Online</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 rounded-lg text-[#E8DCC4]/70 hover:text-[#D4AF37] hover:bg-white/5 transition-colors"
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

            {/* Navigation Tabs: Text Chat vs Real-time Voice */}
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
                <span>🎙️ Live Voice API</span>
              </button>
            </div>
          </div>

          {/* TAB 1: TEXT CHAT */}
          {activeTab === 'text' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages Area */}
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

                {/* Loading Indicator */}
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

              {/* Prompt Suggestions */}
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

              {/* Direct WhatsApp CTA */}
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

              {/* Input Footer */}
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

          {/* TAB 2: REAL-TIME VOICE API */}
          {activeTab === 'voice' && (
            <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-[#1A0507] via-[#2A0B10] to-[#0F0304] text-center">
              {/* Voice Visualizer Header */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full text-xs border border-[#D4AF37]/30">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Model: gemini-3.1-flash-live-preview</span>
                </div>
                <h3 className="text-lg font-bold text-[#FFF8F0]">
                  Real-time Spoken Conversation
                </h3>
                <p className="text-xs text-[#E8DCC4]/70 max-w-xs mx-auto">
                  Speak directly into your microphone to enquire about drinks, small chops, prices, and event catering in Port Harcourt.
                </p>
              </div>

              {/* Main Interactive Sphere / Pulse */}
              <div className="my-auto flex flex-col items-center justify-center gap-6">
                {!isVoiceActive ? (
                  <button
                    onClick={startVoiceSession}
                    className="group relative w-28 h-28 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#B89428] to-[#684C0B] p-1 shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] hover:scale-105 transition-all cursor-pointer flex items-center justify-center"
                    id="start-live-voice-btn"
                  >
                    <div className="w-full h-full bg-[#1A0507] rounded-full flex flex-col items-center justify-center text-[#D4AF37] gap-1 group-hover:bg-[#2D1B1B] transition-colors">
                      <Mic className="w-10 h-10 text-[#D4AF37]" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Start Call</span>
                    </div>
                  </button>
                ) : (
                  <div className="relative flex items-center justify-center">
                    {/* Animated Ripple Waves */}
                    <span className="absolute w-36 h-36 rounded-full bg-[#D4AF37]/20 animate-ping" />
                    <span className="absolute w-28 h-28 rounded-full bg-[#D4AF37]/30 animate-pulse" />

                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#73580D] p-1 shadow-[0_0_40px_rgba(212,175,55,0.5)] flex items-center justify-center">
                      <div className="w-full h-full bg-[#1A0507] rounded-full flex flex-col items-center justify-center text-[#D4AF37]">
                        {voiceStatus === 'speaking' ? (
                          <Volume2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                        ) : isMuted ? (
                          <MicOff className="w-10 h-10 text-rose-400" />
                        ) : (
                          <Mic className="w-10 h-10 text-[#D4AF37] animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Indicator */}
                <div className="space-y-1">
                  {voiceStatus === 'connecting' && (
                    <div className="text-xs text-[#D4AF37] flex items-center gap-2 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      <span>Connecting to Gemini Live API...</span>
                    </div>
                  )}

                  {voiceStatus === 'listening' && (
                    <div className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Listening... Speak now</span>
                    </div>
                  )}

                  {voiceStatus === 'speaking' && (
                    <div className="text-xs text-[#D4AF37] font-semibold flex items-center justify-center gap-1.5">
                      <Volume2 className="w-4 h-4 animate-pulse text-emerald-400" />
                      <span>Munachiama AI is speaking...</span>
                    </div>
                  )}

                  {voiceStatus === 'idle' && !isVoiceActive && (
                    <div className="text-xs text-[#E8DCC4]/60">
                      Tap button to initiate live voice connection
                    </div>
                  )}

                  {voiceStatus === 'error' && (
                    <div className="text-xs text-rose-400 max-w-xs mx-auto leading-relaxed bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
                      {voiceErrorMessage || 'Voice API connection error.'}
                    </div>
                  )}
                </div>

                {/* Live Transcript Preview */}
                {liveTranscript && (
                  <div className="bg-[#120304]/80 p-3 rounded-xl border border-[#D4AF37]/20 text-xs text-[#E8DCC4] max-w-xs text-left shadow">
                    <div className="text-[10px] text-[#D4AF37] font-bold uppercase mb-1">
                      Live AI Transcription:
                    </div>
                    <div className="line-clamp-3 italic">"{liveTranscript}"</div>
                  </div>
                )}
              </div>

              {/* Controls Footer */}
              {isVoiceActive && (
                <div className="flex items-center justify-center gap-4 bg-[#120304] p-3 rounded-2xl border border-[#D4AF37]/20 shadow-xl">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isMuted
                        ? 'bg-rose-950/80 text-rose-300 border-rose-700/50'
                        : 'bg-[#2D1B1B] text-[#E8DCC4] border-[#D4AF37]/30 hover:text-[#D4AF37]'
                    }`}
                    title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={stopVoiceSession}
                    className="bg-rose-700 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer text-xs"
                    id="end-live-voice-btn"
                  >
                    <PhoneCall className="w-4 h-4 rotate-[135deg]" />
                    <span>End Voice Call</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
