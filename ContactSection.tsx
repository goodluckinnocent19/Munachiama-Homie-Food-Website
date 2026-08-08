import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle2, ShieldCheck, Sparkles, UserPlus, ExternalLink } from 'lucide-react';
import { buildWhatsAppLink, submitEnquiry } from '../services/api';
import { downloadVCard } from '../lib/contacts';
import { BusinessSettings } from '../types';
import { SocialIcons } from './SocialIcons';

interface ContactSectionProps {
  settings?: BusinessSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const businessName = settings?.businessName || 'Munachiama | Chiama21 Hommie Foods';
  const displayPhone = settings?.phone || '+234 806 512 4134';
  const displayWhatsapp = settings?.whatsapp || '+234 806 512 4134';
  const displayEmail = settings?.email || 'chiama21hommiefoods@gmail.com';
  const displayAddress = settings?.address || 'Ada-George Road, Mgbuoba, Port Harcourt, Rivers, Nigeria';

  const cleanPhone = displayPhone.replace(/[^0-9+]/g, '');
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;

    setLoading(true);
    try {
      await submitEnquiry({
        customer_name: name,
        phone,
        email,
        whatsapp: phone,
        event_type: 'other',
        product_category: 'General Contact',
        location: 'Contact Form Message',
        quantity: 'N/A',
        budget: 'N/A',
        message,
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-[#3D0C11] relative text-[#FDF8F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Connect With Us</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#FDF8F2] tracking-tight">
            Ready to Make Your Occasion <span className="text-[#D4AF37] italic font-serif">Special?</span>
          </h2>
          <p className="text-base text-[#FDF8F2]/75 mt-3 leading-relaxed font-light">
            Let’s discuss your drinks, small chops, parfaits, or event catering plans. Our team is at your service.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Contact Details & Policy */}
          <div className="lg:col-span-5 space-y-8">
            
            <div className="bg-[#2D1B1B] rounded-3xl p-8 border border-[#D4AF37]/30 space-y-6 shadow-xl">
              <h3 className="font-serif text-2xl font-bold text-[#FDF8F2]">
                {businessName}
              </h3>

              <div className="space-y-4 text-sm text-[#FDF8F2]/85">
                
                {/* Phone */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#1A0507] text-[#D4AF37] border border-[#D4AF37]/30 shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase text-[#D4AF37]">Official Phone Line</span>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="text-base font-semibold text-[#FDF8F2] hover:text-[#D4AF37] transition-colors"
                    >
                      {displayPhone}
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 shrink-0 mt-0.5">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase text-[#25D366]">WhatsApp Direct Chat</span>
                    <a
                      href={buildWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-[#25D366] hover:underline block"
                    >
                      Click to Chat on WhatsApp ({displayWhatsapp}) &rarr;
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#1A0507] text-[#D4AF37] border border-[#D4AF37]/30 shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase text-[#D4AF37]">Official Email Address</span>
                    <a 
                      href={`mailto:${displayEmail}`}
                      className="text-sm font-semibold text-[#FDF8F2] hover:text-[#D4AF37] transition-colors break-all"
                    >
                      {displayEmail}
                    </a>
                  </div>
                </div>

                {/* Location / Address */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#1A0507] text-[#D4AF37] border border-[#D4AF37]/30 shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase text-[#D4AF37]">Business Location</span>
                    <p className="text-sm font-medium text-[#FDF8F2] leading-snug mb-1">
                      {displayAddress}
                    </p>
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#D4AF37] hover:underline"
                    >
                      <span>Get Directions on Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#1A0507] text-[#D4AF37] border border-[#D4AF37]/30 shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase text-[#D4AF37]">Operating Hours</span>
                    <span className="text-sm text-[#FDF8F2]">Monday – Saturday: 8:00 AM – 7:00 PM</span>
                    <span className="block text-xs text-[#FDF8F2]/60 mt-0.5">Event Deliveries scheduled 24/7 as booked</span>
                  </div>
                </div>

                {/* Social Media Section */}
                <div className="pt-4 border-t border-[#D4AF37]/20">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2">Follow Us On Social Media</span>
                  <SocialIcons settings={settings} size="md" showHandle={true} />
                </div>

                {/* Download VCard Button */}
                <div className="pt-3 border-t border-[#D4AF37]/20">
                  <button
                    type="button"
                    onClick={downloadVCard}
                    className="w-full py-3 bg-[#1A0507] hover:bg-[#2D1B1B] text-[#D4AF37] font-bold text-xs uppercase tracking-widest border border-[#D4AF37]/50 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                    <span>Save Contact Card ({displayPhone})</span>
                  </button>
                </div>

              </div>

            </div>

            {/* Payment Policy Reminder Banner */}
            <div className="bg-[#1A0507] text-[#FDF8F2] rounded-3xl p-6 border border-[#D4AF37] shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Strict Payment Policy Notice</span>
              </div>
              <p className="text-xs text-[#FDF8F2]/80 leading-relaxed font-light">
                To confirm your order and secure your delivery slot, full payment is required prior to delivery. We currently do not offer credit arrangements.
              </p>
            </div>

          </div>

          {/* Right Direct Form */}
          <div className="lg:col-span-7 bg-[#2D1B1B] rounded-3xl p-8 border border-[#D4AF37]/30 shadow-xl">
            <h3 className="font-serif text-2xl font-bold text-[#FDF8F2] mb-2">
              Send a Direct Message
            </h3>
            <p className="text-xs text-[#FDF8F2]/70 mb-6 font-light">
              Have a quick question or request? Fill the form below and our team will get back to you promptly.
            </p>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-[#1A0507] border border-[#25D366] text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-[#25D366] mx-auto" />
                <h4 className="font-serif text-2xl font-bold text-[#FDF8F2]">Message Sent Successfully!</h4>
                <p className="text-sm text-[#FDF8F2]/80 font-light">
                  Thank you for reaching out. A representative from Munachiama | Chiama21 Hommie Foods will review your message and contact you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-[#3D0C11] text-xs font-bold uppercase tracking-widest"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sandra Nnamdi"
                      className="w-full p-3.5 rounded-xl bg-[#1A0507] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
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
                      placeholder="e.g. +234 812 345 6789"
                      className="w-full p-3.5 rounded-xl bg-[#1A0507] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sandra@example.com"
                    className="w-full p-3.5 rounded-xl bg-[#1A0507] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    Your Message / Inquiry *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you need or ask any questions..."
                    className="w-full p-3.5 rounded-xl bg-[#1A0507] border border-[#D4AF37]/30 text-sm text-[#FDF8F2] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-none bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold text-xs uppercase tracking-widest border border-[#D4AF37] shadow-lg flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-[#3D0C11]" />
                    <span>{loading ? 'Sending Message...' : 'Send Message Now'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
