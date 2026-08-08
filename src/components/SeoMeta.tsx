import React, { useEffect } from 'react';
import { BusinessSettings } from '../types';

interface SeoMetaProps {
  activeTab: string;
  settings?: BusinessSettings;
}

export const SeoMeta: React.FC<SeoMetaProps> = ({ activeTab, settings }) => {
  useEffect(() => {
    const businessName = settings?.businessName || 'Munachiama | Chiama21 Hommie Foods';
    const phone = settings?.phone || '+234 806 512 4134';
    const email = settings?.email || 'chiama21hommiefoods@gmail.com';
    const address = settings?.address || 'Ada-George Road, Mgbuoba, Port Harcourt, Rivers, Nigeria';

    // Dynamic page title
    const titles: Record<string, string> = {
      home: `${businessName} — Natural Drinks, Small Chops & Event Catering`,
      menu: `Our Menu — Premium Drinks, Fresh Juices, Small Chops & Hampers | ${businessName}`,
      events: `Event Catering & Wedding Refreshments — ${businessName}`,
      gifting: `Luxury Gift Hampers & Corporate Souvenirs — ${businessName}`,
      about: `Brand Story & Philosophy — ${businessName}`,
      gallery: `Event Photo Showcase & Beverage Bars Gallery — ${businessName}`,
      contact: `Contact & Order Enquiry — ${businessName}`,
      admin: `Admin Portal — ${businessName} Management`,
    };

    document.title = titles[activeTab] || titles.home;

    // Inject JSON-LD Schema
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'FoodEstablishment',
      name: businessName,
      image: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=1000&q=80',
      description: 'Premium taste natural drinks, cold pressed fruit juices, gourmet small chops platters, mocktails, parfaits, and luxury gift hampers for weddings and events.',
      servesCuisine: ['Nigerian', 'Beverages', 'Small Chops', 'Catering'],
      paymentAccepted: 'Bank Transfer, Electronic Transfer (Full Payment Required Before Delivery)',
      priceRange: '₦3,500 - ₦2,000,000',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Ada-George Road, Mgbuoba',
        addressLocality: 'Port Harcourt',
        addressRegion: 'Rivers State',
        addressCountry: 'NG',
      },
      telephone: phone,
      email: email,
      url: window.location.origin,
      sameAs: [
        settings?.facebook || 'https://facebook.com',
        settings?.instagram || 'https://instagram.com',
        settings?.tiktok || 'https://tiktok.com',
        settings?.snapchat || 'https://snapchat.com',
      ].filter(Boolean),
    };

    const scriptId = 'json-ld-schema';
    let scriptElem = document.getElementById(scriptId);
    if (!scriptElem) {
      scriptElem = document.createElement('script');
      scriptElem.id = scriptId;
      scriptElem.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptElem);
    }
    scriptElem.textContent = JSON.stringify(schemaData);

  }, [activeTab, settings]);

  return null;
};
