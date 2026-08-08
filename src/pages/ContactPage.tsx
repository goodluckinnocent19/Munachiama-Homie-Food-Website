import React from 'react';
import { ContactSection } from '../components/ContactSection';
import { BusinessSettings } from '../types';

interface ContactPageProps {
  settings?: BusinessSettings;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  return (
    <div className="pt-24 bg-[#FFFDF9] min-h-screen">
      <ContactSection settings={settings} />
    </div>
  );
};
