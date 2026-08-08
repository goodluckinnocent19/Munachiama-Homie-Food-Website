import React from 'react';
import { GallerySection } from '../components/GallerySection';
import { GalleryItem } from '../types';

interface GalleryPageProps {
  galleryItems: GalleryItem[];
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ galleryItems }) => {
  return (
    <div className="pt-24 bg-[#FAF6F0] min-h-screen">
      <GallerySection galleryItems={galleryItems} />
    </div>
  );
};
