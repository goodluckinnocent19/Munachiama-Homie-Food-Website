import React from 'react';
import { Hero } from '../components/Hero';
import { TrustBar } from '../components/TrustBar';
import { BrandStory } from '../components/BrandStory';
import { CategoryGrid } from '../components/CategoryGrid';
import { SignatureCollection } from '../components/SignatureCollection';
import { EventCatering } from '../components/EventCatering';
import { PaymentOptionsSection } from '../components/PaymentOptionsSection';
import { FAQAccordion } from '../components/FAQAccordion';
import { ContactSection } from '../components/ContactSection';
import { Category, Product, FAQItem } from '../types';

interface HomePageProps {
  categories: Category[];
  products: Product[];
  faqs: FAQItem[];
  setActiveTab: (tab: string) => void;
  onOpenEnquiryModal: (preselectedCategory?: string, productName?: string) => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'payment' | 'delivery') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  products,
  faqs,
  setActiveTab,
  onOpenEnquiryModal,
  onOpenLegal,
}) => {
  return (
    <div className="space-y-0">
      <Hero
        onOpenEnquiryModal={() => onOpenEnquiryModal()}
        onExploreMenu={() => setActiveTab('menu')}
      />

      <TrustBar />

      <BrandStory />

      <CategoryGrid
        categories={categories}
        onSelectCategory={(slug) => {
          setActiveTab('menu');
        }}
      />

      <SignatureCollection
        products={products}
        onOpenEnquiryModal={onOpenEnquiryModal}
      />

      <EventCatering
        onOpenEnquiryModal={(evtType) => onOpenEnquiryModal(evtType)}
      />

      <PaymentOptionsSection
        onOpenEnquiry={(cat) => onOpenEnquiryModal(cat)}
      />

      <FAQAccordion
        faqs={faqs}
        onOpenLegal={onOpenLegal}
      />

      <ContactSection />
    </div>
  );
};
