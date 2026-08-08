import React, { useState } from 'react';
import { FAQItem } from '../types';
import { ChevronDown, ShieldCheck, HelpCircle, Sparkles } from 'lucide-react';

interface FAQAccordionProps {
  faqs: FAQItem[];
  onOpenLegal: (type: 'privacy' | 'terms' | 'payment' | 'delivery') => void;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ faqs, onOpenLegal }) => {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { slug: 'all', label: 'All FAQs' },
    { slug: 'payment', label: 'Payment & Policy' },
    { slug: 'ordering', label: 'Ordering & Delivery' },
    { slug: 'catering', label: 'Event Catering' },
    { slug: 'general', label: 'General Questions' },
  ];

  const filteredFaqs = selectedCategory === 'all'
    ? faqs
    : faqs.filter((f) => f.category === selectedCategory);

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-20 bg-[#1A0507] relative text-[#FDF8F2]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clear & Transparent Guidance</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#FDF8F2] tracking-tight">
            Frequently Asked <span className="text-[#D4AF37] italic font-serif">Questions</span>
          </h2>
          <p className="text-base text-[#FDF8F2]/75 mt-3 leading-relaxed font-light">
            Everything you need to know about booking catering, delivery, order lead times, and payment policies for Munachiama | Chiama21 Hommie Foods.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-[#D4AF37] text-[#3D0C11] border border-[#D4AF37]'
                  : 'bg-[#2D1B1B] text-[#FDF8F2]/80 hover:bg-white/10 border border-[#D4AF37]/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            const isPaymentPolicy = faq.category === 'payment';

            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-[#2D1B1B] border-[#D4AF37] shadow-lg'
                    : 'bg-[#2D1B1B]/60 border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-5 text-left font-serif text-base sm:text-lg font-bold text-[#FDF8F2] flex items-center justify-between gap-4 focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    {isPaymentPolicy ? (
                      <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
                    ) : (
                      <HelpCircle className="w-5 h-5 text-[#D4AF37]/70 shrink-0" />
                    )}
                    <span>{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-[#D4AF37] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-[#FDF8F2]/85 leading-relaxed font-light border-t border-[#D4AF37]/15">
                    <p className="whitespace-pre-line">{faq.answer}</p>
                    
                    {isPaymentPolicy && (
                      <div className="mt-3 p-3 rounded-xl bg-[#3D0C11] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] flex items-center justify-between">
                        <span>Read full terms and delivery guidelines</span>
                        <button
                          onClick={() => onOpenLegal('payment')}
                          className="text-[#D4AF37] hover:underline uppercase text-[11px] font-bold"
                        >
                          Payment Policy &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
