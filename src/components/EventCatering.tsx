import React from 'react';
import { Calendar, Users, Heart, Briefcase, Gift, Sparkles, ArrowRight } from 'lucide-react';

interface EventCateringProps {
  onOpenEnquiryModal: (eventType?: string) => void;
}

export const EventCatering: React.FC<EventCateringProps> = ({ onOpenEnquiryModal }) => {
  const events = [
    {
      id: 'wedding',
      title: 'Weddings & Receptions',
      subtitle: 'Unforgettable Refreshment & Catering Bars',
      desc: 'Elegant natural drinks stations, bespoke Chapman mocktail dispensers, and gourmet small chops towers designed to delight royal reception guests.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
      icon: Heart,
    },
    {
      id: 'corporate',
      title: 'Corporate Events & Summits',
      subtitle: 'Professional Executive Refreshment Solutions',
      desc: 'Cold-pressed fresh fruit juices, healthy salad bowls, and executive small chops platters for board meetings, conferences, and corporate retreats.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
      icon: Briefcase,
    },
    {
      id: 'birthday',
      title: 'Birthdays & Anniversaries',
      subtitle: 'Vibrant & Delicious Celebration Platters',
      desc: 'Fun, colorful, and beautifully presented parfait bars, tropical juices, and hot finger foods tailored to celebrate another blessed year.',
      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
      icon: Calendar,
    },
    {
      id: 'private_party',
      title: 'Private Parties & Bridal Showers',
      subtitle: 'Intimate Gathering Culinary Touch',
      desc: 'Customized menu packages, handcrafted cocktails/mocktails, and dessert parfaits crafted for cozy, high-vibe family and friend celebrations.',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
      icon: Users,
    },
    {
      id: 'gifting',
      title: 'Corporate & VIP Gifting',
      subtitle: 'Bespoke Luxury Hampers & Souvenirs',
      desc: 'Custom branded gift hampers loaded with artisan treats, natural drinks, and personalized gold-embossed notes for clients, executives, and guests.',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      icon: Gift,
    },
  ];

  return (
    <section className="py-20 bg-[#3D0C11] text-[#FDF8F2] relative overflow-hidden">
      {/* Decorative gold ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#D4AF37] uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Event Catering & Gifting</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[#FDF8F2] tracking-tight">
            Made for Your Special <span className="text-[#D4AF37] italic font-serif">Moments</span>
          </h2>
          <p className="text-base text-[#FDF8F2]/80 mt-3 leading-relaxed font-light">
            From intimate family dinners to 1,000-guest wedding receptions and nationwide corporate gifting, we deliver seamless, luxurious, and memorable culinary experiences.
          </p>
        </div>

        {/* Event Cards Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((evt) => {
            const IconComponent = evt.icon;
            return (
              <div
                key={evt.id}
                className="group bg-[#2D1B1B] rounded-3xl overflow-hidden border border-[#D4AF37]/30 hover:border-[#D4AF37] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={evt.image}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2D1B1B] via-transparent to-black/50 p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="p-2.5 rounded-full bg-[#1A0507]/90 text-[#D4AF37] border border-[#D4AF37]/40 backdrop-blur-md">
                        <IconComponent className="w-4 h-4" />
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider border border-[#D4AF37]/30 backdrop-blur-md">
                        Catering & Refreshments
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-bold text-[#D4AF37] tracking-wider uppercase block">{evt.subtitle}</span>
                    <h3 className="font-serif text-2xl font-bold text-white mt-1 group-hover:text-[#D4AF37] transition-colors">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-[#FDF8F2]/75 mt-2.5 leading-relaxed font-light">
                      {evt.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenEnquiryModal(evt.id)}
                    className="w-full py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold text-xs uppercase tracking-widest border border-[#D4AF37] transition-all flex items-center justify-center gap-2 group/btn shadow-md"
                  >
                    <span>Plan {evt.title.split(' ')[0]} Order</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Big Central CTA */}
        <div className="mt-16 bg-[#2D1B1B] rounded-3xl p-8 sm:p-12 border border-[#D4AF37] text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="font-serif text-2xl sm:text-3xl font-light text-white">
              Planning a Custom Celebration or Bulk Event?
            </h3>
            <p className="text-sm text-[#FDF8F2]/80 leading-relaxed font-light">
              Tell us your guest count, preferred menu items, location, and budget. Our team will tailor a bespoke food & drink proposal for you within hours.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onOpenEnquiryModal()}
                className="px-8 py-4 bg-[#D4AF37] hover:bg-[#E5C158] text-[#3D0C11] font-bold text-xs uppercase tracking-widest border border-[#D4AF37] shadow-xl hover:scale-[1.02] transition-all inline-flex items-center gap-3"
              >
                <span>Plan Your Event With Us</span>
                <ArrowRight className="w-5 h-5 text-[#3D0C11]" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
