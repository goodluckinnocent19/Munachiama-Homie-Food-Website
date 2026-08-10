import React, { useState, useEffect } from 'react';
import { trackOrderAndPayment, submitBankTransfer } from '../services/api';
import { formatErrorMessage } from '../utils/formatError';
import { Order, Enquiry, PaymentPlan, Installment, PaymentSubmission, CustomerNotification } from '../types';
import {
  Search,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ShieldCheck,
  Send,
  Calendar,
  DollarSign,
  ChevronRight,
  Sparkles,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';

interface CustomerPaymentTrackerProps {
  initialOrderId?: string;
  onClose?: () => void;
}

export const CustomerPaymentTracker: React.FC<CustomerPaymentTrackerProps> = ({ initialOrderId = 'ord-5002', onClose }) => {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [activeOrderId, setActiveOrderId] = useState(initialOrderId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracking Data
  const [orderData, setOrderData] = useState<Order | Enquiry | null>(null);
  const [plan, setPlan] = useState<PaymentPlan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Submit Payment Form State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [amountSubmitted, setAmountSubmitted] = useState<number | ''>('');
  const [bankName, setBankName] = useState('Access Bank');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ headline: string; message: string } | null>(null);

  useEffect(() => {
    if (activeOrderId) {
      loadTrackingData(activeOrderId);
    }
  }, [activeOrderId]);

  const loadTrackingData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await trackOrderAndPayment(id);
      setOrderData(res.order);
      setPlan(res.payment_plan);
      setInstallments(res.installments);
      setSubmissions(res.payment_submissions);
      setNotifications(res.notifications);
      setSummary(res.summary);
    } catch (err: any) {
      setError(formatErrorMessage(err, 'Order record not found. Please check your Order or Enquiry ID.'));
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      setActiveOrderId(orderIdInput.trim());
      setSubmitResult(null);
    }
  };

  const openSubmitFormForInstallment = (inst?: Installment) => {
    if (inst) {
      setSelectedInstallment(inst);
      setAmountSubmitted(inst.amount);
    } else {
      setSelectedInstallment(null);
      setAmountSubmitted(summary?.outstanding_balance || '');
    }
    setPaymentRef('');
    setPaymentNotes('');
    setSubmitResult(null);
    setShowSubmitModal(true);
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRef.trim() || !amountSubmitted || Number(amountSubmitted) <= 0) {
      alert('Please enter a valid transaction reference and amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitBankTransfer({
        order_id: activeOrderId,
        installment_id: selectedInstallment?.id,
        payment_plan_id: plan?.id,
        customer_name: orderData?.customer_name,
        customer_phone: 'phone' in orderData! ? orderData.phone : orderData?.customer_phone,
        amount_submitted: Number(amountSubmitted),
        payment_reference: paymentRef.trim(),
        bank_name: bankName,
        payment_date: paymentDate,
        notes: paymentNotes,
      });

      setSubmitResult({
        headline: res.headline,
        message: res.message,
      });
      setShowSubmitModal(false);
      // Reload updated tracking data
      await loadTrackingData(activeOrderId);
    } catch (err: any) {
      alert(formatErrorMessage(err, 'Failed to submit payment proof.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getOrderStatusBadge = (status?: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3.5 h-3.5" /> Order Confirmed</span>;
      case 'Payment Verification':
      case 'Awaiting Payment':
      case 'Quote Sent':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30"><Clock className="w-3.5 h-3.5" /> Awaiting Verification / Payment</span>;
      case 'Preparing':
      case 'Out for Delivery':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30"><Sparkles className="w-3.5 h-3.5" /> In Preparation / Delivery</span>;
      case 'Cancelled':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30"><XCircle className="w-3.5 h-3.5" /> Order Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-500/20 text-zinc-300 border border-zinc-500/30">{status || 'New'}</span>;
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case 'Paid':
      case 'Verified':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"><ShieldCheck className="w-3.5 h-3.5" /> Verified / Paid</span>;
      case 'Under Review':
      case 'Payment Submitted':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"><Clock className="w-3.5 h-3.5" /> Payment Submitted — Under Review</span>;
      case 'Partially Paid':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"><DollarSign className="w-3.5 h-3.5" /> Partially Paid</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40"><XCircle className="w-3.5 h-3.5" /> Payment Rejected</span>;
      case 'Overdue':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40"><AlertTriangle className="w-3.5 h-3.5" /> Installment Overdue</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-500/20 text-zinc-300 border border-zinc-500/40"><Clock className="w-3.5 h-3.5" /> Unpaid / Pending</span>;
    }
  };

  return (
    <div className="bg-[#120305] text-[#FDF8F2] rounded-3xl border border-[#D4AF37]/30 p-6 md:p-8 shadow-2xl space-y-8 max-w-5xl mx-auto my-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D4AF37]/20">
        <div>
          <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-xs uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Order & Payment Verification Tracker</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-[#FDF8F2]">Track Order & Payment Status</h2>
          <p className="text-xs text-[#FDF8F2]/70 mt-1">
            Enter your Order ID (e.g. <code className="text-[#D4AF37]">ord-5002</code> or <code className="text-[#D4AF37]">ord-5001</code>) to check live payment verification status and installment balance.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-[#FDF8F2]/60 hover:text-[#D4AF37] transition-colors rounded-full hover:bg-white/5 self-end md:self-start"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Lookup Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
          <input
            type="text"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            placeholder="Enter Order ID (e.g., ord-5002, ord-5001, enq-1002)..."
            className="w-full pl-12 pr-4 py-3 bg-[#1A0507] border border-[#D4AF37]/40 rounded-xl text-sm focus:outline-none focus:border-[#D4AF37] text-[#FDF8F2] placeholder-[#FDF8F2]/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#120305] font-bold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-50 shrink-0"
        >
          {loading ? 'Searching...' : 'Track Status'}
        </button>
      </form>

      {/* Submission Success Notice Banner */}
      {submitResult && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex items-start gap-4 animate-fadeIn">
          <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <h4 className="font-bold text-amber-300 text-base">{submitResult.headline}</h4>
            <p className="text-[#FDF8F2]/80 leading-relaxed">{submitResult.message}</p>
            <p className="text-xs text-amber-400/90 font-medium pt-2">
              Note: System policy strictly requires administrator review before marking orders as "Paid" or "Verified".
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm font-semibold text-rose-300">{error}</p>
          <p className="text-xs text-[#FDF8F2]/60">Try searching for sample volume order: <span className="text-[#D4AF37] underline cursor-pointer" onClick={() => { setOrderIdInput('ord-5002'); setActiveOrderId('ord-5002'); }}>ord-5002</span> or standard order: <span className="text-[#D4AF37] underline cursor-pointer" onClick={() => { setOrderIdInput('ord-5001'); setActiveOrderId('ord-5001'); }}>ord-5001</span></p>
        </div>
      )}

      {/* Main Order & Payment Content */}
      {orderData && (
        <div className="space-y-8 animate-fadeIn">
          {/* Order Header Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#1A0507] p-6 rounded-2xl border border-[#D4AF37]/20">
            <div>
              <span className="block text-xs uppercase tracking-wider text-[#D4AF37] font-semibold mb-1">Customer / Organization</span>
              <p className="text-lg font-bold text-[#FDF8F2]">{orderData.customer_name}</p>
              <p className="text-xs text-[#FDF8F2]/70 mt-1">Order ID: <span className="font-mono text-[#D4AF37] font-bold">{orderData.id}</span></p>
            </div>

            <div>
              <span className="block text-xs uppercase tracking-wider text-[#D4AF37] font-semibold mb-1">Order Status</span>
              <div>{getOrderStatusBadge(orderData.status)}</div>
              <p className="text-xs text-[#FDF8F2]/60 mt-1.5">Separate from payment verification</p>
            </div>

            <div>
              <span className="block text-xs uppercase tracking-wider text-[#D4AF37] font-semibold mb-1">Payment Status</span>
              <div>{getPaymentStatusBadge(orderData.payment_status)}</div>
              <p className="text-xs text-[#FDF8F2]/60 mt-1.5">Verified by Finance Administrator</p>
            </div>
          </div>

          {/* Section 8 Requirement: Installment Payment Plan Display */}
          {plan ? (
            <div className="bg-[#180608] border border-[#D4AF37]/30 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/20">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Approved Volume Buyer Plan
                  </span>
                  <h3 className="text-xl font-serif text-[#FDF8F2]">Your Volume Payment Schedule</h3>
                  <p className="text-xs text-[#FDF8F2]/70">Approved arrangement for eligible volume buyer orders</p>
                </div>

                <button
                  onClick={() => openSubmitFormForInstallment()}
                  className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#AA7C11] text-[#120305] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Submit Payment / Transfer Proof</span>
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#120305] p-4 rounded-xl border border-[#D4AF37]/20">
                  <span className="text-xs text-[#FDF8F2]/60 block uppercase font-medium">Total Order</span>
                  <p className="text-lg font-bold text-[#FDF8F2] mt-0.5">₦{(summary?.total_amount || plan.total_amount).toLocaleString()}</p>
                </div>

                <div className="bg-[#120305] p-4 rounded-xl border border-emerald-500/20">
                  <span className="text-xs text-emerald-400 block uppercase font-medium">Amount Paid</span>
                  <p className="text-lg font-bold text-emerald-300 mt-0.5">₦{(summary?.total_verified_paid || 0).toLocaleString()}</p>
                </div>

                <div className="bg-[#120305] p-4 rounded-xl border border-amber-500/20">
                  <span className="text-xs text-amber-400 block uppercase font-medium">Outstanding Balance</span>
                  <p className="text-lg font-bold text-amber-300 mt-0.5">₦{(summary?.outstanding_balance || 0).toLocaleString()}</p>
                </div>

                <div className="bg-[#120305] p-4 rounded-xl border border-[#D4AF37]/20">
                  <span className="text-xs text-[#D4AF37] block uppercase font-medium">Payment Progress</span>
                  <p className="text-lg font-bold text-[#D4AF37] mt-0.5">{summary?.payment_progress_percent || 0}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#FDF8F2]/70">
                  <span>Verified Progress</span>
                  <span>{summary?.payment_progress_percent || 0}% Complete</span>
                </div>
                <div className="w-full bg-[#120305] h-3 rounded-full overflow-hidden border border-[#D4AF37]/20">
                  <div
                    className="bg-gradient-to-r from-[#D4AF37] to-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${summary?.payment_progress_percent || 0}%` }}
                  />
                </div>
              </div>

              {/* Installment Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Installment Schedule</h4>
                <div className="overflow-x-auto rounded-xl border border-[#D4AF37]/20">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#120305] text-[#D4AF37] text-xs uppercase font-bold border-b border-[#D4AF37]/20">
                      <tr>
                        <th className="p-3.5">Installment #</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Due Date</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4AF37]/10 bg-[#1A0507]">
                      {installments.map((inst) => (
                        <tr key={inst.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3.5 font-bold text-[#FDF8F2]">Installment #{inst.installment_number}</td>
                          <td className="p-3.5 font-semibold text-[#D4AF37]">₦{inst.amount.toLocaleString()}</td>
                          <td className="p-3.5 text-xs text-[#FDF8F2]/80">{inst.due_date}</td>
                          <td className="p-3.5">{getPaymentStatusBadge(inst.payment_status)}</td>
                          <td className="p-3.5 text-right">
                            {inst.payment_status !== 'Verified' && inst.payment_status !== 'Under Review' ? (
                              <button
                                onClick={() => openSubmitFormForInstallment(inst)}
                                className="px-3 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#120305] font-bold text-xs rounded-lg border border-[#D4AF37]/40 transition-all"
                              >
                                Submit Transfer
                              </button>
                            ) : inst.payment_status === 'Under Review' ? (
                              <span className="text-xs text-amber-400 font-medium italic">In Review</span>
                            ) : (
                              <span className="text-xs text-emerald-400 font-bold">Verified</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Payment Policy Notice */
            <div className="bg-[#180608] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-[#D4AF37] text-sm uppercase tracking-wide">Standard Order Payment Requirement</h4>
                  <p className="text-sm text-[#FDF8F2]/80 leading-relaxed">
                    To confirm your order and secure your delivery slot, full payment is required before delivery. We currently do not offer credit arrangements.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#D4AF37]/10 flex flex-wrap gap-3 items-center justify-between">
                <div className="text-xs text-[#FDF8F2]/60">
                  Total Order Value: <span className="font-bold text-[#FDF8F2]">₦{(summary?.total_amount || 0).toLocaleString()}</span>
                </div>
                <button
                  onClick={() => openSubmitFormForInstallment()}
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-[#AA7C11] text-[#120305] font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                  Submit Payment Proof
                </button>
              </div>
            </div>
          )}

          {/* Bank Transfer Details Section (Method B) */}
          <div className="bg-[#1A0507] border border-[#D4AF37]/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-[#D4AF37]">
              <Building2 className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Access Bank Official Account Details for Transfers</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#120305] p-4 rounded-xl border border-[#D4AF37]/20 font-mono text-sm">
              <div>
                <span className="block text-xs font-sans text-[#FDF8F2]/60 uppercase">Bank Name</span>
                <span className="font-bold text-[#D4AF37]">Access Bank</span>
              </div>
              <div>
                <span className="block text-xs font-sans text-[#FDF8F2]/60 uppercase">Account Name</span>
                <span className="font-bold text-[#FDF8F2]">Ama Chioma Gloria</span>
              </div>
              <div>
                <span className="block text-xs font-sans text-[#FDF8F2]/60 uppercase">Account Number</span>
                <span className="font-bold text-[#D4AF37] text-base">0093177004</span>
              </div>
            </div>

            <p className="text-xs text-[#FDF8F2]/70 italic">
              * Please include your Order ID (<span className="text-[#D4AF37] font-bold">{activeOrderId}</span>) in your bank transaction narrative/description when making transfers.
            </p>
          </div>

          {/* Submission History */}
          {submissions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Submitted Payment Proofs</h4>
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-4 bg-[#1A0507] border border-[#D4AF37]/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 font-bold text-[#FDF8F2]">
                        <span>Ref: {sub.payment_reference}</span>
                        <span>•</span>
                        <span className="text-[#D4AF37]">₦{sub.amount_submitted.toLocaleString()}</span>
                      </div>
                      <p className="text-[#FDF8F2]/60 mt-0.5">Method: {sub.payment_method} | Date: {sub.payment_date}</p>
                      {sub.rejection_reason && (
                        <p className="text-rose-400 font-semibold mt-1">Reason: {sub.rejection_reason}</p>
                      )}
                    </div>

                    <div>
                      {sub.status === 'Verified' ? (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold">Verified by Admin</span>
                      ) : sub.status === 'Rejected' ? (
                        <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-bold">Rejected</span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold">Awaiting Verification</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Proof Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120305] border border-[#D4AF37] rounded-2xl max-w-lg w-full p-6 space-y-5 relative shadow-2xl animate-fadeIn text-[#FDF8F2]">
            <div className="flex justify-between items-center pb-3 border-b border-[#D4AF37]/20">
              <div>
                <h3 className="text-lg font-serif text-[#FDF8F2]">Submit Payment Information</h3>
                <p className="text-xs text-[#FDF8F2]/70">For Order: <span className="text-[#D4AF37] font-mono font-bold">{activeOrderId}</span></p>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="text-[#FDF8F2]/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#D4AF37] font-bold uppercase mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1A0507] border border-[#D4AF37]/30 rounded-xl focus:outline-none focus:border-[#D4AF37] text-sm text-[#FDF8F2]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-bold uppercase mb-1">Amount Transferred (₦)</label>
                <input
                  type="number"
                  value={amountSubmitted}
                  onChange={(e) => setAmountSubmitted(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-[#1A0507] border border-[#D4AF37]/30 rounded-xl focus:outline-none focus:border-[#D4AF37] text-sm text-[#FDF8F2]"
                  placeholder="e.g. 400000"
                  required
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-bold uppercase mb-1">Bank Transaction Reference / ID</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. ACC-TRF-982144 or Session ID"
                  className="w-full px-3.5 py-2.5 bg-[#1A0507] border border-[#D4AF37]/30 rounded-xl focus:outline-none focus:border-[#D4AF37] text-sm text-[#FDF8F2]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-bold uppercase mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1A0507] border border-[#D4AF37]/30 rounded-xl focus:outline-none focus:border-[#D4AF37] text-sm text-[#FDF8F2]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-bold uppercase mb-1">Additional Transfer Notes (Optional)</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g., Paid from Zenith account under name Dr. Okafor..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-[#1A0507] border border-[#D4AF37]/30 rounded-xl focus:outline-none focus:border-[#D4AF37] text-sm text-[#FDF8F2]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-[#FDF8F2] font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-[#D4AF37] hover:bg-[#AA7C11] text-[#120305] font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Payment Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
