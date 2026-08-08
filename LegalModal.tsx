import React from 'react';
import { X, ShieldCheck, Truck, FileText } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'payment' | 'delivery' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1A0507] text-[#FDF8F2] rounded-3xl overflow-hidden border border-[#D4AF37] max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-[#3D0C11] text-[#FDF8F2] p-6 border-b border-[#D4AF37]/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {type === 'payment' ? (
              <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
            ) : type === 'delivery' ? (
              <Truck className="w-6 h-6 text-[#D4AF37]" />
            ) : (
              <FileText className="w-6 h-6 text-[#D4AF37]" />
            )}
            <div>
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block">Official Brand Policy</span>
              <h3 className="font-serif text-2xl font-bold text-white">
                {type === 'payment' && 'Payment Policy & Terms'}
                {type === 'delivery' && 'Delivery & Logistics Policy'}
                {type === 'privacy' && 'Privacy Policy'}
                {type === 'terms' && 'Terms & Conditions'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/40 text-[#D4AF37] hover:bg-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-[#FDF8F2]/85 leading-relaxed font-light">
          {type === 'payment' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#2D1B1B] text-[#FDF8F2] border border-[#D4AF37]">
                <strong className="block font-serif text-base text-[#D4AF37] mb-1">STRICT PAYMENT BEFORE DELIVERY POLICY</strong>
                <p className="text-xs font-light">
                  To confirm your order and secure your event delivery slot, full payment is required prior to delivery. Munachiama | Chiama21 Hommie Foods currently does not offer credit arrangements under any circumstances.
                </p>
              </div>

              <h4 className="font-serif font-bold text-[#D4AF37] text-base">Payment Guidelines:</h4>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>All quotes issued are valid for 7 calendar days unless otherwise specified in writing.</li>
                <li>Orders are officially booked and scheduled into our culinary production calendar only upon receipt of 100% payment or explicit corporate purchase order agreements approved by management.</li>
                <li>Accepted payment methods include Official Bank Transfers, Paystack/Flutterwave secure online portals, or corporate cheques verified before event dispatch.</li>
                <li>Cancellations made more than 72 hours prior to scheduled delivery are eligible for a partial refund or date rebooking, subject to raw material preparation costs incurred.</li>
              </ul>
            </div>
          )}

          {type === 'delivery' && (
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-[#D4AF37] text-base">Delivery & Logistics Policy:</h4>
              <p className="text-xs">
                We take immense pride in ensuring your natural drinks remain ice-chilled, fresh juices retain cold-pressed vitality, and small chops arrive golden and hot.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>Delivery fees are calculated transparently based on destination distance and total order volume.</li>
                <li>Clients or designated event coordinators must ensure a recipient is available at the delivery location at the agreed time slot.</li>
                <li>Insulated thermal carriers and tamper-evident packaging are used for all dispatches.</li>
                <li>Interstate event dispatches require booking at least 10 days in advance for cold-chain transport setup.</li>
              </ul>
            </div>
          )}

          {type === 'privacy' && (
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-[#D4AF37] text-base">Customer Privacy Protection:</h4>
              <p className="text-xs">
                Munachiama | Chiama21 Hommie Foods respects customer confidentiality. Your personal information (name, phone number, email, event details) is used strictly for fulfilling your orders, sending quote notifications, and providing customer support.
              </p>
              <p className="text-xs">
                We never sell, lease, or share customer contact details with third-party marketing brokers.
              </p>
            </div>
          )}

          {type === 'terms' && (
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-[#D4AF37] text-base">General Service Terms:</h4>
              <p className="text-xs">
                By submitting an order or quote request through this portal, you agree to provide accurate event information and adhere to our payment before delivery policy.
              </p>
              <p className="text-xs">
                Custom branding and bottle labeling services require client approval of artwork proofs at least 5 business days prior to event dispatch.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#1A0507] p-4 border-t border-[#D4AF37]/20 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] text-xs font-bold uppercase tracking-wider"
          >
            I Understand & Close
          </button>
        </div>

      </div>
    </div>
  );
};
