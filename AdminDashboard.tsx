import React, { useState, useEffect } from 'react';
import {
  AdminUser,
  DashboardMetrics,
  Enquiry,
  Order,
  Product,
  Category,
  EnquiryStatus,
  PaymentStatus,
  PaymentSubmission,
  PaymentPlan,
  PaymentAuditLog,
  Installment,
  BusinessSettings,
} from '../types';
import {
  adminLogin,
  fetchAdminMetrics,
  fetchAdminEnquiries,
  updateEnquiryStatus,
  fetchAdminOrders,
  updateOrderStatus,
  fetchProducts,
  fetchCategories,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  fetchAdminPaymentSubmissions,
  verifyPaymentSubmission,
  rejectPaymentSubmission,
  fetchAdminPaymentPlans,
  createAdminPaymentPlan,
  fetchAdminPaymentAuditLogs,
  fetchBusinessSettings,
  updateBusinessSettings,
} from '../services/api';
import {
  Lock,
  LogOut,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  DollarSign,
  Package,
  Layers,
  Users,
  ShieldCheck,
  RefreshCw,
  X,
  CreditCard,
  FileCheck,
  XCircle,
  Calendar,
  History,
  Sparkles,
  Building2,
  AlertTriangle,
  Bell,
  Mail,
  Send,
  Inbox,
} from 'lucide-react';
import { listGmailMessages, sendGmailMessage, GmailMessageSummary } from '../services/gmail';
import { getAccessToken, googleSignIn } from '../services/auth';

interface AdminDashboardProps {
  token: string | null;
  setToken: (token: string | null) => void;
  onCloseAdmin: () => void;
  onSettingsUpdated?: (settings: BusinessSettings) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, setToken, onCloseAdmin, onSettingsUpdated }) => {
  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Active Tab inside Admin
  const [activeTab, setActiveTab] = useState<'metrics' | 'payments' | 'plans' | 'audit' | 'enquiries' | 'gmail_inbox' | 'orders' | 'products' | 'categories' | 'settings'>('payments');

  // Business Settings State
  const [settingsForm, setSettingsForm] = useState<BusinessSettings>({
    businessName: 'Munachiama | Chiama21 Hommie Foods',
    tagline: 'Premium drinks, catering, gifting and beautifully crafted experiences for special moments.',
    phone: '+234 806 512 4134',
    whatsapp: '+234 806 512 4134',
    email: 'chiama21hommiefoods@gmail.com',
    address: 'Ada-George Road, Mgbuoba, Port Harcourt, Rivers, Nigeria',
    socialHandle: '@Munachiama.ng',
    facebook: '',
    instagram: '',
    tiktok: '',
    snapchat: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatusMsg, setSettingsStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [auditLogs, setAuditLogs] = useState<PaymentAuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Gmail Integrated Inbox State
  const [gmailEnquiries, setGmailEnquiries] = useState<GmailMessageSummary[]>([]);
  const [loadingGmail, setLoadingGmail] = useState(false);
  const [selectedGmailEmail, setSelectedGmailEmail] = useState<GmailMessageSummary | null>(null);
  const [emailReplyBody, setEmailReplyBody] = useState('');
  const [emailReplySubject, setEmailReplySubject] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyStatusMsg, setReplyStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Product Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);

  // Modals State
  const [selectedSubmission, setSelectedSubmission] = useState<PaymentSubmission | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifiedAmtInput, setVerifiedAmtInput] = useState<number | ''>('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Create Installment Plan Modal
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [planOrderId, setPlanOrderId] = useState('');
  const [planTotalAmt, setPlanTotalAmt] = useState<number | ''>('');
  const [planPartsCount, setPlanPartsCount] = useState(2);
  const [planNotes, setPlanNotes] = useState('');

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token]);

  const loadGmailInquiries = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    setLoadingGmail(true);
    try {
      const messages = await listGmailMessages(
        accessToken,
        'order OR enquiry OR catering OR quote OR Munachiama OR Chiama21 OR food',
        15
      );
      setGmailEnquiries(messages);
    } catch (err) {
      console.error('Error fetching Gmail enquiries:', err);
    } finally {
      setLoadingGmail(false);
    }
  };

  const loadAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [m, enq, ord, prods, cats, subs, plns, logs, bSettings] = await Promise.all([
        fetchAdminMetrics(token),
        fetchAdminEnquiries(token),
        fetchAdminOrders(token),
        fetchProducts(),
        fetchCategories(),
        fetchAdminPaymentSubmissions(token),
        fetchAdminPaymentPlans(token),
        fetchAdminPaymentAuditLogs(token),
        fetchBusinessSettings(),
      ]);
      setMetrics(m);
      setEnquiries(enq);
      setOrders(ord);
      setProducts(prods);
      setCategories(cats);
      setSubmissions(subs);
      setPlans(plns);
      setAuditLogs(logs);
      if (bSettings) {
        setSettingsForm(bSettings);
        if (onSettingsUpdated) onSettingsUpdated(bSettings);
      }
      loadGmailInquiries();
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Unauthorized')) {
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingSettings(true);
    setSettingsStatusMsg(null);
    try {
      const res = await updateBusinessSettings(token, settingsForm);
      setSettingsForm(res.settings);
      setSettingsStatusMsg({ type: 'success', text: 'Business details updated and saved successfully!' });
      if (onSettingsUpdated) {
        onSettingsUpdated(res.settings);
      }
    } catch (err: any) {
      setSettingsStatusMsg({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await adminLogin({ username, password });
      setToken(res.token);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleUpdateEnquiry = async (id: string, status: EnquiryStatus, paymentStatus?: PaymentStatus) => {
    if (!token) return;
    try {
      await updateEnquiryStatus(token, id, { status, ...(paymentStatus && { payment_status: paymentStatus }) });
      loadAdminData();
    } catch (err) {
      alert('Failed to update enquiry status.');
    }
  };

  const handleUpdateOrder = async (id: string, status: EnquiryStatus, paymentStatus?: PaymentStatus) => {
    if (!token) return;
    try {
      await updateOrderStatus(token, id, { status, ...(paymentStatus && { payment_status: paymentStatus }) });
      loadAdminData();
    } catch (err) {
      alert('Failed to update order status.');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingProduct) return;
    try {
      if (editingProduct.id) {
        await updateAdminProduct(token, editingProduct.id, editingProduct);
      } else {
        await createAdminProduct(token, editingProduct);
      }
      setProductFormOpen(false);
      setEditingProduct(null);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed saving product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteAdminProduct(token, id);
      loadAdminData();
    } catch (err) {
      alert('Failed deleting product.');
    }
  };

  // Payment Verification & Plan Actions
  const handleVerifySubmission = async () => {
    if (!token || !selectedSubmission) return;
    try {
      await verifyPaymentSubmission(token, selectedSubmission.id, {
        notes: verifyNotes,
        verified_amount: verifiedAmtInput ? Number(verifiedAmtInput) : selectedSubmission.amount_submitted,
      });
      setShowVerifyModal(false);
      setSelectedSubmission(null);
      setVerifyNotes('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to verify payment');
    }
  };

  const handleRejectSubmission = async () => {
    if (!token || !selectedSubmission || !rejectReasonInput.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    try {
      await rejectPaymentSubmission(token, selectedSubmission.id, rejectReasonInput.trim());
      setShowRejectModal(false);
      setSelectedSubmission(null);
      setRejectReasonInput('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject payment');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !planOrderId || !planTotalAmt) return;

    try {
      const parts = Number(planPartsCount) || 2;
      const total = Number(planTotalAmt);
      const equalPart = Math.round(total / parts);

      const generatedInstallments = Array.from({ length: parts }).map((_, idx) => ({
        installment_number: idx + 1,
        amount: idx === parts - 1 ? total - equalPart * (parts - 1) : equalPart,
        due_date: new Date(Date.now() + 86400000 * 7 * (idx + 1)).toISOString().split('T')[0],
        notes: `Installment ${idx + 1} of ${parts}`,
      }));

      await createAdminPaymentPlan(token, {
        order_id: planOrderId,
        total_amount: total,
        number_of_installments: parts,
        installments: generatedInstallments,
        notes: planNotes,
      });

      setShowCreatePlanModal(false);
      setPlanOrderId('');
      setPlanTotalAmt('');
      setPlanNotes('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create volume installment plan');
    }
  };

  // IF NOT LOGGED IN -> LOGIN VIEW
  if (!token) {
    return (
      <div className="min-h-screen bg-[#1A0507] flex items-center justify-center p-4">
        <div className="bg-[#2D1B1B] text-[#FDF8F2] rounded-3xl p-8 border border-[#D4AF37] max-w-md w-full shadow-2xl relative space-y-6">
          <button
            onClick={onCloseAdmin}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black text-[#D4AF37]"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-[#3D0C11] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#FDF8F2]">
              Admin Security Portal
            </h3>
            <p className="text-xs text-[#FDF8F2]/70 font-light">
              Munachiama | Chiama21 Hommie Foods Management
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#1A0507] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#1A0507] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#3D0C11] text-[11px] text-[#FDF8F2]/90 font-medium border border-[#D4AF37]/30">
              ✨ <strong>Demo Credentials:</strong><br />
              Username: <code className="font-bold text-[#D4AF37]">admin</code> | Password: <code className="font-bold text-[#D4AF37]">admin123</code>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold text-xs uppercase tracking-widest shadow-md"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // LOGGED IN ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#1A0507] text-[#FDF8F2] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header & Admin Control Bar */}
        <div className="bg-[#3D0C11] text-[#FDF8F2] rounded-3xl p-6 border border-[#D4AF37] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Manager Control Center</span>
            </div>
            <h2 className="font-serif text-3xl font-extrabold text-white mt-1">
              Admin Portal Dashboard
            </h2>
            <p className="text-xs text-[#FDF8F2]/80 mt-1 font-light">
              Munachiama | Chiama21 Hommie Foods • Manage enquiries, orders, products & payments
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              className="px-4 py-2 bg-black/40 hover:bg-black text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setToken(null)}
              className="px-4 py-2 bg-red-950/80 hover:bg-red-900 text-white text-xs font-bold uppercase tracking-wider border border-red-500/30 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            <button
              onClick={onCloseAdmin}
              className="p-2 bg-black/40 text-[#D4AF37] hover:bg-black rounded-full"
              title="Close Portal View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STAFF EMAIL ENQUIRY NOTIFICATION BADGE BANNER */}
        {(() => {
          const newWebEnquiries = enquiries.filter((e) => e.status === 'New' || e.status === 'Awaiting Payment');
          const totalAlerts = newWebEnquiries.length + gmailEnquiries.length;
          const hasGmailToken = Boolean(getAccessToken());

          return (
            <div className="bg-gradient-to-r from-[#4A0E17] via-[#2D1B1B] to-[#1A0507] border-2 border-[#D4AF37] rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B89428] text-[#1A0507] flex items-center justify-center font-bold shadow-lg">
                    <Bell className="w-6 h-6 animate-bounce text-[#1A0507]" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#1A0507] animate-ping" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-[#1A0507] flex items-center justify-center text-[10px] font-black text-white shadow-md">
                    {totalAlerts}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-rose-950 text-rose-300 border border-rose-700/60 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      Staff Business Email Alert
                    </span>
                    <span className="text-xs text-[#D4AF37] font-mono font-semibold bg-[#1A0507] px-2.5 py-0.5 rounded border border-[#D4AF37]/30">
                      chiama21hommiefoods@gmail.com
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#FFF8F0] flex items-center gap-2">
                    {totalAlerts > 0 ? (
                      <>
                        <span>{totalAlerts} New Customer Enquiry Alert{totalAlerts > 1 ? 's' : ''} Received</span>
                        <span className="bg-emerald-950 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-700/50 font-normal">
                          Action Required
                        </span>
                      </>
                    ) : (
                      <span>Business Gmail Synced & Monitoring Active</span>
                    )}
                  </h3>

                  <p className="text-xs text-[#E8DCC4]/80 leading-relaxed max-w-2xl">
                    Real-time alert: {newWebEnquiries.length} pending web booking forms and {gmailEnquiries.length} recent customer emails received via integrated business email account <code className="text-[#D4AF37] font-semibold">chiama21hommiefoods@gmail.com</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={() => setActiveTab('enquiries')}
                  className="flex-1 md:flex-initial px-4 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#1A0507] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>Enquiries ({enquiries.length})</span>
                  {newWebEnquiries.length > 0 && (
                    <span className="ml-1 bg-red-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                      {newWebEnquiries.length} New
                    </span>
                  )}
                </button>

                <button
                  onClick={async () => {
                    if (!hasGmailToken) {
                      try {
                        await googleSignIn();
                        loadGmailInquiries();
                      } catch (e) {}
                    }
                    setActiveTab('gmail_inbox');
                  }}
                  className="flex-1 md:flex-initial px-4 py-2.5 bg-[#2D1B1B] hover:bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Business Gmail Inbox ({gmailEnquiries.length})</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[#D4AF37]/20 pb-2">
          {[
            { id: 'payments', label: `Payment Verification (${submissions.filter(s => s.status === 'Under Review' || s.status === 'Submitted').length} Review)`, icon: FileCheck },
            { id: 'plans', label: `Volume Installments (${plans.length})`, icon: Calendar },
            { id: 'audit', label: `Audit Log (${auditLogs.length})`, icon: History },
            { id: 'metrics', label: 'Metrics Overview', icon: TrendingUp },
            { id: 'enquiries', label: `Enquiries (${enquiries.length})`, icon: Clock, badge: enquiries.filter(e => e.status === 'New').length },
            { id: 'gmail_inbox', label: `Business Gmail (${gmailEnquiries.length})`, icon: Mail, badge: gmailEnquiries.length },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
            { id: 'settings', label: 'Business Settings', icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? 'bg-[#D4AF37] text-[#3D0C11] border border-[#D4AF37] shadow-sm'
                    : 'bg-[#2D1B1B] text-[#FDF8F2]/80 hover:bg-[#3D0C11] border border-[#D4AF37]/20'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#3D0C11]' : 'text-[#D4AF37]'}`} />
                <span>{tab.label}</span>
                {Boolean(tab.badge) && tab.badge! > 0 && (
                  <span className="ml-1 bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse shadow">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* PAYMENT VERIFICATION VIEW (Section 6 & Section 7 Requirement) */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#2D1B1B] p-4 rounded-2xl border border-[#D4AF37]/30">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#D4AF37]" />
                <input
                  type="text"
                  placeholder="Search by customer, reference, order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#1A0507] border border-[#D4AF37]/30 rounded-xl text-xs text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-[#D4AF37]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#1A0507] border border-[#D4AF37]/30 text-xs text-[#FDF8F2] rounded-xl px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="all">All Verification Statuses</option>
                  <option value="Under Review">Under Review / Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {submissions
                .filter((sub) => {
                  const matchSearch =
                    sub.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    sub.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    sub.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchStatus = statusFilter === 'all' || sub.status === statusFilter;
                  return matchSearch && matchStatus;
                })
                .map((sub) => (
                  <div
                    key={sub.id}
                    className="p-6 rounded-2xl bg-[#2D1B1B] border border-[#D4AF37]/30 shadow-md space-y-4 hover:border-[#D4AF37]/60 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#D4AF37] bg-[#3D0C11] px-2.5 py-1 rounded-md border border-[#D4AF37]/30">
                            {sub.order_id}
                          </span>
                          <span className="text-xs text-[#FDF8F2]/60">Submitted on: {new Date(sub.created_at).toLocaleString()}</span>
                        </div>
                        <h3 className="font-serif text-xl font-bold text-[#FDF8F2] mt-1">{sub.customer_name}</h3>
                        <p className="text-xs text-[#FDF8F2]/70">Phone: {sub.customer_phone}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {sub.status === 'Verified' ? (
                          <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Verified by {sub.verified_by || 'Admin'}
                          </span>
                        ) : sub.status === 'Rejected' ? (
                          <span className="px-4 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-bold text-xs flex items-center gap-1.5">
                            <XCircle className="w-4 h-4" /> Rejected
                          </span>
                        ) : (
                          <span className="px-4 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold text-xs flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> Awaiting Verification
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="p-3 bg-[#1A0507] rounded-xl border border-[#D4AF37]/10">
                        <span className="text-[#FDF8F2]/60 block">Method</span>
                        <span className="font-bold text-[#FDF8F2]">{sub.payment_method} ({sub.bank_name || 'Access Bank'})</span>
                      </div>

                      <div className="p-3 bg-[#1A0507] rounded-xl border border-[#D4AF37]/10">
                        <span className="text-[#FDF8F2]/60 block">Amount Claimed</span>
                        <span className="font-bold text-[#D4AF37] text-sm">₦{sub.amount_submitted.toLocaleString()}</span>
                      </div>

                      <div className="p-3 bg-[#1A0507] rounded-xl border border-[#D4AF37]/10">
                        <span className="text-[#FDF8F2]/60 block">Transaction Reference</span>
                        <span className="font-mono font-bold text-[#FDF8F2]">{sub.payment_reference}</span>
                      </div>

                      <div className="p-3 bg-[#1A0507] rounded-xl border border-[#D4AF37]/10">
                        <span className="text-[#FDF8F2]/60 block">Payment Date</span>
                        <span className="font-bold text-[#FDF8F2]">{sub.payment_date}</span>
                      </div>
                    </div>

                    {sub.notes && (
                      <p className="text-xs text-[#FDF8F2]/80 bg-[#1A0507] p-3 rounded-xl border border-[#D4AF37]/10">
                        <strong>Customer Notes:</strong> {sub.notes}
                      </p>
                    )}

                    {sub.rejection_reason && (
                      <p className="text-xs text-rose-300 bg-rose-950/40 p-3 rounded-xl border border-rose-500/30">
                        <strong>Rejection Reason:</strong> {sub.rejection_reason}
                      </p>
                    )}

                    {/* Action buttons for pending verification */}
                    {sub.status !== 'Verified' && (
                      <div className="pt-2 flex gap-3 justify-end">
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setRejectReasonInput('');
                            setShowRejectModal(true);
                          }}
                          className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-bold text-xs rounded-xl border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject Payment
                        </button>

                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setVerifyNotes('');
                            setVerifiedAmtInput(sub.amount_submitted);
                            setShowVerifyModal(true);
                          }}
                          className="px-5 py-2 bg-[#D4AF37] hover:bg-[#AA7C11] text-[#120305] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verify & Confirm Payment
                        </button>
                      </div>
                    )}
                  </div>
                ))}

              {submissions.length === 0 && (
                <div className="p-12 text-center text-[#FDF8F2]/60 bg-[#2D1B1B] rounded-2xl border border-[#D4AF37]/20">
                  <FileCheck className="w-10 h-10 text-[#D4AF37] mx-auto mb-2" />
                  <p>No payment submissions pending review at this time.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VOLUME INSTALLMENT PLANS VIEW */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#2D1B1B] p-4 rounded-2xl border border-[#D4AF37]/30">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#FDF8F2]">Volume Buyer Installment Arrangements</h3>
                <p className="text-xs text-[#FDF8F2]/70">Admin configured customized schedules for approved corporate/volume orders</p>
              </div>

              <button
                onClick={() => setShowCreatePlanModal(true)}
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#AA7C11] text-[#120305] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shrink-0 shadow-md"
              >
                <Plus className="w-4 h-4" /> Configure New Installment Plan
              </button>
            </div>

            <div className="space-y-6">
              {plans.map((pl) => (
                <div key={pl.id} className="p-6 bg-[#2D1B1B] rounded-2xl border border-[#D4AF37]/30 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-[#D4AF37]/20">
                    <div>
                      <span className="text-xs font-mono text-[#D4AF37] font-bold">Plan ID: {pl.id} | Order: {pl.order_id}</span>
                      <h4 className="font-serif text-xl font-bold text-[#FDF8F2]">{pl.customer_name}</h4>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-[#FDF8F2]/60 block uppercase font-medium">Total Amount</span>
                      <span className="text-xl font-bold text-[#D4AF37]">₦{pl.total_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-[#D4AF37] uppercase">Configured Installments</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pl.installments?.map((inst) => (
                        <div key={inst.id} className="p-3 bg-[#1A0507] rounded-xl border border-[#D4AF37]/20 text-xs space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-[#FDF8F2]">Installment #{inst.installment_number}</span>
                            <span className="text-[#D4AF37]">₦{inst.amount.toLocaleString()}</span>
                          </div>
                          <p className="text-[#FDF8F2]/60">Due Date: {inst.due_date}</p>
                          <div className="pt-1">
                            {inst.payment_status === 'Verified' ? (
                              <span className="text-emerald-400 font-bold text-[10px]">Verified</span>
                            ) : (
                              <span className="text-amber-400 font-bold text-[10px]">{inst.payment_status}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {plans.length === 0 && (
                <div className="p-12 text-center text-[#FDF8F2]/60 bg-[#2D1B1B] rounded-2xl border border-[#D4AF37]/20">
                  <Calendar className="w-10 h-10 text-[#D4AF37] mx-auto mb-2" />
                  <p>No custom volume payment plans configured yet. Click "Configure New Installment Plan" to assign one to a volume order.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AUDIT LOG VIEW (Section 7 Requirement) */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-[#2D1B1B] p-4 rounded-2xl border border-[#D4AF37]/30 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#FDF8F2]">Payment Audit Trail</h3>
                <p className="text-xs text-[#FDF8F2]/70">Immutable logs of all payment submissions, verifications, rejections, and plan alterations</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#D4AF37]/30 bg-[#2D1B1B]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#3D0C11] text-[#D4AF37] font-bold uppercase border-b border-[#D4AF37]/30">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Admin / Source</th>
                    <th className="p-3.5">Order ID</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/10">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 text-[#FDF8F2]/70 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-[#D4AF37]">{log.action}</td>
                      <td className="p-3.5 text-[#FDF8F2] font-medium">{log.admin_username}</td>
                      <td className="p-3.5 font-mono text-[#D4AF37]">{log.order_id}</td>
                      <td className="p-3.5 text-[#FDF8F2]/80">{log.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* METRICS OVERVIEW VIEW */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-6 rounded-3xl bg-[#2D1B1B] border border-[#D4AF37]/30 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-[#D4AF37]">Total Enquiries</span>
                  <span className="block text-3xl font-serif font-extrabold text-[#FDF8F2] mt-1">{metrics.totalEnquiries}</span>
                  <span className="text-[11px] text-[#FDF8F2]/60">{metrics.newEnquiries} New Requests</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/30">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#2D1B1B] border border-[#D4AF37]/30 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-[#25D366]">Confirmed Orders</span>
                  <span className="block text-3xl font-serif font-extrabold text-[#25D366] mt-1">{metrics.confirmedOrders}</span>
                  <span className="text-[11px] text-[#FDF8F2]/60">Payment Verified</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#2D1B1B] border border-[#D4AF37]/30 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-[#D4AF37]">Pending Orders</span>
                  <span className="block text-3xl font-serif font-extrabold text-[#FDF8F2] mt-1">{metrics.pendingOrders}</span>
                  <span className="text-[11px] text-[#FDF8F2]/60">Awaiting Payment</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/30">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#2D1B1B] border border-[#D4AF37]/30 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-[#25D366]">Verified Revenue</span>
                  <span className="block text-3xl font-serif font-extrabold text-[#25D366] mt-1">
                    ₦{metrics.totalRevenueEstimated.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[#FDF8F2]/60">Paid Orders</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366]">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* Popular Categories */}
            <div className="p-6 rounded-3xl bg-[#2D1B1B] border border-[#D4AF37]/30 space-y-4">
              <h3 className="font-serif text-xl font-bold text-[#D4AF37]">
                Most Requested Product Categories
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {metrics.popularCategories.map((cat, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#1A0507] border border-[#D4AF37]/20">
                    <span className="text-xs text-[#FDF8F2]/70 font-medium block">{cat.name}</span>
                    <span className="text-xl font-bold text-[#D4AF37]">{cat.count} Requests</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ENQUIRIES MANAGEMENT VIEW */}
        {activeTab === 'enquiries' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#2D1B1B] p-4 rounded-2xl border border-[#D4AF37]/30">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#D4AF37]" />
                <input
                  type="text"
                  placeholder="Search customer, location or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#1A0507] text-xs text-[#FDF8F2] border border-[#D4AF37]/30 focus:outline-none"
                />
              </div>

              <div className="text-xs text-[#FDF8F2]/70 font-semibold">
                Showing {enquiries.length} customer enquiries
              </div>
            </div>

            <div className="space-y-4">
              {enquiries.map((enq) => (
                <div key={enq.id} className="p-6 rounded-3xl bg-[#2D1B1B] border border-[#D4AF37]/30 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#D4AF37]/20 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-bold uppercase">
                          {enq.id}
                        </span>
                        <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold uppercase">
                          {enq.event_type}
                        </span>
                      </div>
                      <h4 className="font-serif text-xl font-bold text-[#FDF8F2] mt-1">
                        {enq.customer_name}
                      </h4>
                      <p className="text-xs text-[#FDF8F2]/70 font-light">
                        📞 {enq.phone} • ✉️ {enq.email || 'N/A'} • 📱 WA: {enq.whatsapp}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#D4AF37] uppercase">Status:</span>
                      <select
                        value={enq.status}
                        onChange={(e) => handleUpdateEnquiry(enq.id, e.target.value as EnquiryStatus)}
                        className="p-2 rounded-xl bg-[#1A0507] border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37]"
                      >
                        <option value="New" className="bg-[#1A0507] text-[#FDF8F2]">New</option>
                        <option value="Contacted" className="bg-[#1A0507] text-[#FDF8F2]">Contacted</option>
                        <option value="Quote Sent" className="bg-[#1A0507] text-[#FDF8F2]">Quote Sent</option>
                        <option value="Awaiting Payment" className="bg-[#1A0507] text-[#FDF8F2]">Awaiting Payment</option>
                        <option value="Payment Confirmed" className="bg-[#1A0507] text-[#FDF8F2]">Payment Confirmed</option>
                        <option value="Preparing" className="bg-[#1A0507] text-[#FDF8F2]">Preparing</option>
                        <option value="Completed" className="bg-[#1A0507] text-[#FDF8F2]">Completed</option>
                        <option value="Cancelled" className="bg-[#1A0507] text-[#FDF8F2]">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#1A0507] p-4 rounded-2xl border border-[#D4AF37]/20">
                    <div>
                      <span className="text-[#FDF8F2]/60 uppercase text-[10px] block">Category</span>
                      <span className="font-bold text-[#D4AF37]">{enq.product_category}</span>
                    </div>
                    <div>
                      <span className="text-[#FDF8F2]/60 uppercase text-[10px] block">Event Date</span>
                      <span className="font-bold text-[#FDF8F2]">{enq.event_date}</span>
                    </div>
                    <div>
                      <span className="text-[#FDF8F2]/60 uppercase text-[10px] block">Location</span>
                      <span className="font-bold text-[#FDF8F2]">{enq.location}</span>
                    </div>
                    <div>
                      <span className="text-[#FDF8F2]/60 uppercase text-[10px] block">Budget & Qty</span>
                      <span className="font-bold text-[#D4AF37]">{enq.budget} ({enq.quantity})</span>
                    </div>
                  </div>

                  {enq.message && (
                    <div className="text-xs text-[#FDF8F2]/80 italic bg-[#1A0507] p-3 rounded-xl border border-[#D4AF37]/20 font-light">
                      "{enq.message}"
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-[#FDF8F2]/60 pt-1">
                    <span>Submitted: {new Date(enq.created_at).toLocaleString()}</span>
                    <span className="font-semibold text-[#D4AF37]">
                      Payment Policy: Full payment before delivery required
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTEGRATED BUSINESS GMAIL INBOX VIEW */}
        {activeTab === 'gmail_inbox' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#2D1B1B] p-5 rounded-2xl border border-[#D4AF37]/30 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B89428] text-[#1A0507] flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5 text-[#1A0507]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#FFF8F0] flex items-center gap-2">
                    Integrated Business Email Account
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-sans">
                      Gmail API Active
                    </span>
                  </h3>
                  <p className="text-xs text-[#E8DCC4]/70">
                    Monitoring <code className="text-[#D4AF37]">chiama21hommiefoods@gmail.com</code> for incoming customer catering & drink enquiries
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadGmailInquiries}
                  disabled={loadingGmail}
                  className="px-4 py-2 bg-[#1A0507] hover:bg-black text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingGmail ? 'animate-spin' : ''}`} />
                  <span>Sync Inbox</span>
                </button>

                {!getAccessToken() && (
                  <button
                    onClick={async () => {
                      try {
                        await googleSignIn();
                        loadGmailInquiries();
                      } catch (e) {}
                    }}
                    className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#1A0507] font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Connect Google Account</span>
                  </button>
                )}
              </div>
            </div>

            {/* Email Inbox Content */}
            {!getAccessToken() ? (
              <div className="p-10 text-center space-y-4 bg-[#2D1B1B] rounded-3xl border border-[#D4AF37]/30">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#1A0507] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  <Mail className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-[#FFF8F0]">Connect Google Workspace / Gmail</h4>
                  <p className="text-xs text-[#E8DCC4]/70 max-w-md mx-auto">
                    Authenticate staff Google account to read incoming customer emails and send official quotations directly inside the portal.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await googleSignIn();
                      loadGmailInquiries();
                    } catch (e) {}
                  }}
                  className="px-6 py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-[#1A0507] font-bold text-xs rounded-xl shadow-lg inline-flex items-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Sign in with Google</span>
                </button>
              </div>
            ) : loadingGmail ? (
              <div className="p-12 text-center text-[#E8DCC4]/70 bg-[#2D1B1B] rounded-3xl border border-[#D4AF37]/20 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#D4AF37]" />
                <span>Syncing emails from business account...</span>
              </div>
            ) : gmailEnquiries.length === 0 ? (
              <div className="p-10 text-center text-[#E8DCC4]/70 bg-[#2D1B1B] rounded-3xl border border-[#D4AF37]/20 space-y-2">
                <Inbox className="w-10 h-10 mx-auto text-[#D4AF37]/50" />
                <p className="text-sm font-semibold text-[#FFF8F0]">No recent customer enquiries found in Gmail inbox.</p>
                <p className="text-xs">Click "Sync Inbox" to re-check for incoming messages.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Messages List Column */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider flex items-center justify-between">
                    <span>Recent Customer Email Alerts ({gmailEnquiries.length})</span>
                    <span className="text-[10px] text-[#E8DCC4]/50">Click message to reply</span>
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {gmailEnquiries.map((msg) => {
                      const isSelected = selectedGmailEmail?.id === msg.id;
                      return (
                        <div
                          key={msg.id}
                          onClick={() => {
                            setSelectedGmailEmail(msg);
                            setEmailReplySubject(msg.subject?.startsWith('Re:') ? msg.subject : `Re: ${msg.subject || 'Enquiry'}`);
                            setReplyStatusMsg(null);
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                            isSelected
                              ? 'bg-[#3D0C11] border-[#D4AF37] shadow-lg'
                              : 'bg-[#2D1B1B] border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#D4AF37] truncate">{msg.from || 'Customer'}</span>
                            <span className="text-[10px] text-[#E8DCC4]/50 shrink-0 ml-2">{msg.date}</span>
                          </div>
                          <h5 className="text-xs font-bold text-[#FFF8F0] line-clamp-1">{msg.subject || '(No Subject)'}</h5>
                          <p className="text-[11px] text-[#E8DCC4]/70 line-clamp-2 italic">{msg.snippet}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Email Viewer & Composer Column */}
                <div className="lg:col-span-7">
                  {selectedGmailEmail ? (
                    <div className="bg-[#2D1B1B] border border-[#D4AF37]/30 rounded-3xl p-6 space-y-5 shadow-xl">
                      {/* Email Header */}
                      <div className="border-b border-[#D4AF37]/20 pb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#D4AF37] font-semibold">Incoming Business Email</span>
                          <span className="text-xs text-[#E8DCC4]/50">{selectedGmailEmail.date}</span>
                        </div>
                        <h4 className="text-lg font-bold text-[#FFF8F0]">{selectedGmailEmail.subject}</h4>
                        <div className="text-xs text-[#E8DCC4] flex items-center gap-2">
                          <span className="font-semibold">From:</span>
                          <code className="bg-[#1A0507] px-2 py-0.5 rounded text-[#D4AF37] border border-[#D4AF37]/20">
                            {selectedGmailEmail.from}
                          </code>
                        </div>
                      </div>

                      {/* Email Snippet / Content */}
                      <div className="bg-[#1A0507] p-4 rounded-2xl border border-[#D4AF37]/20 text-xs text-[#E8DCC4] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {selectedGmailEmail.bodyText || selectedGmailEmail.snippet || 'No body text content.'}
                      </div>

                      {/* Reply Form */}
                      <div className="bg-[#120304] p-5 rounded-2xl border border-[#D4AF37]/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5" />
                            Send Official Reply via Gmail
                          </h5>
                          <span className="text-[10px] text-[#E8DCC4]/60">Sends from official business account</span>
                        </div>

                        {/* Quick Templates */}
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() =>
                              setEmailReplyBody(
                                `Dear Valued Customer,\n\nThank you for reaching out to Munachiama | Chiama21 Hommie Foods regarding your enquiry!\n\nWe have received your message and are pleased to offer our fresh natural drinks & gourmet catering packages in Port Harcourt.\n\nBank Account Details for Payment / Booking Deposit:\n- Bank Name: Access Bank\n- Account Number: 0093177004\n- Account Name: Ama Chioma Gloria\n\nPlease let us know if you have specific menu preferences or guest count updates!\n\nWarm regards,\nManagement Team\nMunachiama Foods (+234 806 512 4134)`
                              )
                            }
                            className="bg-[#2D1B1B] hover:bg-[#3D0C11] text-[#E8DCC4] border border-[#D4AF37]/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            💳 Send Bank & Order Details
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEmailReplyBody(
                                `Dear Client,\n\nThank you for considering Munachiama Foods for your event catering!\n\nWe would be delighted to provide custom small chop platters and fresh cold-pressed juice bars for your guests.\n\nPlease share the event date, location in Port Harcourt, and estimated number of guests so we can prepare an official itemized quotation.\n\nWarm regards,\nMunachiama Foods`
                              )
                            }
                            className="bg-[#2D1B1B] hover:bg-[#3D0C11] text-[#E8DCC4] border border-[#D4AF37]/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            📅 Request Event Details
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#E8DCC4] mb-1 font-semibold">Subject</label>
                          <input
                            type="text"
                            value={emailReplySubject}
                            onChange={(e) => setEmailReplySubject(e.target.value)}
                            className="w-full bg-[#1A0507] text-[#FFF8F0] px-3 py-2 rounded-xl border border-[#D4AF37]/30 text-xs focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#E8DCC4] mb-1 font-semibold">Reply Message Body *</label>
                          <textarea
                            rows={5}
                            value={emailReplyBody}
                            onChange={(e) => setEmailReplyBody(e.target.value)}
                            placeholder="Type your official reply to this enquiry..."
                            className="w-full bg-[#1A0507] text-[#FFF8F0] p-3 rounded-xl border border-[#D4AF37]/30 text-xs focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        {replyStatusMsg && (
                          <div
                            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                              replyStatusMsg.type === 'success'
                                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                                : 'bg-rose-950/80 border-rose-700 text-rose-300'
                            }`}
                          >
                            {replyStatusMsg.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <span>{replyStatusMsg.text}</span>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={sendingReply || !emailReplyBody.trim()}
                            onClick={async () => {
                              const token = getAccessToken();
                              if (!token || !selectedGmailEmail?.from) return;

                              // Extract email from "Name <email@domain.com>" format
                              let targetRecipient = selectedGmailEmail.from;
                              const match = selectedGmailEmail.from.match(/<([^>]+)>/);
                              if (match && match[1]) {
                                targetRecipient = match[1];
                              }

                              const confirmed = window.confirm(
                                `Confirm sending official reply via Gmail?\n\nTo: ${targetRecipient}\nSubject: ${emailReplySubject}`
                              );
                              if (!confirmed) return;

                              setSendingReply(true);
                              setReplyStatusMsg(null);
                              try {
                                const htmlBody = `
                                  <div style="font-family: Arial, sans-serif; color: #1A0507; max-width: 600px; margin: 0 auto; border: 1px solid #D4AF37; padding: 24px; border-radius: 12px; background-color: #FFF8F0;">
                                    <div style="border-bottom: 2px solid #D4AF37; padding-bottom: 12px; margin-bottom: 16px;">
                                      <h2 style="color: #4A0E17; margin: 0;">Munachiama | Chiama21 Hommie Foods</h2>
                                      <p style="color: #8C6D1F; font-size: 13px; margin: 4px 0 0 0;">Natural Drinks • Gourmet Small Chops • Event Catering</p>
                                    </div>
                                    <div style="font-size: 14px; line-height: 1.6; color: #2D1B1B;">
                                      ${emailReplyBody.replace(/\n/g, '<br/>')}
                                    </div>
                                    <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #E8DCC4; font-size: 12px; color: #8C6D1F;">
                                      <p style="margin: 0;"><strong>Location:</strong> Port Harcourt, Rivers State, Nigeria</p>
                                      <p style="margin: 4px 0 0 0;"><strong>Phone & WA:</strong> +234 806 512 4134</p>
                                    </div>
                                  </div>
                                `;

                                await sendGmailMessage(token, targetRecipient, emailReplySubject, htmlBody);
                                setReplyStatusMsg({ type: 'success', text: 'Reply sent successfully via Gmail API!' });
                                setEmailReplyBody('');
                              } catch (err: any) {
                                setReplyStatusMsg({ type: 'error', text: err.message || 'Failed to send email.' });
                              } finally {
                                setSendingReply(false);
                              }
                            }}
                            className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#1A0507] font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                            <span>{sendingReply ? 'Sending Reply...' : 'Send Official Reply'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#2D1B1B] border border-[#D4AF37]/20 rounded-3xl p-10 text-center text-[#E8DCC4]/60 space-y-2">
                      <Mail className="w-10 h-10 mx-auto text-[#D4AF37]/40" />
                      <h5 className="text-sm font-bold text-[#FFF8F0]">Select an Email Enquiry</h5>
                      <p className="text-xs">Select any customer email from the list on the left to read and send a reply.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS MANAGEMENT VIEW */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#2D1B1B] p-4 rounded-2xl border border-[#D4AF37]/30">
              <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                Product Inventory Management
              </h3>
              <button
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    category: 'natural-drinks',
                    description: '',
                    price: 4000,
                    price_text: '₦4,000 / Bottle',
                    image_url: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=1000&q=80',
                    featured: true,
                    available: true,
                    ingredients: [],
                    serves_text: '',
                  });
                  setProductFormOpen(true);
                }}
                className="px-4 py-2 bg-[#D4AF37] text-[#3D0C11] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4 text-[#3D0C11]" />
                <span>Add New Product</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="p-5 rounded-3xl bg-[#2D1B1B] border border-[#D4AF37]/30 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="relative h-40 rounded-2xl overflow-hidden bg-[#1A0507]">
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2.5 py-1 bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-bold uppercase">
                        {p.category}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-serif text-lg font-bold text-[#FDF8F2]">{p.name}</h4>
                      <p className="text-xs text-[#FDF8F2]/70 line-clamp-2 mt-1 font-light">{p.description}</p>
                      <span className="block font-bold text-sm text-[#D4AF37] mt-2">{p.price_text}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#D4AF37]/20 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setProductFormOpen(true);
                      }}
                      className="px-3 py-1.5 bg-[#1A0507] border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="px-3 py-1.5 bg-red-950/80 text-red-200 border border-red-800 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES VIEW */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((c) => (
              <div key={c.id} className="p-6 rounded-3xl bg-[#2D1B1B] border border-[#D4AF37]/30 shadow-sm space-y-3">
                <div className="relative h-36 rounded-2xl overflow-hidden bg-[#1A0507]">
                  <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
                    <h4 className="font-serif text-xl font-bold text-[#FDF8F2]">{c.name}</h4>
                  </div>
                </div>
                <p className="text-xs text-[#FDF8F2]/80 font-light">{c.description}</p>
                <div className="text-xs font-bold text-[#D4AF37]">
                  {c.item_count || 0} Products in Category
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BUSINESS SETTINGS VIEW */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto bg-[#2D1B1B] rounded-3xl p-8 border border-[#D4AF37]/30 shadow-xl space-y-6">
            <div className="border-b border-[#D4AF37]/20 pb-4">
              <h3 className="font-serif text-2xl font-bold text-[#FDF8F2]">
                Official Business & Contact Settings
              </h3>
              <p className="text-xs text-[#FDF8F2]/80 mt-1 font-light">
                Update the official business contact details, phone numbers, email, physical address, and social media links. Changes are saved directly to the database and reflected live across the entire website.
              </p>
            </div>

            {settingsStatusMsg && (
              <div
                className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  settingsStatusMsg.type === 'success'
                    ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40'
                    : 'bg-red-950/80 text-red-200 border border-red-500/40'
                }`}
              >
                {settingsStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{settingsStatusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              
              {/* Primary Identity Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1A0507] p-5 rounded-2xl border border-[#D4AF37]/20">
                <div className="md:col-span-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">
                    Brand Identity
                  </h4>
                </div>
                <div>
                  <label className="block font-bold uppercase text-[#D4AF37] mb-1">
                    Official Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.businessName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, businessName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Munachiama | Chiama21 Hommie Foods"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#D4AF37] mb-1">
                    Social Media Handle
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.socialHandle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, socialHandle: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="@Munachiama.ng"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold uppercase text-[#D4AF37] mb-1">
                    Brand Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Premium drinks, catering, gifting and beautifully crafted experiences..."
                  />
                </div>
              </div>

              {/* Direct Contact Lines */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#1A0507] p-5 rounded-2xl border border-[#D4AF37]/20">
                <div className="md:col-span-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">
                    Phone, WhatsApp & Email
                  </h4>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#D4AF37] mb-1">
                    Official Phone Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="+234 806 512 4134"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#D4AF37] mb-1">
                    Official WhatsApp Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.whatsapp}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="+234 806 512 4134"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#D4AF37] mb-1">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="chiama21hommiefoods@gmail.com"
                  />
                </div>
              </div>

              {/* Physical Address */}
              <div className="bg-[#1A0507] p-5 rounded-2xl border border-[#D4AF37]/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">
                  Physical Business Address
                </h4>
                <div>
                  <label className="block font-bold uppercase text-[#D4AF37] mb-1">
                    Full Location / Street Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Ada-George Road, Mgbuoba, Port Harcourt, Rivers, Nigeria"
                  />
                </div>
              </div>

              {/* Social Media Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1A0507] p-5 rounded-2xl border border-[#D4AF37]/20">
                <div className="md:col-span-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    Social Media Profiles ({settingsForm.socialHandle})
                  </h4>
                  <p className="text-[11px] text-[#FDF8F2]/60 mb-3">
                    Paste full profile links below. Leave empty if profile is not yet active.
                  </p>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#D4AF37] mb-1">
                    Facebook Profile URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.facebook}
                    onChange={(e) => setSettingsForm({ ...settingsForm, facebook: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="https://facebook.com/Munachiama.ng"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#D4AF37] mb-1">
                    Instagram Profile URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.instagram}
                    onChange={(e) => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="https://instagram.com/Munachiama.ng"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#D4AF37] mb-1">
                    TikTok Profile URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.tiktok}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tiktok: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="https://tiktok.com/@Munachiama.ng"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#D4AF37] mb-1">
                    Snapchat Profile URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.snapchat}
                    onChange={(e) => setSettingsForm({ ...settingsForm, snapchat: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    placeholder="https://snapchat.com/add/Munachiama.ng"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-8 py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold text-xs uppercase tracking-widest border border-[#D4AF37] shadow-lg flex items-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#3D0C11]" />
                  <span>{savingSettings ? 'Saving Settings...' : 'Save & Update All Business Details'}</span>
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* Product Add / Edit Modal */}
      {productFormOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A0507] text-[#FDF8F2] rounded-3xl p-6 border border-[#D4AF37] max-w-lg w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setProductFormOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-[#D4AF37] hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-2xl font-bold text-[#FDF8F2]">
              {editingProduct.id ? 'Edit Product' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#D4AF37] mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#D4AF37] mb-1">Category</label>
                <select
                  value={editingProduct.category || 'natural-drinks'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="natural-drinks" className="bg-[#1A0507] text-[#FDF8F2]">Natural Drinks</option>
                  <option value="fresh-juices" className="bg-[#1A0507] text-[#FDF8F2]">Fresh Fruit Juices</option>
                  <option value="small-chops" className="bg-[#1A0507] text-[#FDF8F2]">Small Chops</option>
                  <option value="mocktails-cocktails" className="bg-[#1A0507] text-[#FDF8F2]">Mocktails & Cocktails</option>
                  <option value="parfaits" className="bg-[#1A0507] text-[#FDF8F2]">Parfaits</option>
                  <option value="healthy-salads" className="bg-[#1A0507] text-[#FDF8F2]">Healthy Salads</option>
                  <option value="luxury-gifting" className="bg-[#1A0507] text-[#FDF8F2]">Luxury Gifting</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#D4AF37] mb-1">Price Text</label>
                <input
                  type="text"
                  value={editingProduct.price_text || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price_text: e.target.value })}
                  placeholder="e.g. ₦35,000 / Platter"
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#D4AF37] mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingProduct.image_url || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#D4AF37] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductFormOpen(false)}
                  className="px-5 py-2.5 border border-[#D4AF37]/30 text-[#D4AF37] font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold uppercase tracking-wider border border-[#D4AF37]"
                >
                  Save Product
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* VERIFY PAYMENT MODAL */}
      {showVerifyModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A0507] text-[#FDF8F2] rounded-3xl p-6 border border-[#D4AF37] max-w-lg w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowVerifyModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-[#D4AF37] hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Official Payment Verification
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#FDF8F2]">Verify Payment & Confirm Order</h3>
              <p className="text-xs text-[#FDF8F2]/70">Confirming this payment will update order status and record an immutable audit log entry.</p>
            </div>

            <div className="p-4 bg-[#2D1B1B] rounded-2xl border border-[#D4AF37]/20 text-xs space-y-2">
              <p><strong>Customer:</strong> {selectedSubmission.customer_name}</p>
              <p><strong>Order ID:</strong> <span className="font-mono text-[#D4AF37] font-bold">{selectedSubmission.order_id}</span></p>
              <p><strong>Transaction Ref:</strong> <span className="font-mono font-bold text-[#FDF8F2]">{selectedSubmission.payment_reference}</span></p>
              <p><strong>Claimed Amount:</strong> <span className="text-[#D4AF37] font-bold">₦{selectedSubmission.amount_submitted.toLocaleString()}</span></p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#D4AF37] mb-1">Confirmed Amount Received (₦)</label>
                <input
                  type="number"
                  value={verifiedAmtInput}
                  onChange={(e) => setVerifiedAmtInput(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#D4AF37] mb-1">Verification Note / Memo (Optional)</label>
                <textarea
                  rows={2}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="e.g., Verified in Access Bank mobile portal at 10:45 AM by Finance Director..."
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-[#FDF8F2] font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifySubmission}
                className="flex-1 py-3 bg-[#D4AF37] hover:bg-[#AA7C11] text-[#120305] font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT PAYMENT MODAL */}
      {showRejectModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A0507] text-[#FDF8F2] rounded-3xl p-6 border border-rose-500 max-w-lg w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowRejectModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-[#D4AF37] hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-serif text-2xl font-bold text-rose-300">Reject Payment Proof</h3>
              <p className="text-xs text-[#FDF8F2]/70">State the clear reason why this payment submission cannot be verified.</p>
            </div>

            <div>
              <label className="block font-bold uppercase text-rose-300 text-xs mb-1">Rejection Reason *</label>
              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="e.g. Transaction reference not found in Access Bank statement. Please check account number and try again."
                className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-rose-500/40 text-xs text-[#FDF8F2] focus:outline-none focus:border-rose-400"
                required
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-[#FDF8F2] font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmission}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-wider rounded-xl text-xs transition-all"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE INSTALLMENT PLAN MODAL */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A0507] text-[#FDF8F2] rounded-3xl p-6 border border-[#D4AF37] max-w-lg w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowCreatePlanModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-[#D4AF37] hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-serif text-2xl font-bold text-[#FDF8F2]">Configure Volume Installment Plan</h3>
              <p className="text-xs text-[#FDF8F2]/70">Assign a customized payment schedule for an approved volume buyer order.</p>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#D4AF37] mb-1">Target Order / Enquiry ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., ord-5002 or enq-1002"
                  value={planOrderId}
                  onChange={(e) => setPlanOrderId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-xs text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#D4AF37] mb-1">Total Agreed Order Amount (₦)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g., 800000"
                  value={planTotalAmt}
                  onChange={(e) => setPlanTotalAmt(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-xs text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#D4AF37] mb-1">Number of Installments</label>
                <select
                  value={planPartsCount}
                  onChange={(e) => setPlanPartsCount(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-xs text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value={2}>2 Installments (50% / 50%)</option>
                  <option value={3}>3 Installments (Equal Parts)</option>
                  <option value={4}>4 Installments</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#D4AF37] mb-1">Approval Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder="e.g., Corporate volume agreement approved by Management..."
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-xs text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-[#FDF8F2] font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#D4AF37] hover:bg-[#AA7C11] text-[#120305] font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  Save & Activate Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
