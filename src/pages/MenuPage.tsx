import React, { useState } from 'react';
import { Product, Category } from '../types';
import { Search, ShoppingBag, MessageCircle, CheckCircle2, Sparkles, Filter } from 'lucide-react';
import { buildWhatsAppLink } from '../services/api';

interface MenuPageProps {
  products: Product[];
  categories: Category[];
  onOpenEnquiryModal: (preselectedCategory?: string, productName?: string) => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({ products, categories, onOpenEnquiryModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-28 pb-20 bg-[#FAF6F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#C5A059] uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Artisanal Food & Beverage Collection</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-[#4A0E17] tracking-tight">
            Our Complete Menu
          </h1>
          <p className="text-base text-[#2D1B1E]/75 mt-3 leading-relaxed">
            Fresh natural brews, 100% cold pressed juices, golden small chops platters, Greek yoghurt parfaits, and luxury gifting.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="bg-[#FFFDF9] p-6 rounded-3xl border border-[#4A0E17]/10 shadow-sm mb-10 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-[#2D1B1E]/50" />
            <input
              type="text"
              placeholder="Search drinks, small chops, parfaits, ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-[#FAF6F0] border border-[#4A0E17]/20 text-sm focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pt-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#4A0E17] text-[#FAF6F0] border border-[#C5A059]'
                  : 'bg-[#FAF6F0] text-[#2D1B1E]/80 hover:bg-[#4A0E17]/10'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.slug)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === c.slug
                    ? 'bg-[#4A0E17] text-[#FAF6F0] border border-[#C5A059]'
                    : 'bg-[#FAF6F0] text-[#2D1B1E]/80 hover:bg-[#4A0E17]/10'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-[#FFFDF9] rounded-2xl overflow-hidden border border-[#4A0E17]/10 hover:border-[#C5A059] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative h-52 bg-[#2D1B1E]">
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-[#4A0E17]/90 text-[#DFBF7A] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#C5A059]/30 backdrop-blur-md">
                  {p.category.replace('-', ' ')}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#4A0E17]">{p.name}</h3>
                  <p className="text-xs text-[#2D1B1E]/75 mt-1 leading-relaxed">{p.description}</p>
                  
                  {p.ingredients && p.ingredients.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.ingredients.slice(0, 3).map((ing, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-[#FAF6F0] text-[10px] text-[#4A0E17] rounded-md font-medium">
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#4A0E17]/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#2D1B1E]/60 uppercase font-semibold">Price</span>
                    <span className="text-sm font-bold text-[#4A0E17]">
                      {p.price_text || (p.price ? `₦${p.price.toLocaleString()}` : 'Request Quote')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onOpenEnquiryModal(p.category, p.name)}
                      className="py-2.5 rounded-xl bg-[#4A0E17] hover:bg-[#33080F] text-[#FAF6F0] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#DFBF7A]" />
                      <span>Request Quote</span>
                    </button>

                    <a
                      href={buildWhatsAppLink({ name: 'Customer', enquiryType: p.name })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 rounded-xl border border-[#2D5A3F] text-[#2D5A3F] hover:bg-[#2D5A3F] hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
