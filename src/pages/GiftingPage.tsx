import React from 'react';
import { Gift, Sparkles, ShoppingBag, MessageCircle, Heart, Award } from 'lucide-react';
import { Product } from '../types';
import { buildWhatsAppLink } from '../services/api';

interface GiftingPageProps {
  products: Product[];
  onOpenEnquiryModal: (preselectedCategory?: string, productName?: string) => void;
}

export const GiftingPage: React.FC<GiftingPageProps> = ({ products, onOpenEnquiryModal }) => {
  const giftingProducts = products.filter((p) => p.category === 'luxury-gifting');

  return (
    <div className="pt-28 pb-20 bg-[#FAF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#C5A059] uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Executive & Celebratory Gift Hampers</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-[#4A0E17] tracking-tight">
            Luxury Gifting & Hampers
          </h1>
          <p className="text-base text-[#2D1B1E]/75 mt-3 leading-relaxed">
            Delight clients, partners, bridal parties, and loved ones with bespoke woven hampers loaded with custom botanical drinks, gourmet treats, and personalized gold-embossed notes.
          </p>
        </div>

        {/* Gift Hampers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {giftingProducts.map((p) => (
            <div key={p.id} className="bg-[#FFFDF9] rounded-3xl overflow-hidden border border-[#4A0E17]/10 hover:border-[#C5A059] shadow-lg flex flex-col justify-between">
              <div className="relative h-64 bg-[#2D1B1E]">
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-[#4A0E17] text-[#DFBF7A] text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-[#C5A059]">
                  Bespoke Gift Hamper
                </div>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="font-serif text-2xl font-bold text-[#4A0E17]">{p.name}</h3>
                <p className="text-xs text-[#2D1B1E]/80 leading-relaxed">{p.description}</p>

                <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#4A0E17]/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#2D1B1E]/60 uppercase block">Starting Price</span>
                    <span className="text-base font-bold text-[#4A0E17]">{p.price_text || `₦${p.price?.toLocaleString()}`}</span>
                  </div>
                  <Gift className="w-5 h-5 text-[#C5A059]" />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => onOpenEnquiryModal('luxury-gifting', p.name)}
                    className="py-3 rounded-xl bg-[#4A0E17] hover:bg-[#33080F] text-[#FAF6F0] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#DFBF7A]" />
                    <span>Order Hamper</span>
                  </button>

                  <a
                    href={buildWhatsAppLink({ name: 'Valued Client', enquiryType: `Gift Hamper: ${p.name}` })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 rounded-xl border border-[#2D5A3F] text-[#2D5A3F] hover:bg-[#2D5A3F] hover:text-white font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
