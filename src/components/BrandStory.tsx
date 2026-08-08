import React from 'react';
import { Heart, Sparkles, Shield, Utensils, Award } from 'lucide-react';

export const BrandStory: React.FC = () => {
  return (
    <section className="py-20 bg-[#1A0507] border-y border-[#D4AF37]/20 relative overflow-hidden text-[#FDF8F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Image Editorial Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#D4AF37]/30">
              <img
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80"
                alt="Munachiama Event Catering Setup"
                className="w-full h-[450px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0507]/95 via-[#1A0507]/30 to-transparent p-6 flex flex-col justify-end">
                <span className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">Our Culinary Philosophy</span>
                <p className="font-serif text-xl font-bold text-[#FDF8F2] mt-1">
                  "Every sip and bite should feel like a warm, luxurious celebration."
                </p>
              </div>
            </div>
            {/* Floating Accent card */}
            <div className="absolute -bottom-6 -right-6 hidden sm:flex bg-[#2D1B1B] p-4 rounded-2xl border border-[#D4AF37] shadow-2xl max-w-xs items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center font-bold font-serif text-xl shrink-0">
                100%
              </div>
              <div>
                <p className="text-xs font-bold text-[#D4AF37]">Authentic & Fresh</p>
                <p className="text-[11px] text-[#FDF8F2]/70">Zero artificial colors or preservatives in our natural drinks.</p>
              </div>
            </div>
          </div>

          {/* Story Narrative Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Brand Story & Philosophy</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#FDF8F2] tracking-tight leading-tight">
              Made to Make Moments <span className="text-[#D4AF37] italic font-serif">Special</span>
            </h2>

            <p className="text-base text-[#FDF8F2]/85 leading-relaxed font-light">
              At <strong className="text-[#D4AF37] font-semibold">Munachiama | Chiama21 Hommie Foods</strong>, we believe food and drinks are not merely refreshments — they are the heart of human connection, celebration, and hospitality.
            </p>

            <p className="text-base text-[#FDF8F2]/85 leading-relaxed font-light">
              Whether it’s a grand royal wedding reception, an executive corporate summit, an intimate birthday brunch, or a curated luxury gift hamper for someone special, we pour painstaking care into every single ingredient, temperature, and presentation detail.
            </p>

            {/* Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/20 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#D4AF37]">Warm Hospitality</h4>
                  <p className="text-xs text-[#FDF8F2]/70 mt-0.5">Every customer is treated like royalty with personal attention and care.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/20 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#D4AF37]">Artisanal Precision</h4>
                  <p className="text-xs text-[#FDF8F2]/70 mt-0.5">Golden small chops, layered parfaits, and cold-pressed botanical brews.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/20 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#D4AF37]">Uncompromising Quality</h4>
                  <p className="text-xs text-[#FDF8F2]/70 mt-0.5">Strict quality controls, premium packaging, and food safety first.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#2D1B1B] border border-[#D4AF37]/20 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#D4AF37]">Reliable Professionalism</h4>
                  <p className="text-xs text-[#FDF8F2]/70 mt-0.5">Transparent policies, on-time delivery, and clear order management.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
