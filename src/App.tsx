import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SmartEnquiryModal } from './components/SmartEnquiryModal';
import { GmailManagerModal } from './components/GmailManagerModal';
import { LegalModal } from './components/LegalModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AiChatModal } from './components/AiChatModal';
import { SeoMeta } from './components/SeoMeta';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { EventsPage } from './pages/EventsPage';
import { GiftingPage } from './pages/GiftingPage';
import { AboutPage } from './pages/AboutPage';
import { GalleryPage } from './pages/GalleryPage';
import { ContactPage } from './pages/ContactPage';
import { Category, Product, FAQItem, GalleryItem, BusinessSettings } from './types';
import { fetchProducts, fetchCategories, fetchFAQs, fetchGallery, fetchBusinessSettings, buildWhatsAppLink } from './services/api';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_FAQS, INITIAL_GALLERY } from './data/initialData';
import { MessageCircle } from 'lucide-react';

const getTabFromPath = (): string => {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
  if (path === '/admin') return 'admin';
  if (path === '/menu') return 'menu';
  if (path === '/events') return 'events';
  if (path === '/gifting') return 'gifting';
  if (path === '/about') return 'about';
  if (path === '/gallery') return 'gallery';
  if (path === '/contact') return 'contact';
  return 'home';
};

export default function App() {
  const [activeTab, setActiveTabState] = useState<string>(getTabFromPath);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'home' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [faqs, setFaqs] = useState<FAQItem[]>(INITIAL_FAQS);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | undefined>(undefined);

  // Modal States
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquiryCategory, setEnquiryCategory] = useState<string>('Complete Event Package');
  const [enquiryEventType, setEnquiryEventType] = useState<string>('wedding');
  const [enquiryProductName, setEnquiryProductName] = useState<string>('');
  const [gmailModalOpen, setGmailModalOpen] = useState(false);

  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'payment' | 'delivery' | null>(null);

  // Admin Token State
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('chiama_admin_token'));

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('chiama_admin_token', adminToken);
    } else {
      localStorage.removeItem('chiama_admin_token');
    }
  }, [adminToken]);

  // Load Data from backend API on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [prods, cats, faqList, gal, bSettings] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchFAQs(),
          fetchGallery(),
          fetchBusinessSettings(),
        ]);
        if (prods && prods.length > 0) setProducts(prods);
        if (cats && cats.length > 0) setCategories(cats);
        if (faqList && faqList.length > 0) setFaqs(faqList);
        if (gal && gal.length > 0) setGalleryItems(gal);
        if (bSettings) setBusinessSettings(bSettings);
      } catch (err) {
        console.warn('API sync fallback to local dataset:', err);
      }
    }
    loadData();
  }, []);

  const handleOpenEnquiryModal = (preselectedCategory?: string, productName?: string) => {
    if (preselectedCategory) setEnquiryCategory(preselectedCategory);
    if (productName) setEnquiryProductName(productName);
    setEnquiryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#1A0507] text-[#FDF8F2] flex flex-col justify-between font-sans selection:bg-[#D4AF37]/30 selection:text-[#1A0507]">
      
      {/* Dynamic Title and JSON-LD Schema */}
      <SeoMeta activeTab={activeTab} settings={businessSettings} />

      {/* Main Sticky Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenEnquiryModal={handleOpenEnquiryModal}
        onOpenGmailModal={() => setGmailModalOpen(true)}
        isAdminLoggedIn={Boolean(adminToken)}
        onOpenAdmin={() => setActiveTab('admin')}
        settings={businessSettings}
      />

      {/* Main View Container */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            categories={categories}
            products={products}
            faqs={faqs}
            setActiveTab={setActiveTab}
            onOpenEnquiryModal={handleOpenEnquiryModal}
            onOpenLegal={(type) => setLegalModalType(type)}
          />
        )}

        {activeTab === 'menu' && (
          <MenuPage
            products={products}
            categories={categories}
            onOpenEnquiryModal={handleOpenEnquiryModal}
          />
        )}

        {activeTab === 'events' && (
          <EventsPage
            onOpenEnquiryModal={(evtType) => {
              if (evtType) setEnquiryEventType(evtType);
              handleOpenEnquiryModal();
            }}
          />
        )}

        {activeTab === 'gifting' && (
          <GiftingPage
            products={products}
            onOpenEnquiryModal={handleOpenEnquiryModal}
          />
        )}

        {activeTab === 'about' && <AboutPage />}

        {activeTab === 'gallery' && <GalleryPage galleryItems={galleryItems} />}

        {activeTab === 'contact' && <ContactPage settings={businessSettings} />}

        {activeTab === 'admin' && (
          <AdminDashboard
            token={adminToken}
            setToken={setAdminToken}
            onCloseAdmin={() => setActiveTab('home')}
            onSettingsUpdated={(updated) => setBusinessSettings(updated)}
            onProductsUpdated={(updatedProds) => setProducts(updatedProds)}
          />
        )}
      </main>

      {/* Floating WhatsApp Action Button & AI Chat Button */}
      {activeTab !== 'admin' && (
        <>
          <AiChatModal />
          <a
            href={buildWhatsAppLink({ phoneNum: businessSettings?.whatsapp })}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#2D5A3F] hover:bg-[#20422E] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-2 border-[#DFBF7A]"
            title="Chat on WhatsApp"
          >
            <MessageCircle className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#C5A059] rounded-full border-2 border-white animate-pulse" />
          </a>
        </>
      )}

      {/* Footer */}
      {activeTab !== 'admin' && (
        <Footer
          setActiveTab={setActiveTab}
          onOpenEnquiryModal={() => handleOpenEnquiryModal()}
          onOpenLegal={(type) => setLegalModalType(type)}
          settings={businessSettings}
        />
      )}

      {/* Smart Order & Quote Modal */}
      <SmartEnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        initialCategory={enquiryCategory}
        initialEventType={enquiryEventType}
        initialProductName={enquiryProductName}
      />

      {/* Legal & Policy Modals */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {/* Gmail Integration Modal */}
      <GmailManagerModal
        isOpen={gmailModalOpen}
        onClose={() => setGmailModalOpen(false)}
      />

    </div>
  );
}
