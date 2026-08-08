import React, { useState } from 'react';
import { Product, CategorySlug } from '../types';
import { ShoppingBag, MessageCircle, Sparkles, Eye, CheckCircle2, X } from 'lucide-react';
import { buildWhatsAppLink } from '../services/api';

interface SignatureCollectionProps {
  products: Product[];
  onOpenEnquiryModal: (preselectedCategory?: string, productName?: string) => void;
}

export const SignatureCollection: React.FC<SignatureCollectionProps> = ({ products, onOpenEnquiryModal }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);

  const filters = [
    { slug: 'all', label: 'All Items' },
    { slug: 'natural-drinks', label: 'Natural Drinks' },
    { slug: 'fresh-juices', label: 'Fresh Juices' },
    { slug: 'small-chops', label: 'Small Chops' },
    { slug: 'mocktails-cocktails', label: 'Mocktails & Cocktails' },
    { slug: 'parfaits', label: 'Parfaits' },
    { slug: 'healthy-salads', label: 'Salads' },
    { slug: 'luxury-gifting', label: 'Luxury Gifting' },
  ];

  const filteredProducts = selectedFilter === 'all'
    ? products
    : products.filter((p) => p.category === selectedFilter);

  return (
    <section className="py-20 bg-[#1A0507] relative text-[#FDF8F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Masterpiece Culinary Creations</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#FDF8F2] tracking-tight">
            Our Signature <span className="text-[#D4AF37] italic font-serif">Selection</span>
          </h2>
          <p className="text-base text-[#FDF8F2]/75 mt-3 leading-relaxed font-light">
            Handcrafted beverages, artisanal small chops platters, fresh Greek yoghurt parfaits, and bespoke hampers engineered for exquisite taste and visual delight.
          </p>
        </div>

        {/* Filter Category Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-6 mb-8">
          {filters.map((tab) => (
            <button
              key={tab.slug}
              onClick={() => setSelectedFilter(tab.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedFilter === tab.slug
                  ? 'bg-[#D4AF37] text-[#3D0C11] border border-[#D4AF37] shadow-md'
                  : 'bg-[#2D1B1B] text-[#FDF8F2]/80 hover:bg-white/10 border border-[#D4AF37]/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-[#2D1B1B] rounded-2xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Header */}
              <div className="relative h-52 overflow-hidden bg-[#1A0507]">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-[#1A0507]/90 backdrop-blur-md text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider border border-[#D4AF37]/40">
                    {product.category.replace('-', ' ')}
                  </span>
                  {product.available ? (
                    <span className="px-2.5 py-1 rounded-full bg-[#25D366]/90 backdrop-blur-md text-[#1A0507] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Available
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-red-950/90 backdrop-blur-md text-red-200 text-[10px] font-bold">
                      Fully Booked
                    </span>
                  )}
                </div>

                {/* Quick View Overlay Button */}
                <button
                  onClick={() => setActiveModalProduct(product)}
                  className="absolute bottom-3 right-3 p-2.5 rounded-full bg-[#3D0C11]/80 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#3D0C11] border border-[#D4AF37]/40 transition-colors shadow-md"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Body Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#FDF8F2] group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-[#FDF8F2]/75 mt-1.5 line-clamp-2 leading-relaxed font-light">
                    {product.description}
                  </p>
                  
                  {product.serves_text && (
                    <p className="text-[11px] font-medium text-[#D4AF37] mt-2 italic">
                      ✨ {product.serves_text}
                    </p>
                  )}
                </div>

                {/* Footer Price & Action */}
                <div className="pt-4 mt-4 border-t border-[#D4AF37]/15 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#FDF8F2]/50 uppercase tracking-wider font-semibold block">Pricing</span>
                      <span className="text-sm font-bold text-[#D4AF37]">
                        {product.price_text || (product.price ? `₦${product.price.toLocaleString()}` : 'Request Quote')}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setActiveModalProduct(product)}
                      className="text-xs text-[#D4AF37] hover:underline font-semibold"
                    >
                      Details &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onOpenEnquiryModal(product.category, product.name)}
                      className="py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#3D0C11]" />
                      <span>Quote</span>
                    </button>

                    <a
                      href={buildWhatsAppLink({ name: 'Valued Customer', enquiryType: product.name })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 rounded-xl border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-[#1A0507] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
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

      {/* Product Detail Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1A0507] text-[#FDF8F2] rounded-3xl overflow-hidden border border-[#D4AF37] max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setActiveModalProduct(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-5 h-5 text-[#D4AF37]" />
            </button>

            <div className="relative h-64 bg-[#2D1B1B]">
              <img
                src={activeModalProduct.image_url}
                alt={activeModalProduct.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0507] via-transparent to-transparent p-6 flex flex-col justify-end">
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                  {activeModalProduct.category.replace('-', ' ')}
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  {activeModalProduct.name}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Description</h4>
                <p className="text-sm text-[#FDF8F2]/85 mt-1 leading-relaxed font-light">
                  {activeModalProduct.description}
                </p>
              </div>

              {activeModalProduct.ingredients && activeModalProduct.ingredients.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Key Ingredients / Contents</h4>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {activeModalProduct.ingredients.map((ing, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-[#2D1B1B] border border-[#D4AF37]/30 text-xs text-[#FDF8F2]">
                        • {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#2D1B1B] p-4 rounded-2xl border border-[#D4AF37]/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#FDF8F2]/60 uppercase tracking-wider block">Serving & Price</span>
                  <span className="text-base font-bold text-[#D4AF37]">
                    {activeModalProduct.price_text || (activeModalProduct.price ? `₦${activeModalProduct.price.toLocaleString()}` : 'Custom Quote')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#25D366] font-semibold block">Order Ahead</span>
                  <span className="text-xs text-[#FDF8F2]/70">Full payment before delivery</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    const prod = activeModalProduct;
                    setActiveModalProduct(null);
                    onOpenEnquiryModal(prod.category, prod.name);
                  }}
                  className="py-3 rounded-none bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-[#3D0C11]" />
                  <span>Request Quote</span>
                </button>

                <a
                  href={buildWhatsAppLink({ name: 'Valued Customer', enquiryType: activeModalProduct.name })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 rounded-none bg-[#25D366] text-[#1A0507] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Order</span>
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
};
