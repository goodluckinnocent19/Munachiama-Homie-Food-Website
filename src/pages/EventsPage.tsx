import React from 'react';
import { EventCatering } from '../components/EventCatering';
import { Sparkles, Calendar, Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface EventsPageProps {
  onOpenEnquiryModal: (eventType?: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onOpenEnquiryModal }) => {
  return (
    <div className="pt-28 pb-20 bg-[#FAF6F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#C5A059] uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Event Catering & Hospitality</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-[#4A0E17] tracking-tight">
            Celebration Refreshments
          </h1>
          <p className="text-base text-[#2D1B1E]/75 mt-3 leading-relaxed">
            Weddings, Corporate Summits, Birthday Galas & Private Dinners. Beautifully presented natural drinks, mocktails, cold-pressed juices, and gourmet finger foods.
          </p>
        </div>

      </div>

      <EventCatering onOpenEnquiryModal={onOpenEnquiryModal} />

      {/* Service Workflow Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <h3 className="font-serif text-2xl font-bold text-[#4A0E17] text-center mb-10">
          How Event Booking Works
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Submit Request',
              desc: 'Select your event date, location, guest estimate, and menu items.',
            },
            {
              step: '02',
              title: 'Receive Custom Quote',
              desc: 'Our catering team prepares a transparent proposal with custom branding options.',
            },
            {
              step: '03',
              title: 'Confirm Payment',
              desc: 'Full payment confirms your slot and activates raw material preparation.',
            },
            {
              step: '04',
              title: 'Flawless Execution',
              desc: 'Chilled drinks and hot small chops dispatches delivered on schedule.',
            },
          ].map((s, idx) => (
            <div key={idx} className="bg-[#FFFDF9] p-6 rounded-2xl border border-[#4A0E17]/10 text-center space-y-2">
              <span className="w-10 h-10 rounded-full bg-[#4A0E17] text-[#DFBF7A] font-serif font-bold text-lg inline-flex items-center justify-center">
                {s.step}
              </span>
              <h4 className="font-serif text-lg font-bold text-[#4A0E17]">{s.title}</h4>
              <p className="text-xs text-[#2D1B1E]/70">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
