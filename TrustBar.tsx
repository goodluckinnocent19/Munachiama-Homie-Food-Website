import React from 'react';
import { Sparkles, ShieldCheck, Truck, Clock, HeartHandshake, Award } from 'lucide-react';

export const TrustBar: React.FC = () => {
  const trustPoints = [
    {
      icon: Sparkles,
      title: 'Freshly Prepared',
      desc: 'Crafted on the day of your event',
    },
    {
      icon: Award,
      title: 'Premium Ingredients',
      desc: '100% natural juices & gourmet recipes',
    },
    {
      icon: Clock,
      title: 'Event Ready',
      desc: 'Chilled, bottled & styled for luxury',
    },
    {
      icon: ShieldCheck,
      title: 'Carefully Packaged',
      desc: 'Insulated, tamper-evident presentation',
    },
    {
      icon: Truck,
      title: 'Reliable Delivery',
      desc: 'Timely logistics for major occasions',
    },
    {
      icon: HeartHandshake,
      title: 'Made for Special Moments',
      desc: 'Weddings, corporate & private celebrations',
    },
  ];

  return (
    <section className="bg-[#1A0507] text-[#FDF8F2] py-8 border-y border-[#D4AF37]/25 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {trustPoints.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="p-3 rounded-full bg-[#3D0C11] text-[#D4AF37] border border-[#D4AF37]/30 mb-2.5 group-hover:bg-[#D4AF37] group-hover:text-[#3D0C11] transition-all duration-300">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h4 className="font-serif text-sm font-bold text-[#FDF8F2] tracking-tight">{item.title}</h4>
                <p className="text-[11px] text-[#FDF8F2]/70 mt-0.5 leading-snug">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
