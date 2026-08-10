import React, { useState, useRef, useEffect } from 'react';
import { formatErrorMessage } from '../utils/formatError';
import {
  Mic,
  MicOff,
  Volume2,
  Radio,
  PhoneCall,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Vapi from '@vapi-ai/web';

export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'permission_denied'
  | 'unavailable'
  | 'error';

interface VapiVoiceAssistantProps {
  onTranscriptMessage?: (text: string) => void;
  className?: string;
}

export const VapiVoiceAssistant: React.FC<VapiVoiceAssistantProps> = ({
  onTranscriptMessage,
  className = '',
}) => {
  // Read environment variables via import.meta.env
  const vapiPublicKey = (import.meta as any).env?.VITE_VAPI_PUBLIC_KEY || '';
  const vapiAssistantId = (import.meta as any).env?.VITE_VAPI_ASSISTANT_ID || '';

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  const vapiRef = useRef<Vapi | null>(null);

  // Clean up Vapi call on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Check microphone hardware & secure context support
  const checkMicrophoneSupport = (): { ok: boolean; errorState?: VoiceState; message?: string } => {
    if (typeof window === 'undefined') {
      return { ok: false, errorState: 'unavailable', message: 'Window is undefined.' };
    }

    const isSecure =
      window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!isSecure) {
      return {
        ok: false,
        errorState: 'error',
        message: 'Microphone access requires a secure HTTPS connection or localhost.',
      };
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      return {
        ok: false,
        errorState: 'unavailable',
        message: 'Your browser does not support audio recording.',
      };
    }

    return { ok: true };
  };

  const startVoiceCall = async () => {
    setErrorMessage('');
    setLiveTranscript('');

    // Check environment variables safely
    if (!vapiPublicKey) {
      setVoiceState('error');
      setErrorMessage('Voice assistant is currently unavailable. Please try again later.');
      return;
    }

    if (!vapiAssistantId) {
      setVoiceState('error');
      setErrorMessage('Voice assistant configuration is missing. Please contact administrator.');
      return;
    }

    // Check browser capability
    const supportCheck = checkMicrophoneSupport();
    if (!supportCheck.ok) {
      setVoiceState(supportCheck.errorState || 'unavailable');
      setErrorMessage(supportCheck.message || 'Microphone input is unavailable.');
      return;
    }

    // Request & test microphone access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop temporary stream tracks once permission granted
      stream.getTracks().forEach((track) => track.stop());
      setPermissionDenied(false);
    } catch (err: any) {
      console.error('[Vapi Voice] Microphone permission denied or failed:', err);
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setVoiceState('permission_denied');
        setErrorMessage(
          "Microphone access is currently blocked. Please allow microphone access in your browser's site settings and try again."
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setVoiceState('unavailable');
        setErrorMessage('No active microphone found on your device.');
      } else {
        setVoiceState('error');
        setErrorMessage(formatErrorMessage(err, 'Failed to acquire microphone access.'));
      }
      return;
    }

    // Initialize Vapi SDK instance
    setVoiceState('connecting');

    try {
      if (!vapiRef.current) {
        const vapi = new Vapi(vapiPublicKey);
        vapiRef.current = vapi;

        vapi.on('call-start', () => {
          setVoiceState('listening');
          setErrorMessage('');
        });

        vapi.on('call-end', () => {
          setVoiceState('idle');
          setIsMuted(false);
          setLiveTranscript('');
        });

        vapi.on('speech-start', () => {
          setVoiceState('speaking');
        });

        vapi.on('speech-end', () => {
          setVoiceState('listening');
        });

        vapi.on('message', (message: any) => {
          if (message?.type === 'transcript' && message?.transcript) {
            setLiveTranscript(message.transcript);
            if (message.transcriptType === 'final' && message.role === 'assistant' && onTranscriptMessage) {
              onTranscriptMessage(message.transcript);
            }
          }
        });

        vapi.on('error', (err: any) => {
          console.error('[Vapi Voice] Vapi error:', err);
          setVoiceState('error');
          const msg = formatErrorMessage(err, 'Voice connection error. Please try again.');
          setErrorMessage(msg);
        });
      }

      await vapiRef.current.start(vapiAssistantId);
    } catch (err: any) {
      console.error('[Vapi Voice] Connection start failed:', err);
      setVoiceState('error');
      setErrorMessage(formatErrorMessage(err, 'Failed to connect to Munachiama AI Voice Assistant.'));
    }
  };

  const endVoiceCall = () => {
    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
      } catch (e) {
        console.error('[Vapi Voice] Error stopping call:', e);
      }
    }
    if (!permissionDenied) {
      setVoiceState('idle');
    }
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      const nextMute = !isMuted;
      vapiRef.current.setMuted(nextMute);
      setIsMuted(nextMute);
    }
  };

  const isCallActive = voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'connecting';

  return (
    <div
      className={`flex flex-col justify-between p-5 bg-gradient-to-b from-[#1A0507] via-[#2A0B10] to-[#0F0304] text-center rounded-2xl border border-[#D4AF37]/30 ${className}`}
    >
      {/* Header Info */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full text-xs border border-[#D4AF37]/30 font-medium">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Vapi Voice Assistant • Ready</span>
        </div>
        <h3 className="text-lg font-bold text-[#FFF8F0] tracking-wide">
          Talk to Munachiama AI
        </h3>
        <p className="text-xs text-[#E8DCC4]/80 max-w-xs mx-auto leading-relaxed">
          Speak naturally with Munachiama AI Concierge to ask about cold-pressed natural drinks, gourmet small chops, event catering, and pricing.
        </p>
      </div>

      {/* Main Interactive Stage */}
      <div className="my-auto py-6 flex flex-col items-center justify-center gap-5">
        {/* Permission Denied UI */}
        {voiceState === 'permission_denied' && (
          <div className="bg-rose-950/80 border-2 border-rose-600 rounded-2xl p-4 text-left space-y-3 max-w-sm shadow-2xl">
            <div className="flex items-start gap-2.5 text-rose-300">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-200">
                  Microphone Access Blocked
                </h4>
                <p className="text-xs text-rose-100/90 leading-relaxed mt-1">
                  Microphone access is currently blocked. Please allow microphone access in your browser's site settings and try again.
                </p>
              </div>
            </div>

            <button
              onClick={startVoiceCall}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Allow Microphone & Retry</span>
            </button>
          </div>
        )}

        {/* Microphone Unavailable UI */}
        {voiceState === 'unavailable' && (
          <div className="bg-amber-950/80 border border-amber-600 rounded-2xl p-4 text-left space-y-3 max-w-sm">
            <div className="flex items-start gap-2.5 text-amber-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  Microphone Unavailable
                </h4>
                <p className="text-xs text-amber-100/90 leading-relaxed mt-1">
                  {formatErrorMessage(errorMessage, 'No active microphone found on your device.')}
                </p>
              </div>
            </div>

            <button
              onClick={startVoiceCall}
              className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Microphone Again</span>
            </button>
          </div>
        )}

        {/* Start Call Button (Idle) */}
        {voiceState === 'idle' && (
          <button
            onClick={startVoiceCall}
            className="group relative w-28 h-28 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#B89428] to-[#684C0B] p-1 shadow-[0_0_40px_rgba(212,175,55,0.35)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] hover:scale-105 transition-all cursor-pointer flex items-center justify-center"
            aria-label="Start Vapi Voice Call"
            id="vapi-start-voice-call-btn"
          >
            <div className="w-full h-full bg-[#1A0507] rounded-full flex flex-col items-center justify-center text-[#D4AF37] gap-1 group-hover:bg-[#2D1B1B] transition-colors">
              <Mic className="w-10 h-10 text-[#D4AF37]" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Start Call</span>
            </div>
          </button>
        )}

        {/* Active Call Animated Orb */}
        {isCallActive && (
          <div className="relative flex items-center justify-center">
            <span className="absolute w-36 h-36 rounded-full bg-[#D4AF37]/20 animate-ping" />
            <span className="absolute w-28 h-28 rounded-full bg-[#D4AF37]/30 animate-pulse" />

            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#73580D] p-1 shadow-[0_0_40px_rgba(212,175,55,0.5)] flex items-center justify-center">
              <div className="w-full h-full bg-[#1A0507] rounded-full flex flex-col items-center justify-center text-[#D4AF37]">
                {voiceState === 'speaking' ? (
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

        {/* Status Text & Messages */}
        <div className="space-y-1">
          {voiceState === 'connecting' && (
            <div className="text-xs text-[#D4AF37] flex items-center gap-2 justify-center font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
              <span>Connecting to Munachiama AI...</span>
            </div>
          )}

          {voiceState === 'listening' && (
            <div className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Listening... Speak naturally with Munachiama AI</span>
            </div>
          )}

          {voiceState === 'speaking' && (
            <div className="text-xs text-[#D4AF37] font-semibold flex items-center justify-center gap-1.5">
              <Volume2 className="w-4 h-4 animate-pulse text-emerald-400" />
              <span>Munachiama AI is speaking...</span>
            </div>
          )}

          {voiceState === 'idle' && (
            <div className="text-xs text-[#E8DCC4]/70">
              Tap Start Call to initiate live voice connection
            </div>
          )}

          {voiceState === 'error' && (
            <div className="text-xs text-rose-300 max-w-xs mx-auto leading-relaxed bg-rose-950/50 p-3 rounded-xl border border-rose-800/50 shadow">
              {formatErrorMessage(errorMessage, 'Voice assistant is currently unavailable. Please try again later.')}
            </div>
          )}
        </div>

        {/* Live Transcript Display */}
        {liveTranscript && (
          <div className="bg-[#120304]/90 p-3 rounded-xl border border-[#D4AF37]/20 text-xs text-[#E8DCC4] max-w-xs text-left shadow-lg">
            <div className="text-[10px] text-[#D4AF37] font-bold uppercase mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>AI Live Transcript</span>
            </div>
            <div className="line-clamp-3 italic">"{liveTranscript}"</div>
          </div>
        )}
      </div>

      {/* Active Call Toolbar */}
      {isCallActive && (
        <div className="flex items-center justify-center gap-4 bg-[#120304] p-3 rounded-2xl border border-[#D4AF37]/20 shadow-xl">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-950/80 text-rose-300 border-rose-700/50'
                : 'bg-[#2D1B1B] text-[#E8DCC4] border-[#D4AF37]/30 hover:text-[#D4AF37]'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            aria-label={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={endVoiceCall}
            className="bg-rose-700 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer text-xs"
            aria-label="End Voice Call"
            id="vapi-end-voice-call-btn"
          >
            <PhoneCall className="w-4 h-4 rotate-[135deg]" />
            <span>End Voice Call</span>
          </button>
        </div>
      )}
    </div>
  );
};
