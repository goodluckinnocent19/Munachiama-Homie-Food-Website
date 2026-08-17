import React from 'react';
import { ShoppingBag, ArrowRight, MessageCircle, Sparkles, Star } from 'lucide-react';
import { buildWhatsAppLink } from '../services/api';

interface HeroProps {
  onOpenEnquiryModal: () => void;
  onExploreMenu: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenEnquiryModal, onExploreMenu }) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-[#1A0507] via-[#3D0C11] to-[#1A0507] text-[#FDF8F2]">
      {/* Decorative luxury ambient blur shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#1A0507] rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A0507] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Munachiama | Chiama21 Hommie Foods</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-[#FDF8F2] tracking-tight leading-[0.95]">
              Naturally Refined.{' '}
              <span className="block font-serif text-[#D4AF37] italic mt-2 font-normal">
                Beautifully Served.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-[#FDF8F2]/80 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
              Curated drinks, fresh fruit juices, gourmet small chops, artisanal parfaits, healthy salads and luxury hampers crafted for life’s most celebrated milestones.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3">
              {/* Primary Order/Quote button */}
              <button
                onClick={onOpenEnquiryModal}
                className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold text-xs uppercase tracking-widest border border-[#D4AF37] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
              >
                <ShoppingBag className="w-4 h-4 text-[#3D0C11]" />
                <span>Order / Request a Quote</span>
              </button>

              {/* Secondary Explore Menu */}
              <button
                onClick={onExploreMenu}
                className="w-full sm:w-auto px-7 py-4 bg-transparent hover:bg-white/5 text-[#D4AF37] font-bold text-xs uppercase tracking-widest border border-[#D4AF37]/50 hover:border-[#D4AF37] transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Menu</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>

              {/* WhatsApp Quick Link */}
              <a
                href={buildWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-4 rounded-full bg-[#25D366] hover:bg-[#1eb857] text-[#1A0507] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Us</span>
              </a>
            </div>

            {/* Review & Catering Highlights */}
            <div className="pt-6 border-t border-[#D4AF37]/20 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#FDF8F2]/75 font-medium">
              <div className="flex items-center gap-1 text-[#D4AF37]">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <span className="ml-1 font-bold text-[#FDF8F2]">4.9/5 Event Rating</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div>Weddings, Corporate & Private Events</div>
              <span className="hidden sm:inline">•</span>
              <div className="text-[#D4AF37] font-bold">100% Payment Before Delivery</div>
            </div>

          </div>

          {/* Right Visual Image Showcase Grid */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer decorative gold frame */}
              <div className="absolute -inset-3 rounded-3xl border border-[#D4AF37]/30 transform rotate-1 pointer-events-none" />

              {/* Main Banner Grid */}
              <div className="relative rounded-2xl overflow-hidden bg-[#2D1B1B] border border-[#D4AF37]/30 shadow-2xl grid grid-cols-2 gap-2 p-2">
                
                {/* Image 1: Natural Drinks */}
                <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=800&q=80"
                    alt="Natural Drinks Zobo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-end">
                    <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Natural Brews</span>
                    <span className="text-xs font-serif font-bold text-white">Hibiscus & Tiger Nut</span>
                  </div>
                </div>

                {/* Image 2: Gourmet Small Chops */}
                <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80"
                    alt="Small Chops Platter"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-end">
                    <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Event Favorite</span>
                    <span className="text-xs font-serif font-bold text-white">Gourmet Small Chops</span>
                  </div>
                </div>

                {/* Image 3: Parfaits */}
                <div className="relative h-40 sm:h-48 rounded-xl overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80"
                    alt="Yoghurt Parfait"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-end">
                    <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Artisan Parfaits</span>
                    <span className="text-xs font-serif font-bold text-white">Greek Yoghurt & Fruit</span>
                  </div>
                </div>

                {/* Image 4: Luxury Gifting */}
                <div className="relative h-40 sm:h-48 rounded-xl overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
                    alt="Luxury Gift Hampers"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-end">
                    <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Luxury Gifting</span>
                    <span className="text-xs font-serif font-bold text-white">Curated Hampers</span>
                  </div>
                </div>

              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-[#1A0507] text-[#FDF8F2] border border-[#D4AF37] p-4 rounded-2xl shadow-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold text-lg font-serif">
                  21
                </div>
                <div>
                  <span className="block text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">Signature Quality</span>
                  <span className="block text-xs font-serif font-bold">Made for Celebration</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
