import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, ShoppingBag, MessageCircle, AlertCircle, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { submitEnquiry, buildWhatsAppLink } from '../services/api';
import { formatErrorMessage } from '../utils/formatError';
import { EventType } from '../types';

interface SmartEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialEventType?: string;
  initialProductName?: string;
}

export const SmartEnquiryModal: React.FC<SmartEnquiryModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'Complete Event Package',
  initialEventType = 'wedding',
  initialProductName = '',
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ message: string; enquiryId: string } | null>(null);

  // Form State
  const [eventType, setEventType] = useState<string>(initialEventType);
  const [category, setCategory] = useState<string>(initialCategory);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [budget, setBudget] = useState('₦100,000 - ₦300,000');
  const [notes, setNotes] = useState(initialProductName ? `Interested in ${initialProductName}` : '');

  if (!isOpen) return null;

  const handleNextStep = () => {
    setErrorMsg(null);
    if (!eventType) {
      setErrorMsg('Please select an event or order type.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form Validations
    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('Delivery Location / Event Venue is required.');
      return;
    }

    try {
      setLoading(true);
      const res = await submitEnquiry({
        customer_name: fullName,
        phone,
        email,
        whatsapp: whatsapp || phone,
        event_type: eventType as EventType,
        product_category: category,
        event_date: eventDate || 'Flexible Date',
        location,
        quantity: quantity || 'Custom Quantity',
        budget,
        message: notes,
      });

      setSuccessData({
        message: res.message,
        enquiryId: res.enquiry.id,
      });
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err, 'Submission failed. Please check your network connection.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setSuccessData(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1A0507] text-[#FDF8F2] rounded-3xl overflow-hidden border border-[#D4AF37] max-w-2xl w-full shadow-2xl relative max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#3D0C11] text-[#FDF8F2] p-6 border-b border-[#D4AF37]/30 flex items-center justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Order & Quote System</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-white">
              {successData ? 'Request Submitted!' : `Step ${step} of 2 — Request a Quote`}
            </h3>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-full bg-black/40 text-[#D4AF37] hover:bg-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Policy Alert Strip */}
        <div className="bg-[#2D1B1B] border-b border-[#D4AF37]/20 px-6 py-2.5 text-xs text-[#D4AF37] font-bold flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>Payment Policy: Full payment is required before delivery. We do not offer credit.</span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Please correct the following:</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {successData ? (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#25D366] text-[#1A0507] mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Ref ID: {successData.enquiryId}</span>
                <h4 className="font-serif text-2xl font-bold text-[#FDF8F2] mt-1">Thank You, {fullName}!</h4>
                <p className="text-sm text-[#FDF8F2]/80 max-w-md mx-auto mt-2 leading-relaxed font-light">
                  {successData.message}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-left text-xs space-y-1.5 text-[#FDF8F2]/80 max-w-md mx-auto">
                <p><strong>Order Type:</strong> {eventType.toUpperCase()}</p>
                <p><strong>Category:</strong> {category}</p>
                <p><strong>Event Date:</strong> {eventDate || 'Flexible'}</p>
                <p><strong>Location:</strong> {location}</p>
                <p className="text-[#D4AF37] font-bold pt-1 border-t border-[#D4AF37]/20">
                  Note: An official quote & payment instructions will be sent to your phone/WhatsApp.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
                <a
                  href={buildWhatsAppLink({
                    name: fullName,
                    enquiryType: `${eventType.toUpperCase()} (${category})`,
                    date: eventDate,
                    quantity,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-[#1A0507] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Details on WhatsApp</span>
                </a>

                <button
                  onClick={handleResetAndClose}
                  className="w-full py-3.5 bg-[#D4AF37] text-[#3D0C11] font-bold text-xs uppercase tracking-widest"
                >
                  Close & Done
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: What are you planning? */
            <div className="space-y-6">
              <div>
                <label className="block font-serif text-lg font-bold text-[#FDF8F2] mb-2">
                  1. What occasion or order type are you planning? *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'wedding', label: 'Wedding Reception' },
                    { id: 'corporate', label: 'Corporate Event' },
                    { id: 'birthday', label: 'Birthday Party' },
                    { id: 'private_party', label: 'Private Gathering' },
                    { id: 'gifting', label: 'Gift Hamper' },
                    { id: 'personal_order', label: 'Personal Food Order' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEventType(item.id)}
                      className={`p-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-left transition-all border ${
                        eventType === item.id
                          ? 'bg-[#D4AF37] text-[#3D0C11] border-[#D4AF37] shadow-md'
                          : 'bg-[#2D1B1B] text-[#FDF8F2]/80 border-[#D4AF37]/20 hover:border-[#D4AF37]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-serif text-lg font-bold text-[#FDF8F2] mb-2">
                  2. Select Primary Product Interest
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm font-medium text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Complete Event Package" className="bg-[#1A0507] text-[#FDF8F2]">Complete Event Package (Drinks + Small Chops + Parfait)</option>
                  <option value="natural-drinks" className="bg-[#1A0507] text-[#FDF8F2]">Natural Drinks & Zobo Brews</option>
                  <option value="fresh-juices" className="bg-[#1A0507] text-[#FDF8F2]">Cold Pressed Fruit Juices</option>
                  <option value="small-chops" className="bg-[#1A0507] text-[#FDF8F2]">Gourmet Small Chops Platters</option>
                  <option value="mocktails-cocktails" className="bg-[#1A0507] text-[#FDF8F2]">Event Mocktails & Cocktails</option>
                  <option value="parfaits" className="bg-[#1A0507] text-[#FDF8F2]">Greek Yoghurt Parfaits</option>
                  <option value="healthy-salads" className="bg-[#1A0507] text-[#FDF8F2]">Healthy Salads</option>
                  <option value="luxury-gifting" className="bg-[#1A0507] text-[#FDF8F2]">Luxury Gift Hampers</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-8 py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold text-xs uppercase tracking-widest border border-[#D4AF37] shadow-md flex items-center gap-2"
                >
                  <span>Continue to Details</span>
                  <ArrowRight className="w-4 h-4 text-[#3D0C11]" />
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Customer Info & Requirements */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Chief Dr. Mrs. Aisha Bello"
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +234 803 000 0000"
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. customer@example.com"
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    WhatsApp Line (Optional)
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Same as phone or custom WhatsApp"
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    Preferred Event / Delivery Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    Delivery Location / Event Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Victoria Island, Lagos"
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    Estimated Quantity / Guest Count
                  </label>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 150 Guests or 20 Platters"
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    Estimated Budget Range
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Under ₦100,000" className="bg-[#1A0507] text-[#FDF8F2]">Under ₦100,000</option>
                    <option value="₦100,000 - ₦300,000" className="bg-[#1A0507] text-[#FDF8F2]">₦100,000 - ₦300,000</option>
                    <option value="₦300,000 - ₦750,000" className="bg-[#1A0507] text-[#FDF8F2]">₦300,000 - ₦750,000</option>
                    <option value="₦750,000 - ₦2,000,000" className="bg-[#1A0507] text-[#FDF8F2]">₦750,000 - ₦2,000,000</option>
                    <option value="Above ₦2,000,000" className="bg-[#1A0507] text-[#FDF8F2]">Above ₦2,000,000 (VIP Bulk)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                  Special Requirements / Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mention any custom flavor preferences, allergy notes, or custom branding requests..."
                  className="w-full p-3 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-3 border-t border-[#D4AF37]/20 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold text-xs uppercase tracking-widest border border-[#D4AF37] shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-[#3D0C11]" />
                  <span>{loading ? 'Submitting Request...' : 'Submit Quote Request'}</span>
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
