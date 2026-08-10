import React, { useState, useEffect } from 'react';
import { Menu, X, MessageCircle, ShoppingBag, ShieldCheck, UserCheck, Mail } from 'lucide-react';
import { buildWhatsAppLink } from '../services/api';
import { BusinessSettings } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenEnquiryModal: (preselectedCategory?: string) => void;
  onOpenGmailModal: () => void;
  isAdminLoggedIn: boolean;
  onOpenAdmin: () => void;
  settings?: BusinessSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenEnquiryModal,
  onOpenGmailModal,
  isAdminLoggedIn,
  onOpenAdmin,
  settings,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Our Menu' },
    { id: 'events', label: 'Events & Catering' },
    { id: 'gifting', label: 'Gifting & Hampers' },
    { id: 'about', label: 'About Us' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass-header border-b border-[#D4AF37]/25 shadow-md py-3'
          : 'bg-[#1A0507]/95 border-b border-[#D4AF37]/20 py-4'
      }`}
    >
      {/* Top Banner Notice: Payment Policy */}
      <div className="bg-[#1A0507] text-[#FDF8F2] text-xs font-medium py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 border-b border-[#D4AF37]/20">
        <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>
          <strong className="text-[#D4AF37]">Payment Policy:</strong> Full payment is required to secure your delivery slot. We currently do not offer credit arrangements.
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Name */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-[#3D0C11] border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-serif text-xl font-bold shadow-sm group-hover:scale-105 transition-transform">
              M
            </div>
            <div>
              <span className="block font-serif text-lg sm:text-xl font-bold text-[#FDF8F2] tracking-wider leading-none">
                MUNACHIAMA
              </span>
              <span className="block text-[10px] sm:text-xs font-medium tracking-widest text-[#D4AF37] uppercase mt-0.5">
                CHIAMA21 HOMMIE FOODS
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-xs uppercase font-bold tracking-widest transition-colors relative py-1 ${
                  activeTab === link.id
                    ? 'text-[#D4AF37]'
                    : 'text-[#FDF8F2]/80 hover:text-[#D4AF37]'
                }`}
              >
                {link.label}
                {activeTab === link.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Right Action CTA Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Staff / Admin Access Link */}
            <button
              onClick={onOpenAdmin}
              className={`px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold flex items-center gap-1.5 ${
                isAdminLoggedIn
                  ? 'bg-[#2D5A3F] text-white border-[#25D366]'
                  : 'border-[#D4AF37]/20 text-[#FDF8F2]/70 hover:text-[#D4AF37] hover:border-[#D4AF37]/50'
              }`}
              title={isAdminLoggedIn ? 'Admin Portal Active' : 'Staff Login (/admin)'}
            >
              <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden md:inline">{isAdminLoggedIn ? 'Admin Portal' : 'Staff Login'}</span>
            </button>

            {/* Gmail Integration Link */}
            <button
              onClick={onOpenGmailModal}
              className="p-2.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1A0507] transition-all duration-200 flex items-center justify-center cursor-pointer"
              title="Official Gmail Service"
            >
              <Mail className="w-4 h-4" />
            </button>

            {/* WhatsApp Quick Link */}
            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-[#1A0507] transition-all duration-200 flex items-center justify-center"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            {/* Request a Quote CTA */}
            <button
              onClick={() => onOpenEnquiryModal()}
              className="px-5 py-2.5 rounded-none bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] text-xs font-bold uppercase tracking-widest border border-[#D4AF37] shadow-md transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-[#3D0C11]" />
              <span>Request a Quote</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => onOpenEnquiryModal()}
              className="px-3 py-1.5 bg-[#D4AF37] text-[#3D0C11] text-xs font-bold uppercase tracking-wider"
            >
              Quote
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#FDF8F2] hover:bg-white/10 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#D4AF37]" /> : <Menu className="w-6 h-6 text-[#D4AF37]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#1A0507] border-b border-[#D4AF37]/30 px-4 pt-3 pb-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-left px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-between ${
                  activeTab === link.id
                    ? 'bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/40'
                    : 'text-[#FDF8F2] hover:bg-white/5'
                }`}
              >
                <span>{link.label}</span>
                {activeTab === link.id && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
              </button>
            ))}
          </nav>

          <div className="mt-5 pt-4 border-t border-[#D4AF37]/20 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenEnquiryModal();
              }}
              className="w-full py-3 bg-[#D4AF37] text-[#3D0C11] font-bold text-xs uppercase tracking-widest text-center shadow-md flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-[#3D0C11]" />
              <span>Request Order / Quote</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenGmailModal();
                }}
                className="py-2.5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                <span>Gmail Services</span>
              </button>

              <a
                href={buildWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 rounded-xl border border-[#25D366] text-[#25D366] font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 text-[#FDF8F2] text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
