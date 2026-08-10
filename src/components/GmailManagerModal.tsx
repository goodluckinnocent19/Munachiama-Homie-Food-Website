import React, { useState, useEffect } from 'react';
import { formatErrorMessage } from '../utils/formatError';
import {
  Mail,
  Send,
  X,
  LogOut,
  RefreshCw,
  Inbox,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken, logout } from '../services/auth';
import { sendGmailMessage, listGmailMessages, getGmailProfile, GmailMessageSummary } from '../services/gmail';
import { User } from 'firebase/auth';

interface GmailManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillRecipient?: string;
  prefillSubject?: string;
  prefillBody?: string;
}

export const GmailManagerModal: React.FC<GmailManagerModalProps> = ({
  isOpen,
  onClose,
  prefillRecipient = '',
  prefillSubject = '',
  prefillBody = '',
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'compose' | 'sent'>('compose');

  // Compose State
  const [recipient, setRecipient] = useState(prefillRecipient);
  const [subject, setSubject] = useState(prefillSubject);
  const [body, setBody] = useState(prefillBody);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');

  // Messages List State
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);

  // Sync prefills if modal opens with props
  useEffect(() => {
    if (prefillRecipient) setRecipient(prefillRecipient);
    if (prefillSubject) setSubject(prefillSubject);
    if (prefillBody) setBody(prefillBody);
  }, [prefillRecipient, prefillSubject, prefillBody, isOpen]);

  // Init Auth
  useEffect(() => {
    const token = getAccessToken();
    if (token && authUser()) {
      setAccessToken(token);
    }

    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
        if (u.email) setUserEmail(u.email);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const authUser = () => user;

  // Fetch Gmail profile and sent emails when authenticated
  useEffect(() => {
    if (accessToken) {
      getGmailProfile(accessToken)
        .then((profile) => setUserEmail(profile.emailAddress))
        .catch(() => {});
      loadMessages();
    }
  }, [accessToken]);

  const handleSignIn = async () => {
    setLoadingAuth(true);
    setSendError('');
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        if (res.user.email) setUserEmail(res.user.email);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setSendError('Google Sign In failed or popup was closed.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setUserEmail('');
    setMessages([]);
  };

  const loadMessages = async () => {
    if (!accessToken) return;
    setLoadingMessages(true);
    try {
      const list = await listGmailMessages(accessToken, 'Munachiama OR Chiama21 OR catering OR order', 10);
      setMessages(list);
    } catch (err: any) {
      console.error('Load messages error:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendEmail = async () => {
    if (!accessToken) return;
    if (!recipient.trim() || !subject.trim() || !body.trim()) {
      setSendError('Please fill in Recipient Email, Subject, and Message Body.');
      return;
    }

    // MANDATORY USER CONFIRMATION DIALOG FOR DESTRUCTIVE / MUTATING OPERATION (Sending email)
    const confirmed = window.confirm(
      `Confirm sending email via your official Gmail account?\n\nTo: ${recipient}\nSubject: ${subject}`
    );
    if (!confirmed) return;

    setSending(true);
    setSendError('');
    setSendSuccess(false);

    try {
      const formattedBody = `
        <div style="font-family: Arial, sans-serif; color: #1A0507; max-width: 600px; margin: 0 auto; border: 1px solid #D4AF37; padding: 24px; border-radius: 12px; background-color: #FFF8F0;">
          <div style="border-bottom: 2px solid #D4AF37; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #4A0E17; margin: 0;">Munachiama | Chiama21 Hommie Foods</h2>
            <p style="color: #8C6D1F; font-size: 13px; margin: 4px 0 0 0;">Natural Drinks • Gourmet Small Chops • Event Catering • Luxury Hampers</p>
          </div>
          <div style="font-size: 14px; line-height: 1.6; color: #2D1B1B;">
            ${body.replace(/\n/g, '<br/>')}
          </div>
          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #E8DCC4; font-size: 12px; color: #8C6D1F;">
            <p style="margin: 0;"><strong>Physical Location:</strong> Port Harcourt, Rivers State, Nigeria</p>
            <p style="margin: 4px 0 0 0;"><strong>WhatsApp & Calls:</strong> +234 806 512 4134</p>
          </div>
        </div>
      `;

      await sendGmailMessage(accessToken, recipient, subject, formattedBody, userEmail || 'me');
      setSendSuccess(true);
      setBody('');
      loadMessages();
    } catch (err: any) {
      console.error('Gmail send error:', err);
      setSendError(formatErrorMessage(err, 'Failed to send email via Gmail API.'));
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (type: 'order' | 'quote' | 'hamper') => {
    if (type === 'order') {
      setSubject('Order Confirmation & Payment Invoice - Munachiama Foods');
      setBody(
        `Dear Valued Customer,\n\nThank you for choosing Munachiama | Chiama21 Hommie Foods!\n\nWe have received your request for our fresh cold-pressed natural drinks and gourmet small chops.\n\nBank Transfer Details:\n- Bank Name: Access Bank\n- Account Number: 0093177004\n- Account Name: Ama Chioma Gloria\n\nPlease reply with your payment receipt once completed so our team can prepare your order.\n\nWarm regards,\nManagement Team\nMunachiama Foods`
      );
    } else if (type === 'quote') {
      setSubject('Event Catering & Refreshment Bar Quotation - Port Harcourt');
      setBody(
        `Dear Client,\n\nWe are delighted to present our official catering proposal for your upcoming event.\n\nOur service includes:\n- On-site Fresh Cold-Pressed Juice & Zobo Dispensers\n- Freshly Made Gourmet Small Chops Platters (Samosas, Spring Rolls, Puff-Puff, Asun)\n- Dedicated Service Staff & Insulated Setup\n\nPlease let us know if you would like to adjust the guest count or menu selection.\n\nBest regards,\nMunachiama Foods`
      );
    } else if (type === 'hamper') {
      setSubject('VIP Celebration Gift Hamper Proposal');
      setBody(
        `Dear Client,\n\nThank you for your inquiry regarding our bespoke Luxury Gift Hampers.\n\nEach hamper is hand-crafted with premium gourmet treats, handcrafted natural beverages, custom souvenir items, and elegant branding ribbons.\n\nWe look forward to customizing this gift for your special celebration!\n\nWarm regards,\nMunachiama Foods`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1A0507] border border-[#D4AF37]/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2D1B1B] via-[#4A0E17] to-[#1A0507] p-4 border-b border-[#D4AF37]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#997A15] p-0.5 shadow-md flex items-center justify-center text-[#1A0507]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFF8F0] tracking-wide flex items-center gap-2">
                Gmail Business Integration
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded-full font-normal">
                  OAuth Verified
                </span>
              </h2>
              <p className="text-xs text-[#E8DCC4]/70">
                Send official emails, order confirmations & quotes directly via Gmail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#E8DCC4]/70 hover:text-[#FFF8F0] hover:bg-white/10 transition-colors"
            aria-label="Close Gmail modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Auth Banner */}
        <div className="bg-[#120304] px-5 py-3 border-b border-[#D4AF37]/20 flex items-center justify-between text-xs">
          {accessToken && userEmail ? (
            <div className="flex items-center gap-2.5 text-[#E8DCC4]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Connected as: <strong className="text-[#D4AF37]">{userEmail}</strong>
              </span>
            </div>
          ) : (
            <div className="text-[#E8DCC4]/70 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Sign in with Google to enable official Gmail messaging.</span>
            </div>
          )}

          {accessToken ? (
            <button
              onClick={handleSignOut}
              className="text-[#E8DCC4]/80 hover:text-rose-400 flex items-center gap-1 hover:underline transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={loadingAuth}
              className="gsi-material-button bg-white text-gray-800 font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-gray-100 flex items-center gap-2 transition-all cursor-pointer text-xs"
              id="gmail-gsi-signin-btn"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        {!accessToken ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#2D1B1B] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-xl">
              <Mail className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#FFF8F0]">Connect Google Workspace / Gmail</h3>
              <p className="text-xs text-[#E8DCC4]/70 max-w-md mx-auto leading-relaxed">
                Connect your Google Account to automatically issue order confirmations, send event catering quotes, and receive customer inquiries right inside the app.
              </p>
            </div>
            <button
              onClick={handleSignIn}
              disabled={loadingAuth}
              className="bg-gradient-to-r from-[#D4AF37] to-[#B89428] hover:from-[#E5C158] hover:to-[#CBA632] text-[#1A0507] font-bold px-6 py-3 rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2 text-sm"
              id="connect-gmail-btn"
            >
              <Mail className="w-4 h-4" />
              <span>{loadingAuth ? 'Connecting Google Account...' : 'Sign in with Google'}</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden p-5 space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-[#D4AF37]/20 text-xs">
              <button
                onClick={() => setActiveTab('compose')}
                className={`pb-2.5 px-4 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'compose'
                    ? 'border-[#D4AF37] text-[#D4AF37]'
                    : 'border-transparent text-[#E8DCC4]/60 hover:text-[#FFF8F0]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compose & Send Email</span>
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`pb-2.5 px-4 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'sent'
                    ? 'border-[#D4AF37] text-[#D4AF37]'
                    : 'border-transparent text-[#E8DCC4]/60 hover:text-[#FFF8F0]'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Recent Gmail Inquiries ({messages.length})</span>
              </button>
            </div>

            {/* TAB 1: COMPOSE */}
            {activeTab === 'compose' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {/* Quick Templates */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-[#D4AF37] font-semibold uppercase tracking-wider">
                    Quick Templates:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => applyTemplate('order')}
                      className="bg-[#2D1B1B] hover:bg-[#4A0E17] text-[#E8DCC4] hover:text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      💳 Order & Payment Details
                    </button>
                    <button
                      onClick={() => applyTemplate('quote')}
                      className="bg-[#2D1B1B] hover:bg-[#4A0E17] text-[#E8DCC4] hover:text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      📅 Catering Quotation
                    </button>
                    <button
                      onClick={() => applyTemplate('hamper')}
                      className="bg-[#2D1B1B] hover:bg-[#4A0E17] text-[#E8DCC4] hover:text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      🎁 VIP Gift Hamper Proposal
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3 bg-[#120304] p-4 rounded-xl border border-[#D4AF37]/20">
                  <div>
                    <label className="block text-[#E8DCC4] mb-1 font-medium">Recipient Email *</label>
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="e.g. client@example.com"
                      className="w-full bg-[#1A0507] text-[#FFF8F0] placeholder-[#E8DCC4]/40 px-3 py-2 rounded-lg border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#E8DCC4] mb-1 font-medium">Subject *</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Munachiama Foods - Order Confirmation"
                      className="w-full bg-[#1A0507] text-[#FFF8F0] placeholder-[#E8DCC4]/40 px-3 py-2 rounded-lg border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#E8DCC4] mb-1 font-medium">Message Body *</label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={6}
                      placeholder="Write your email body..."
                      className="w-full bg-[#1A0507] text-[#FFF8F0] placeholder-[#E8DCC4]/40 p-3 rounded-lg border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  {sendError && (
                    <div className="bg-rose-950/60 border border-rose-700/50 text-rose-300 p-2.5 rounded-lg text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{sendError}</span>
                    </div>
                  )}

                  {sendSuccess && (
                    <div className="bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 p-2.5 rounded-lg text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Email sent successfully via Gmail API!</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSendEmail}
                      disabled={sending}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#B89428] hover:from-[#E5C158] hover:to-[#CBA632] text-[#1A0507] font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 text-xs"
                      id="send-gmail-message-btn"
                    >
                      <Send className="w-4 h-4" />
                      <span>{sending ? 'Sending Email...' : 'Send Email via Gmail'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RECENT MESSAGES */}
            {activeTab === 'sent' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#E8DCC4]/70">Showing recent customer communications</span>
                  <button
                    onClick={loadMessages}
                    className="text-[#D4AF37] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingMessages ? (
                  <div className="p-8 text-center text-[#E8DCC4]/60">Loading Gmail messages...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-[#E8DCC4]/60 bg-[#120304] rounded-xl border border-[#D4AF37]/10">
                    No recent order messages found in Gmail.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(selectedMessage?.id === msg.id ? null : msg)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedMessage?.id === msg.id
                            ? 'bg-[#2D1B1B] border-[#D4AF37]'
                            : 'bg-[#120304] border-[#D4AF37]/20 hover:border-[#D4AF37]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-[#FFF8F0] mb-1">
                          <span className="text-[#D4AF37] truncate">{msg.subject}</span>
                          <span className="text-[10px] text-[#E8DCC4]/50 shrink-0 ml-2">{msg.date}</span>
                        </div>
                        <div className="text-[11px] text-[#E8DCC4]/80 flex items-center gap-2 mb-1">
                          <span>From: {msg.from}</span>
                          <span>•</span>
                          <span>To: {msg.to}</span>
                        </div>
                        <p className="text-[#E8DCC4]/60 line-clamp-2 italic">{msg.snippet}</p>

                        {selectedMessage?.id === msg.id && msg.bodyText && (
                          <div className="mt-3 pt-3 border-t border-[#D4AF37]/20 text-[#E8DCC4] whitespace-pre-wrap leading-relaxed bg-[#1A0507] p-3 rounded-lg border border-[#D4AF37]/10">
                            {msg.bodyText}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
