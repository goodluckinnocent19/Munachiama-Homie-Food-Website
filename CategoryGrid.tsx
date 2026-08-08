import React from 'react';
import { Category } from '../types';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory: (categorySlug: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onSelectCategory }) => {
  return (
    <section className="py-20 bg-[#3D0C11] relative text-[#FDF8F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Offerings</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#FDF8F2] tracking-tight">
            Our Specialty <span className="text-[#D4AF37] italic font-serif">Categories</span>
          </h2>
          <p className="text-base text-[#FDF8F2]/75 mt-3 leading-relaxed font-light">
            From cold-pressed tropical juices and rich herbal zobo to hot golden small chops platters and bespoke luxury hampers, discover our signature creations.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className="group bg-[#2D1B1B] rounded-2xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              {/* Image Banner */}
              <div className="relative h-48 overflow-hidden bg-[#1A0507]">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
                    {cat.item_count ? `${cat.item_count} Items` : 'Specialty'}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-xs text-[#FDF8F2]/80 leading-relaxed mb-4 font-light">
                  {cat.description}
                </p>

                <div className="pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#D4AF37] group-hover:text-[#E5C158]">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
