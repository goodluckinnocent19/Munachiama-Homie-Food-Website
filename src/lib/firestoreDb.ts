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

export async function uploadStorageImage(file: File): Promise<string> {
  const filename = `products/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storageRef = ref(storage, filename);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
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
    total_amount: 1300000,
    status: 'Confirmed',
    payment_status: 'Verified',
    notes: 'Full payment verified via Access Bank transfer. Include gold ribbon packaging.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ord-5002',
    customer_id: 'cust-2',
    customer_name: 'Dr. Chidi Okafor (Corporate Volume)',
    customer_phone: '+234 802 987 6543',
    customer_email: 'chidi.okafor@corporategroup.ng',
    order_type: 'corporate',
    items_summary: '150x Fresh Juice Bottles & 15x Premium Chops Platters',
    delivery_date: '2026-08-28',
    delivery_location: 'Victoria Island, Lagos',
    quantity: '150 Persons',
    budget: '₦1,200,000',
    total_amount: 1200000,
    status: 'Awaiting Payment',
    payment_status: 'Partially Paid',
    payment_plan_id: 'plan-1002',
    notes: 'Approved Volume Buyer 3-Part Installment Plan.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialPlans: PaymentPlan[] = [
  {
    id: 'plan-1002',
    order_id: 'ord-5002',
    customer_name: 'Dr. Chidi Okafor',
    customer_phone: '+234 802 987 6543',
    customer_email: 'chidi.okafor@corporategroup.ng',
    plan_type: 'Volume Installment',
    total_amount: 1200000,
    number_of_installments: 3,
    status: 'Active',
    approved_by: 'ChiamaAdmin',
    approved_at: new Date(Date.now() - 86400000).toISOString(),
    notes: '3 Equal Installments of ₦400,000 per milestone.',
    payment_instructions: 'Pay into Access Bank Account: Ama Chioma Gloria (0093177004). Quote Order ID ord-5002.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialInstallments: Installment[] = [
  {
    id: 'inst-1002-1',
    payment_plan_id: 'plan-1002',
    order_id: 'ord-5002',
    installment_number: 1,
    amount: 400000,
    due_date: '2026-08-10',
    payment_status: 'Verified',
    paid_at: new Date(Date.now() - 86400000).toISOString(),
    payment_reference: 'ACC-TRF-982144',
    verified_by: 'ChiamaAdmin',
    verification_date: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Initial 33% deposit verified.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inst-1002-2',
    payment_plan_id: 'plan-1002',
    order_id: 'ord-5002',
    installment_number: 2,
    amount: 400000,
    due_date: '2026-08-20',
    payment_status: 'Under Review',
    payment_reference: 'ACC-TRF-991042',
    notes: 'Customer submitted transfer reference for second milestone.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inst-1002-3',
    payment_plan_id: 'plan-1002',
    order_id: 'ord-5002',
    installment_number: 3,
    amount: 400000,
    due_date: '2026-08-27',
    payment_status: 'Pending',
    notes: 'Final installment prior to event delivery.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialSubmissions: PaymentSubmission[] = [
  {
    id: 'sub-3001',
    order_id: 'ord-5002',
    installment_id: 'inst-1002-2',
    payment_plan_id: 'plan-1002',
    customer_name: 'Dr. Chidi Okafor',
    customer_phone: '+234 802 987 6543',
    payment_method: 'Bank Transfer',
    amount_expected: 400000,
    amount_submitted: 400000,
    payment_reference: 'ACC-TRF-991042',
    bank_name: 'Access Bank',
    payment_date: new Date().toISOString().split('T')[0],
    notes: 'Transfer made from Access Bank app to Ama Chioma Gloria (0093177004).',
    status: 'Under Review',
    created_at: new Date().toISOString(),
  },
];

export async function ensureDatabaseSeeded(): Promise<void> {
  if (isSeeded) return;

  try {
    const prodSnap = await getDocs(query(collection(db, 'products'), limit(1)));
    if (prodSnap.empty) {
      console.log('[Firestore] Empty database detected. Seeding initial records to Firestore...');
      for (const p of INITIAL_PRODUCTS) await setDoc(doc(db, 'products', p.id), p);
      for (const c of INITIAL_CATEGORIES) await setDoc(doc(db, 'categories', c.id), c);
      for (const g of INITIAL_GALLERY) await setDoc(doc(db, 'gallery', g.id), g);
      for (const f of INITIAL_FAQS) await setDoc(doc(db, 'faqs', f.id), f);
      await setDoc(doc(db, 'business_settings', 'default'), DEFAULT_BUSINESS_SETTINGS);
      for (const e of initialEnquiries) await setDoc(doc(db, 'enquiries', e.id), e);
      for (const o of initialOrders) await setDoc(doc(db, 'orders', o.id), o);
      for (const p of initialPlans) await setDoc(doc(db, 'payment_plans', p.id), p);
      for (const inst of initialInstallments) await setDoc(doc(db, 'installments', inst.id), inst);
      for (const s of initialSubmissions) await setDoc(doc(db, 'payment_submissions', s.id), s);
      console.log('[Firestore] Database initial seeding completed successfully.');
    }
    isSeeded = true;
  } catch (err) {
    console.error('[Firestore Seed Error]:', err);
    throw err;
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
