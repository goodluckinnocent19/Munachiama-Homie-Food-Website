import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import {
  Product,
  Category,
  Enquiry,
  Order,
  GalleryItem,
  FAQItem,
  PaymentPlan,
  Installment,
  PaymentSubmission,
  PaymentAuditLog,
  CustomerNotification,
  BusinessSettings,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_GALLERY,
  INITIAL_FAQS,
  DEFAULT_BUSINESS_SETTINGS,
} from '../data/initialData';

export function formatStorageErrorMessage(err: any): string {
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code === 'storage/unauthorized') {
    return 'Firebase Storage permission denied (storage/unauthorized). Please verify Firebase Storage Security Rules.';
  }
  if (code === 'storage/unauthenticated') {
    return 'Firebase Storage user unauthenticated (storage/unauthenticated).';
  }
  if (code === 'storage/quota-exceeded') {
    return 'Firebase Storage quota exceeded (storage/quota-exceeded).';
  }
  if (code === 'storage/invalid-argument') {
    return 'Invalid file argument provided to Firebase Storage (storage/invalid-argument).';
  }
  if (code === 'storage/object-not-found') {
    return 'Firebase Storage object not found (storage/object-not-found).';
  }
  if (code === 'storage/retry-limit-exceeded') {
    return 'Firebase Storage operation timed out (storage/retry-limit-exceeded). Please try again.';
  }
  if (code === 'storage/unknown' || err?.status_ === 404) {
    return "Firebase Storage error (storage/unknown, HTTP 404). Please verify that Cloud Storage is enabled in Firebase Console for project 'centering-sequence-vf6jr' and VITE_FIREBASE_STORAGE_BUCKET is set to 'centering-sequence-vf6jr.firebasestorage.app'.";
  }
  return `Firebase Storage Error (${code || 'unknown'}): ${msg}`;
}

export async function uploadStorageImage(file: File): Promise<string> {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Unsupported image format. Please select JPG, JPEG, PNG, or WEBP file.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 5MB limit.`);
  }

  const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `products/${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${sanitized}`;
  const storageRef = ref(storage, filename);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err: any) {
    console.error('[Firebase Storage Client Upload Error]:', err);
    throw new Error(formatStorageErrorMessage(err));
  }
}

let isSeeded = false;

const initialEnquiries: Enquiry[] = [
  {
    id: 'enq-1001',
    customer_name: 'Amina Bello',
    phone: '+234 803 123 4567',
    email: 'amina.bello@example.com',
    whatsapp: '+234 803 123 4567',
    event_type: 'wedding',
    product_category: 'natural-drinks',
    event_date: '2026-09-15',
    location: 'Victoria Island, Lagos',
    quantity: '250 Guests',
    budget: '₦500,000 - ₦800,000',
    message: 'Looking for custom branded Hibiscus Zobo bottles and Chapman dispensers for our reception.',
    status: 'Contacted',
    payment_status: 'Unpaid',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'enq-1002',
    customer_name: 'Dr. Chidi Okafor',
    phone: '+234 802 987 6543',
    email: 'chidi.okafor@corporategroup.ng',
    whatsapp: '+234 802 987 6543',
    event_type: 'corporate',
    product_category: 'small-chops',
    event_date: '2026-08-20',
    location: 'Ikeja GRA, Lagos',
    quantity: '80 Executives',
    budget: '₦1,200,000',
    message: 'Requested volume buyer installment plan for corporate quarterly catering spread across 3 milestones.',
    status: 'Quote Sent',
    payment_status: 'Partially Paid',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const initialOrders: Order[] = [
  {
    id: 'ord-5001',
    customer_id: 'cust-1',
    customer_name: 'Chief Lawson',
    customer_phone: '+234 805 555 1212',
    customer_email: 'lawson@holding.com',
    order_type: 'corporate_gifting',
    items_summary: '20x Chiama Royal VIP Celebration Hampers',
    delivery_date: '2026-08-25',
    delivery_location: 'Ikoyi, Lagos',
    quantity: '20 Hampers',
    budget: '₦1,300,000',
    product_subtotal: 1000000,
    service_charge: 200000, // 20%
    logistics_charge: 100000,
    total_amount: 1300000,
    total_payable: 1300000,
    status: 'Confirmed',
    payment_status: 'Verified',
    payment_requirement: 'FULL_PAYMENT',
    notes: 'Full payment verified via Access Bank transfer. Include gold ribbon packaging.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ord-5002',
    customer_id: 'cust-2',
    customer_name: 'Dr. Chidi Okafor (Corporate Catering)',
    customer_phone: '+234 802 987 6543',
    customer_email: 'chidi.okafor@corporategroup.ng',
    order_type: 'corporate',
    items_summary: '150x Fresh Juice Bottles & 15x Premium Chops Platters',
    delivery_date: '2026-08-28',
    delivery_location: 'Victoria Island, Lagos',
    quantity: '150 Persons',
    budget: '₦1,200,000',
    product_subtotal: 950000,
    service_charge: 190000, // 20%
    logistics_charge: 60000,
    total_amount: 1200000,
    total_payable: 1200000,
    status: 'Payment Verification',
    payment_status: 'Under Review',
    payment_requirement: 'FULL_PAYMENT',
    notes: 'Awaiting admin verification of full direct bank transfer before order confirmation.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialPlans: PaymentPlan[] = [];

const initialInstallments: Installment[] = [];

const initialSubmissions: PaymentSubmission[] = [
  {
    id: 'sub-3001',
    order_id: 'ord-5002',
    customer_name: 'Dr. Chidi Okafor',
    customer_phone: '+234 802 987 6543',
    payment_method: 'Bank Transfer',
    amount_expected: 1200000,
    amount_submitted: 1200000,
    payment_reference: 'ACC-TRF-991042',
    bank_name: 'Access Bank',
    payment_date: new Date().toISOString().split('T')[0],
    notes: 'Full payment transfer made from Access Bank app to Ama Chioma Gloria (0093177004).',
    status: 'Under Review',
    created_at: new Date().toISOString(),
  },
];

export async function ensureDatabaseSeeded(): Promise<void> {
  if (isSeeded) return;

  try {
    // Seed Business Settings if missing (without overwriting if already set by admin)
    const settingsRef = doc(db, 'business_settings', 'default');
    const settingsSnap = await getDoc(settingsRef).catch(() => null);
    if (!settingsSnap || !settingsSnap.exists()) {
      await setDoc(settingsRef, DEFAULT_BUSINESS_SETTINGS).catch(() => {});
    }

    // Check products
    const prodSnap = await getDocs(query(collection(db, 'products'), limit(1))).catch(() => null);
    if (!prodSnap || prodSnap.empty) {
      console.log('[Firestore] Initializing default products...');
      for (const p of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', p.id), p).catch(() => {});
      }
    }

    // Check categories
    const catSnap = await getDocs(query(collection(db, 'categories'), limit(1))).catch(() => null);
    if (!catSnap || catSnap.empty) {
      for (const c of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', c.id), c).catch(() => {});
      }
    }

    // Check gallery
    const galSnap = await getDocs(query(collection(db, 'gallery'), limit(1))).catch(() => null);
    if (!galSnap || galSnap.empty) {
      for (const g of INITIAL_GALLERY) {
        await setDoc(doc(db, 'gallery', g.id), g).catch(() => {});
      }
    }

    // Check faqs
    const faqSnap = await getDocs(query(collection(db, 'faqs'), limit(1))).catch(() => null);
    if (!faqSnap || faqSnap.empty) {
      for (const f of INITIAL_FAQS) {
        await setDoc(doc(db, 'faqs', f.id), f).catch(() => {});
      }
    }

    // Check orders
    const ordSnap = await getDocs(query(collection(db, 'orders'), limit(1))).catch(() => null);
    if (!ordSnap || ordSnap.empty) {
      for (const o of initialOrders) {
        await setDoc(doc(db, 'orders', o.id), o).catch(() => {});
      }
    }

    // Check enquiries
    const enqSnap = await getDocs(query(collection(db, 'enquiries'), limit(1))).catch(() => null);
    if (!enqSnap || enqSnap.empty) {
      for (const e of initialEnquiries) {
        await setDoc(doc(db, 'enquiries', e.id), e).catch(() => {});
      }
    }

    isSeeded = true;
  } catch (err) {
    console.error('[Firestore Seed Error]:', err);
    // Do not throw to avoid crashing app requests if seed check encounters a transient network issue
    isSeeded = true;
  }
}

// -------------------------------------------------------------
// FIRESTORE PERSISTENT DB OPERATIONS
// NO IN-MEMORY FALLBACK FOR TRANSACTIONAL BUSINESS RECORDS
// -------------------------------------------------------------

export async function getProducts(params?: { category?: string; featured?: boolean; search?: string; includeHidden?: boolean }): Promise<Product[]> {
  await ensureDatabaseSeeded();

  const snap = await getDocs(collection(db, 'products'));
  let list: Product[] = [];
  snap.forEach((d) => list.push(d.data() as Product));

  if (!params?.includeHidden) {
    list = list.filter((p) => p.availability !== 'HIDDEN');
  }

  if (params?.category) list = list.filter((p) => p.category === params.category);
  if (params?.featured) list = list.filter((p) => p.featured);
  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.ingredients && p.ingredients.some((i) => i.toLowerCase().includes(q)))
    );
  }
  return list;
}

export async function saveProduct(product: Product): Promise<Product> {
  await setDoc(doc(db, 'products', product.id), product);
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

export async function getCategories(): Promise<Category[]> {
  await ensureDatabaseSeeded();

  const snap = await getDocs(collection(db, 'categories'));
  const list: Category[] = [];
  snap.forEach((d) => list.push(d.data() as Category));

  for (const initCat of INITIAL_CATEGORIES) {
    if (!list.some((c) => c.slug === initCat.slug || c.id === initCat.id)) {
      list.push(initCat);
      setDoc(doc(db, 'categories', initCat.id), initCat).catch(() => {});
    }
  }
  return list;
}

export async function getEnquiries(): Promise<Enquiry[]> {
  await ensureDatabaseSeeded();

  const snap = await getDocs(collection(db, 'enquiries'));
  const list: Enquiry[] = [];
  snap.forEach((d) => list.push(d.data() as Enquiry));
  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function saveEnquiry(enquiry: Enquiry): Promise<Enquiry> {
  await setDoc(doc(db, 'enquiries', enquiry.id), enquiry);
  return enquiry;
}

export async function getOrders(): Promise<Order[]> {
  await ensureDatabaseSeeded();

  const snap = await getDocs(collection(db, 'orders'));
  const list: Order[] = [];
  snap.forEach((d) => list.push(d.data() as Order));
  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function saveOrder(order: Order): Promise<Order> {
  await setDoc(doc(db, 'orders', order.id), order);
  return order;
}

export async function getGallery(): Promise<GalleryItem[]> {
  await ensureDatabaseSeeded();

  const snap = await getDocs(collection(db, 'gallery'));
  const list: GalleryItem[] = [];
  snap.forEach((d) => list.push(d.data() as GalleryItem));
  return list;
}

export async function getFAQs(): Promise<FAQItem[]> {
  await ensureDatabaseSeeded();

  const snap = await getDocs(collection(db, 'faqs'));
  const list: FAQItem[] = [];
  snap.forEach((d) => list.push(d.data() as FAQItem));
  return list;
}

export async function getPaymentPlans(): Promise<PaymentPlan[]> {
  await ensureDatabaseSeeded();

  const snap = await getDocs(collection(db, 'payment_plans'));
  const list: PaymentPlan[] = [];
  snap.forEach((d) => list.push(d.data() as PaymentPlan));
  return list;
}

export async function savePaymentPlan(plan: PaymentPlan): Promise<PaymentPlan> {
  await setDoc(doc(db, 'payment_plans', plan.id), plan);
  return plan;
}

export async function getInstallments(): Promise<Installment[]> {
  await ensureDatabaseSeeded();

  const snap = await getDocs(collection(db, 'installments'));
  const list: Installment[] = [];
  snap.forEach((d) => list.push(d.data() as Installment));
  return list;
}

export async function saveInstallment(installment: Installment): Promise<Installment> {
  await setDoc(doc(db, 'installments', installment.id), installment);
  return installment;
}

export async function getPaymentSubmissions(): Promise<PaymentSubmission[]> {
  await ensureDatabaseSeeded();

  const snap = await getDocs(collection(db, 'payment_submissions'));
  const list: PaymentSubmission[] = [];
  snap.forEach((d) => list.push(d.data() as PaymentSubmission));
  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function savePaymentSubmission(sub: PaymentSubmission): Promise<PaymentSubmission> {
  await setDoc(doc(db, 'payment_submissions', sub.id), sub);
  return sub;
}

export async function getAuditLogs(): Promise<PaymentAuditLog[]> {
  await ensureDatabaseSeeded();

  const snap = await getDocs(collection(db, 'audit_logs'));
  const list: PaymentAuditLog[] = [];
  snap.forEach((d) => list.push(d.data() as PaymentAuditLog));
  return list.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function saveAuditLog(log: PaymentAuditLog): Promise<PaymentAuditLog> {
  await setDoc(doc(db, 'audit_logs', log.id), log);
  return log;
}

export async function getNotifications(): Promise<CustomerNotification[]> {
  await ensureDatabaseSeeded();

  const snap = await getDocs(collection(db, 'notifications'));
  const list: CustomerNotification[] = [];
  snap.forEach((d) => list.push(d.data() as CustomerNotification));
  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function saveNotification(notif: CustomerNotification): Promise<CustomerNotification> {
  await setDoc(doc(db, 'notifications', notif.id), notif);
  return notif;
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  await ensureDatabaseSeeded();

  const docRef = doc(db, 'business_settings', 'default');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as BusinessSettings;
  }
  return { ...DEFAULT_BUSINESS_SETTINGS };
}

export async function saveBusinessSettings(settings: BusinessSettings): Promise<BusinessSettings> {
  await setDoc(doc(db, 'business_settings', 'default'), settings);
  return { ...settings };
}
