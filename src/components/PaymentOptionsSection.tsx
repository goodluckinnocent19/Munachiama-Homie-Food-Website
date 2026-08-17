import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Sparkles, HelpCircle, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { CustomerPaymentTracker } from './CustomerPaymentTracker';

interface PaymentOptionsSectionProps {
  onOpenEnquiry?: (category?: string) => void;
}

export const PaymentOptionsSection: React.FC<PaymentOptionsSectionProps> = ({ onOpenEnquiry }) => {
  const [showTracker, setShowTracker] = useState(false);

  return (
    <section id="payment-options" className="py-20 bg-gradient-to-b from-[#120305] via-[#1A0507] to-[#120305] text-[#FDF8F2] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" /> Official Payment Arrangements
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#FDF8F2]">
            Transparent Payment Policy
          </h2>
          <p className="text-sm sm:text-base text-[#FDF8F2]/70 leading-relaxed">
            We prioritize secure transactions, clear payment terms, and backend-verified confirmations for every catering order.
          </p>
        </div>

        {/* Two Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Option 1: Standard Payment */}
          <div className="bg-[#180608] border border-[#D4AF37]/20 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all shadow-xl group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-[#120305] transition-all">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
                  Standard Orders
                </span>
              </div>

              <h3 className="text-2xl font-serif text-[#FDF8F2]">Standard Payment Arrangement</h3>

              <div className="p-4 bg-[#120305] rounded-2xl border border-[#D4AF37]/20 space-y-2">
                <p className="text-sm text-[#FDF8F2]/90 leading-relaxed font-medium">
                  "To confirm your order and secure your delivery slot, full payment is required before delivery. We currently do not offer credit arrangements."
                </p>
              </div>

              <ul className="space-y-2 text-xs text-[#FDF8F2]/80">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Full payment required prior to delivery confirmation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Direct Bank Transfer or Instant Online Gateway</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Backend-verified receipts for peace of mind</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#D4AF37]/10 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowTracker(true)}
                className="flex-1 py-3 px-4 bg-[#D4AF37] hover:bg-[#AA7C11] text-[#120305] font-bold text-xs uppercase tracking-widest rounded-xl transition-all text-center flex items-center justify-center gap-2"
              >
                <span>Track & Submit Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Option 2: Corporate & Large Event Catering */}
          <div className="bg-gradient-to-br from-[#1E080B] to-[#140406] border border-[#D4AF37]/40 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-[#D4AF37] transition-all shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-[#D4AF37] text-[#120305] text-[10px] font-extrabold uppercase px-4 py-1.5 rounded-bl-2xl tracking-widest">
              Corporate & Events
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-all">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/20 px-3 py-1 rounded-full border border-[#D4AF37]/30">
                  Bulk Orders
                </span>
              </div>

              <h3 className="text-2xl font-serif text-[#FDF8F2]">Corporate & Event Catering Invoicing</h3>

              <div className="p-4 bg-[#120305] rounded-2xl border border-[#D4AF37]/30 space-y-2">
                <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Official Invoicing & Direct Bank Transfer</h4>
                <p className="text-sm text-[#FDF8F2]/90 leading-relaxed font-medium">
                  "For large event catering and corporate bulk orders, we provide itemized official invoices, dedicated event coordination, and official payment receipts upon full payment verification before delivery."
                </p>
              </div>

              <ul className="space-y-2 text-xs text-[#FDF8F2]/80">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Itemized corporate invoices & official branded receipts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Direct bank transfer with rapid admin verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Dedicated event manager & live station coordination</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (onOpenEnquiry) onOpenEnquiry('Corporate & Event Catering');
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] hover:brightness-110 text-[#120305] font-bold text-xs uppercase tracking-widest rounded-xl transition-all text-center flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Request Corporate Event Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bank Details Banner */}
        <div className="bg-[#180608] border border-[#D4AF37]/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#FDF8F2] uppercase tracking-wide">Official Direct Bank Account Details</h4>
              <p className="text-xs text-[#FDF8F2]/70">Account Name: <span className="text-[#D4AF37] font-semibold">Ama Chioma Gloria</span> | Bank: <span className="text-[#D4AF37] font-semibold">Access Bank</span> | Account Number: <span className="text-[#D4AF37] font-mono font-bold">0093177004</span></p>
            </div>
          </div>

          <button
            onClick={() => setShowTracker(true)}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shrink-0"
          >
            Track Payment Status
          </button>
        </div>
      </div>

      {/* Tracker Modal */}
      {showTracker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center">
          <div className="w-full max-w-5xl my-8">
            <CustomerPaymentTracker onClose={() => setShowTracker(false)} />
          </div>
        </div>
      )}
    </section>
  );
};
