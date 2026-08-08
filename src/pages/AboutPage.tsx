import React from 'react';
import { BrandStory } from '../components/BrandStory';
import { TrustBar } from '../components/TrustBar';

export const AboutPage: React.FC = () => {
  return (
    <div className="pt-24 bg-[#FAF6F0] min-h-screen">
      <BrandStory />
      <TrustBar />
    </div>
  );
};
