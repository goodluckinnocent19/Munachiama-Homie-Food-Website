import React from 'react';
import { ShieldCheck, MessageCircle, Phone, Mail, MapPin, ArrowUp, ExternalLink } from 'lucide-react';
import { buildWhatsAppLink } from '../services/api';
import { BusinessSettings } from '../types';
import { SocialIcons } from './SocialIcons';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  onOpenEnquiryModal: () => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'payment' | 'delivery') => void;
  settings?: BusinessSettings;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onOpenEnquiryModal, onOpenLegal, settings }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const businessName = settings?.businessName || 'Munachiama | Chiama21 Hommie Foods';
  const phone = settings?.phone || '+234 806 512 4134';
  const whatsapp = settings?.whatsapp || '+234 806 512 4134';
  const email = settings?.email || 'chiama21hommiefoods@gmail.com';
  const address = settings?.address || 'Ada-George Road, Mgbuoba, Port Harcourt, Rivers, Nigeria';
  const tagline = settings?.tagline || 'Premium drinks, catering, gifting and beautifully crafted experiences for special moments.';

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const cleanPhone = phone.replace(/[^0-9+]/g, '');

  return (
    <footer className="bg-[#1A0507] text-[#FDF8F2] pt-16 pb-8 border-t-2 border-[#D4AF37] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Important Payment Policy Highlighted Box */}
        <div className="bg-[#2D1B1B] border border-[#D4AF37] rounded-2xl p-6 mb-12 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#3D0C11] rounded-xl text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[#D4AF37] font-serif text-lg font-bold">Important Payment Policy</h4>
              <p className="text-sm text-[#FDF8F2]/90 mt-1 max-w-2xl font-light">
                To confirm your order and secure your event delivery slot, full payment is required before delivery. We currently do not offer credit arrangements under any circumstances.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenLegal('payment')}
            className="text-xs uppercase tracking-widest font-bold text-[#D4AF37] hover:underline shrink-0"
          >
            Read Payment Policy &rarr;
          </button>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#3D0C11] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-serif text-xl font-bold">
                M
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#FDF8F2] leading-none">
                  Munachiama
                </h3>
                <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
                  Chiama21 Hommie Foods
                </span>
              </div>
            </div>
            <p className="text-sm text-[#FDF8F2]/70 mb-6 leading-relaxed max-w-sm font-light">
              {tagline}
            </p>
            
            {/* Social Media Handle & Icons */}
            <div className="mb-4">
              <h5 className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-2">Connect With Us</h5>
              <SocialIcons settings={settings} size="md" showHandle={true} />
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-4">Navigation</h4>
            <ul className="space-y-2.5 text-sm text-[#FDF8F2]/80 font-light">
              <li>
                <button onClick={() => { setActiveTab('home'); scrollToTop(); }} className="hover:text-[#D4AF37] transition-colors">Home</button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('menu'); scrollToTop(); }} className="hover:text-[#D4AF37] transition-colors">Our Menu</button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('events'); scrollToTop(); }} className="hover:text-[#D4AF37] transition-colors">Events & Catering</button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('gifting'); scrollToTop(); }} className="hover:text-[#D4AF37] transition-colors">Gifting & Hampers</button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('about'); scrollToTop(); }} className="hover:text-[#D4AF37] transition-colors">About Brand Story</button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('gallery'); scrollToTop(); }} className="hover:text-[#D4AF37] transition-colors">Event Gallery</button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('contact'); scrollToTop(); }} className="hover:text-[#D4AF37] transition-colors">Contact Us</button>
              </li>
            </ul>
          </div>

          {/* Special Event Offerings */}
          <div>
            <h4 className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-4">Special Services</h4>
            <ul className="space-y-2.5 text-sm text-[#FDF8F2]/80 font-light">
              <li>Wedding Beverage & Food Bars</li>
              <li>Corporate Summit Catering</li>
              <li>Custom Branded Drink Bottling</li>
              <li>Executive Gift Hampers</li>
              <li>VIP Birthday Small Chops Towers</li>
              <li>Private Party Mixology</li>
              <li>Healthy Parfait & Salad Stations</li>
            </ul>
          </div>

          {/* Direct Contact */}
          <div>
            <h4 className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-4">Official Contact</h4>
            <div className="space-y-3.5 text-sm text-[#FDF8F2]/80 font-light">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href={`tel:${cleanPhone}`} className="hover:text-[#D4AF37] font-semibold transition-colors">
                  {phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <a 
                  href={buildWhatsAppLink()} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#25D366] font-semibold text-[#25D366] transition-colors flex items-center gap-1"
                >
                  WhatsApp Us ({whatsapp})
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-[#D4AF37] transition-colors break-all">
                  {email}
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-1" />
                <div>
                  <a 
                    href={mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#D4AF37] transition-colors leading-snug flex items-center gap-1 text-xs"
                    title="View location on Google Maps"
                  >
                    <span>{address}</span>
                    <ExternalLink className="w-3 h-3 text-[#D4AF37] shrink-0" />
                  </a>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={onOpenEnquiryModal}
                  className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold text-xs uppercase tracking-wider transition-colors shadow-md rounded-lg"
                >
                  Request Event Quote
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright & legal bar */}
        <div className="pt-8 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FDF8F2]/60 font-light">
          <p>&copy; {new Date().getFullYear()} {businessName}. All Rights Reserved.</p>
          
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => onOpenLegal('privacy')} className="hover:text-[#D4AF37]">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => onOpenLegal('terms')} className="hover:text-[#D4AF37]">Terms & Conditions</button>
            <span>•</span>
            <button onClick={() => onOpenLegal('payment')} className="hover:text-[#D4AF37]">Payment Policy</button>
            <span>•</span>
            <button onClick={() => onOpenLegal('delivery')} className="hover:text-[#D4AF37]">Delivery Policy</button>
          </div>

          <button
            onClick={scrollToTop}
            className="p-2.5 rounded-full bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-[#3D0C11] transition-colors"
            title="Back to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

      </div>
    </footer>
  );
};
