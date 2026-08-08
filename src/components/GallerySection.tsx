import React, { useState } from 'react';
import { GalleryItem } from '../types';
import { Sparkles, Maximize2, X, Image as ImageIcon } from 'lucide-react';

interface GallerySectionProps {
  galleryItems: GalleryItem[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ galleryItems }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  const categories = [
    { slug: 'all', label: 'All Photos' },
    { slug: 'events', label: 'Event Setups' },
    { slug: 'natural-drinks', label: 'Natural Drinks' },
    { slug: 'small-chops', label: 'Small Chops' },
    { slug: 'packaging', label: 'Branded Packaging' },
    { slug: 'tablescapes', label: 'Parfaits & Tablescapes' },
  ];

  const filteredItems = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <section className="py-20 bg-[#1A0507] relative text-[#FDF8F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Visual Craft & Celebrations</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#FDF8F2] tracking-tight">
            Event & Showcase <span className="text-[#D4AF37] italic font-serif">Gallery</span>
          </h2>
          <p className="text-base text-[#FDF8F2]/75 mt-3 leading-relaxed font-light">
            Take a look at our bespoke beverage setups, hot small chops stations, branded gift boxes, and event presentations.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeCategory === cat.slug
                  ? 'bg-[#D4AF37] text-[#3D0C11] border border-[#D4AF37]'
                  : 'bg-[#2D1B1B] text-[#FDF8F2]/80 hover:bg-white/10 border border-[#D4AF37]/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Masonry / Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="group relative rounded-2xl overflow-hidden bg-[#2D1B1B] border border-[#D4AF37]/30 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer h-72"
            >
              <img
                src={item.image_url}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0507] via-black/30 to-transparent p-5 flex flex-col justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider bg-[#1A0507]/90 px-2.5 py-1 rounded-full border border-[#D4AF37]/40 backdrop-blur-md">
                    {item.category.replace('-', ' ')}
                  </span>
                  <Maximize2 className="w-4 h-4 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-serif text-lg font-bold text-white mt-2 group-hover:text-[#D4AF37] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-white/80 mt-1 line-clamp-1 font-light">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-[#1A0507] rounded-3xl overflow-hidden border border-[#D4AF37] shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/70 text-[#D4AF37] hover:bg-black transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="max-h-[75vh] overflow-hidden bg-black flex items-center justify-center">
              <img
                src={selectedImage.image_url}
                alt={selectedImage.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>

            <div className="p-6 bg-[#2D1B1B] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[#D4AF37]/30">
              <div>
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest block">
                  Category: {selectedImage.category.replace('-', ' ')}
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  {selectedImage.title}
                </h3>
                <p className="text-sm text-[#FDF8F2]/80 mt-1 font-light">
                  {selectedImage.caption}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[#D4AF37] italic">Munachiama | Chiama21 Hommie Foods</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
