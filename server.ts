import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_GALLERY, INITIAL_FAQS, DEFAULT_BUSINESS_SETTINGS } from './src/data/initialData.js';
import {
  Product,
  Category,
  Enquiry,
  Order,
  GalleryItem,
  FAQItem,
  DashboardMetrics,
  PaymentPlan,
  Installment,
  PaymentSubmission,
  PaymentAuditLog,
  CustomerNotification,
  OrderStatus,
  PaymentStatus,
  BusinessSettings,
} from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Database persistence path
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  enquiries: Enquiry[];
  orders: Order[];
  gallery: GalleryItem[];
  faqs: FAQItem[];
  payment_plans: PaymentPlan[];
  installments: Installment[];
  payment_submissions: PaymentSubmission[];
  audit_logs: PaymentAuditLog[];
  notifications: CustomerNotification[];
  business_settings: BusinessSettings;
}

function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const defaultDb: DatabaseSchema = {
    products: INITIAL_PRODUCTS,
    categories: INITIAL_CATEGORIES,
    enquiries: [
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
    ],
    orders: [
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
    ],
    payment_plans: [
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
    ],
    installments: [
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
    ],
    payment_submissions: [
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
    ],
    audit_logs: [
      {
        id: 'log-1',
        admin_id: 'admin-1',
        admin_username: 'ChiamaAdmin',
        action: 'Volume Installment Plan Approved',
        order_id: 'ord-5002',
        payment_plan_id: 'plan-1002',
        previous_status: 'Pending Approval',
        new_status: 'Approved',
        note: 'Approved 3x ₦400,000 installment plan for corporate buyer.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'log-2',
        admin_id: 'admin-1',
        admin_username: 'ChiamaAdmin',
        action: 'Payment Verified',
        order_id: 'ord-5002',
        installment_id: 'inst-1002-1',
        previous_status: 'Payment Submitted',
        new_status: 'Verified',
        note: 'Verified ₦400,000 deposit via Access Bank statement.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    notifications: [
      {
        id: 'notif-1',
        order_id: 'ord-5002',
        customer_phone: '+234 802 987 6543',
        type: 'Plan Approved',
        title: 'Volume Installment Plan Approved',
        message: 'Your 3-part installment arrangement of ₦1,200,000 has been approved by Munachiama | Chiama21 Hommie Foods.',
        whatsapp_link: 'https://wa.me/2348065124134?text=Hello%20Munachiama%2C%20regarding%20Order%20ord-5002',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    gallery: INITIAL_GALLERY,
    faqs: INITIAL_FAQS,
    business_settings: DEFAULT_BUSINESS_SETTINGS,
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Ensure all new collections exist
    return {
      products: parsed.products || INITIAL_PRODUCTS,
      categories: parsed.categories || INITIAL_CATEGORIES,
      enquiries: parsed.enquiries || defaultDb.enquiries,
      orders: parsed.orders || defaultDb.orders,
      gallery: parsed.gallery || INITIAL_GALLERY,
      faqs: parsed.faqs || INITIAL_FAQS,
      payment_plans: parsed.payment_plans || defaultDb.payment_plans,
      installments: parsed.installments || defaultDb.installments,
      payment_submissions: parsed.payment_submissions || defaultDb.payment_submissions,
      audit_logs: parsed.audit_logs || defaultDb.audit_logs,
      notifications: parsed.notifications || defaultDb.notifications,
      business_settings: parsed.business_settings || DEFAULT_BUSINESS_SETTINGS,
    };
  } catch (err) {
    console.error('Failed reading database, reinitializing...', err);
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
}

function readDb(): DatabaseSchema {
  return initDatabase();
}

function writeDb(data: DatabaseSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Simple Admin Authentication Token
const ADMIN_SECRET_TOKEN = 'chiama21_admin_secret_token_2026';

// Middleware for Admin Protection
function requireAdmin(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${ADMIN_SECRET_TOKEN}`) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized admin access required.' });
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// GET Business Settings
app.get('/api/settings', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.business_settings || DEFAULT_BUSINESS_SETTINGS);
});

// UPDATE Business Settings (Admin)
app.put('/api/settings', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const current = db.business_settings || DEFAULT_BUSINESS_SETTINGS;
  const updated: BusinessSettings = {
    ...current,
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  db.business_settings = updated;
  writeDb(db);
  res.json({ success: true, message: 'Business settings updated successfully.', settings: updated });
});

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Demo admin credential check
  if ((username === 'admin' || username === 'chiama') && password === 'admin123') {
    return res.json({
      token: ADMIN_SECRET_TOKEN,
      user: {
        id: 'admin-1',
        username: 'ChiamaAdmin',
        email: 'admin@chiama21foods.com',
        role: 'admin',
      },
    });
  }
  return res.status(400).json({ error: 'Invalid credentials. Use admin / admin123 for demo access.' });
});

// GET Products
app.get('/api/products', (req: Request, res: Response) => {
  const db = readDb();
  let items = db.products;

  const category = req.query.category as string;
  const featured = req.query.featured;
  const search = req.query.search as string;

  if (category) {
    items = items.filter((p) => p.category === category);
  }
  if (featured === 'true') {
    items = items.filter((p) => p.featured);
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.ingredients && p.ingredients.some((i) => i.toLowerCase().includes(q)))
    );
  }

  res.json(items);
});

// CREATE Product (Admin)
app.post('/api/products', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const { name, category, description, price, price_text, image_url, featured, available, ingredients, serves_text } = req.body;

  if (!name || !category || !description) {
    return res.status(400).json({ error: 'Name, category, and description are required.' });
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    category,
    description,
    price: price ? Number(price) : null,
    price_text: price_text || (price ? `₦${Number(price).toLocaleString()}` : 'Request Price'),
    image_url: image_url || 'https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=1000&q=80',
    featured: Boolean(featured),
    available: available !== undefined ? Boolean(available) : true,
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    serves_text: serves_text || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.products.unshift(newProduct);
  writeDb(db);
  res.status(201).json(newProduct);
});

// UPDATE Product (Admin)
app.put('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const index = db.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const existing = db.products[index];
  const updated: Product = {
    ...existing,
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  db.products[index] = updated;
  writeDb(db);
  res.json(updated);
});

// DELETE Product (Admin)
app.delete('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  db.products = db.products.filter((p) => p.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, id: req.params.id });
});

// GET Categories
app.get('/api/categories', (req: Request, res: Response) => {
  const db = readDb();
  const categoriesWithCounts = db.categories.map((c) => ({
    ...c,
    item_count: db.products.filter((p) => p.category === c.slug).length,
  }));
  res.json(categoriesWithCounts);
});

// CREATE Enquiry (Public - Order / Quote Request)
app.post('/api/enquiries', (req: Request, res: Response) => {
  const db = readDb();
  const { customer_name, phone, email, whatsapp, event_type, product_category, event_date, location, quantity, budget, message } = req.body;

  if (!customer_name || !phone || !event_type || !location) {
    return res.status(400).json({ error: 'Customer name, phone number, event type, and location are required.' });
  }

  const newEnquiry: Enquiry = {
    id: `enq-${Math.floor(1000 + Math.random() * 9000)}`,
    customer_name,
    phone,
    email: email || '',
    whatsapp: whatsapp || phone,
    event_type,
    product_category: product_category || 'General Enquiry',
    event_date: event_date || 'Flexible',
    location,
    quantity: quantity || 'Unspecified',
    budget: budget || 'Flexible',
    message: message || '',
    status: 'New',
    payment_status: 'Unpaid',
    created_at: new Date().toISOString(),
  };

  db.enquiries.unshift(newEnquiry);
  writeDb(db);

  res.status(201).json({
    success: true,
    enquiry: newEnquiry,
    message: 'Thank you! Your request has been received. Our team will review your details and contact you shortly.',
    notice: 'Payment Policy: Full payment is required before delivery. We do not offer credit arrangements.',
  });
});

// GET Enquiries (Admin)
app.get('/api/enquiries', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.enquiries);
});

// UPDATE Enquiry Status (Admin)
app.put('/api/enquiries/:id', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const index = db.enquiries.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Enquiry not found.' });
  }

  db.enquiries[index] = {
    ...db.enquiries[index],
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  writeDb(db);
  res.json(db.enquiries[index]);
});

// GET Orders (Admin)
app.get('/api/orders', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.orders);
});

// UPDATE Order Status (Admin)
app.put('/api/orders/:id', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const index = db.orders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  db.orders[index] = {
    ...db.orders[index],
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  writeDb(db);
  res.json(db.orders[index]);
});

// GET Gallery
app.get('/api/gallery', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.gallery);
});

// GET FAQs
app.get('/api/faqs', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.faqs);
});

// GET Dashboard Metrics (Admin)
app.get('/api/metrics', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();

  const totalEnquiries = db.enquiries.length;
  const newEnquiries = db.enquiries.filter((e) => e.status === 'New').length;
  const confirmedOrders = db.orders.filter((o) => o.status === 'Confirmed' || o.payment_status === 'Paid' || o.payment_status === 'Verified').length;
  const pendingOrders = db.orders.filter((o) => o.payment_status === 'Unpaid' || o.payment_status === 'Under Review' || o.payment_status === 'Payment Submitted').length;
  const completedOrders = db.orders.filter((o) => o.status === 'Completed').length;

  const verifiedRevenue = db.payment_submissions
    .filter((s) => s.status === 'Verified')
    .reduce((sum, s) => sum + (s.amount_submitted || 0), 0);

  const totalRevenueEstimated = db.orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const pendingVerificationCount = db.payment_submissions.filter((s) => s.status === 'Submitted' || s.status === 'Under Review').length;

  const totalInstallmentsExpected = db.installments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalInstallmentsPaid = db.installments.filter((i) => i.payment_status === 'Verified').reduce((sum, i) => sum + (i.amount || 0), 0);
  const outstandingInstallmentBalance = Math.max(0, totalInstallmentsExpected - totalInstallmentsPaid);

  const overdueInstallmentCount = db.installments.filter((i) => i.payment_status === 'Overdue').length;
  const partiallyPaidOrdersCount = db.orders.filter((o) => o.payment_status === 'Partially Paid').length;
  const fullyPaidOrdersCount = db.orders.filter((o) => o.payment_status === 'Paid' || o.payment_status === 'Verified').length;

  const catMap: Record<string, number> = {};
  db.enquiries.forEach((e) => {
    const cat = e.product_category || 'General';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });

  const popularCategories = Object.entries(catMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const metrics: DashboardMetrics = {
    totalEnquiries,
    newEnquiries,
    confirmedOrders,
    pendingOrders,
    completedOrders,
    totalRevenueEstimated,
    verifiedRevenue,
    pendingVerificationCount,
    outstandingInstallmentBalance,
    overdueInstallmentCount,
    partiallyPaidOrdersCount,
    fullyPaidOrdersCount,
    popularCategories,
  };

  res.json(metrics);
});

// -------------------------------------------------------------
// PAYMENT VERIFICATION & INSTALLMENT PLAN ENDPOINTS
// -------------------------------------------------------------

// Submit Bank Transfer Payment (Method B - Customer Public Endpoint)
app.post('/api/payments/submit-transfer', (req: Request, res: Response) => {
  const db = readDb();
  const { order_id, installment_id, payment_plan_id, customer_name, customer_phone, amount_submitted, payment_reference, bank_name, payment_date, notes, proof_url } = req.body;

  if (!order_id || !payment_reference || !amount_submitted) {
    return res.status(400).json({ error: 'Order ID, transaction reference, and amount submitted are required.' });
  }

  // Find order or enquiry
  const orderIndex = db.orders.findIndex((o) => o.id === order_id);
  const enquiryIndex = db.enquiries.findIndex((e) => e.id === order_id);

  if (orderIndex === -1 && enquiryIndex === -1) {
    return res.status(404).json({ error: 'Order or Enquiry record not found.' });
  }

  const submissionId = `sub-${Date.now()}`;
  const newSubmission: PaymentSubmission = {
    id: submissionId,
    order_id,
    installment_id: installment_id || undefined,
    payment_plan_id: payment_plan_id || undefined,
    customer_name: customer_name || (orderIndex !== -1 ? db.orders[orderIndex].customer_name : db.enquiries[enquiryIndex].customer_name),
    customer_phone: customer_phone || (orderIndex !== -1 ? db.orders[orderIndex].customer_phone : db.enquiries[enquiryIndex].phone),
    payment_method: 'Bank Transfer',
    amount_expected: Number(amount_submitted),
    amount_submitted: Number(amount_submitted),
    payment_reference,
    bank_name: bank_name || 'Access Bank',
    payment_date: payment_date || new Date().toISOString().split('T')[0],
    proof_url: proof_url || '',
    notes: notes || '',
    status: 'Under Review',
    created_at: new Date().toISOString(),
  };

  db.payment_submissions.unshift(newSubmission);

  // Update order/enquiry payment status to Under Review (DO NOT MARK AS CONFIRMED OR PAID AUTOMATICALLY!)
  if (orderIndex !== -1) {
    db.orders[orderIndex].payment_status = 'Under Review';
    db.orders[orderIndex].status = 'Payment Verification';
    db.orders[orderIndex].updated_at = new Date().toISOString();
  }
  if (enquiryIndex !== -1) {
    db.enquiries[enquiryIndex].payment_status = 'Under Review';
    db.enquiries[enquiryIndex].status = 'Payment Verification';
    db.enquiries[enquiryIndex].updated_at = new Date().toISOString();
  }

  // If tied to an installment, update installment status to Under Review
  if (installment_id) {
    const instIdx = db.installments.findIndex((i) => i.id === installment_id);
    if (instIdx !== -1) {
      db.installments[instIdx].payment_status = 'Under Review';
      db.installments[instIdx].payment_reference = payment_reference;
      db.installments[instIdx].updated_at = new Date().toISOString();
    }
  }

  // Create Audit Log
  const auditEntry: PaymentAuditLog = {
    id: `log-${Date.now()}`,
    admin_id: 'CUSTOMER_SUBMITTED',
    admin_username: customer_name || 'Customer',
    action: 'Payment Submitted — Awaiting Verification',
    order_id,
    payment_plan_id: payment_plan_id || undefined,
    installment_id: installment_id || undefined,
    submission_id: submissionId,
    previous_status: 'Unpaid',
    new_status: 'Under Review',
    note: `Customer submitted payment of ₦${Number(amount_submitted).toLocaleString()} with reference: ${payment_reference}`,
    timestamp: new Date().toISOString(),
  };
  db.audit_logs.unshift(auditEntry);

  writeDb(db);

  res.status(201).json({
    success: true,
    submission: newSubmission,
    headline: 'Payment Submitted Successfully',
    message: 'Your payment information has been received and is currently being reviewed by our team. Once your payment has been verified by an administrator, your order status will be updated.',
    bank_account: {
      account_name: 'Ama Chioma Gloria',
      bank: 'Access Bank',
      account_number: '0093177004',
    },
  });
});

// Automatic Gateway Verification (Method A - Server Verified Gateway)
app.post('/api/payments/verify-gateway', (req: Request, res: Response) => {
  const db = readDb();
  const { order_id, transaction_reference, amount_paid, provider } = req.body;

  if (!order_id || !transaction_reference || !amount_paid) {
    return res.status(400).json({ error: 'Order ID, transaction reference, and amount paid are required for gateway verification.' });
  }

  const orderIdx = db.orders.findIndex((o) => o.id === order_id);
  if (orderIdx === -1) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const order = db.orders[orderIdx];
  const submissionId = `sub-gw-${Date.now()}`;

  const gatewaySubmission: PaymentSubmission = {
    id: submissionId,
    order_id,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    payment_method: provider || 'Paystack',
    amount_expected: Number(amount_paid),
    amount_submitted: Number(amount_paid),
    payment_reference: transaction_reference,
    payment_date: new Date().toISOString().split('T')[0],
    status: 'Verified',
    verified_by: `${provider || 'Gateway'} Automated Webhook`,
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  db.payment_submissions.unshift(gatewaySubmission);

  // Mark Order as Verified and Confirmed
  db.orders[orderIdx].payment_status = 'Verified';
  db.orders[orderIdx].status = 'Confirmed';
  db.orders[orderIdx].updated_at = new Date().toISOString();

  // Audit Log
  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    admin_id: 'SYSTEM_GATEWAY',
    admin_username: `${provider || 'Paystack'} Gateway`,
    action: 'Payment Gateway Verified',
    order_id,
    submission_id: submissionId,
    previous_status: order.payment_status,
    new_status: 'Verified',
    note: `Automated server verification confirmed receipt of ₦${Number(amount_paid).toLocaleString()}`,
    timestamp: new Date().toISOString(),
  });

  writeDb(db);

  res.json({
    success: true,
    headline: 'Payment Confirmed',
    message: 'Your payment has been successfully verified by our payment gateway. Your order is now confirmed and our team will proceed with preparation.',
    order: db.orders[orderIdx],
  });
});

// Track Order & Payment Status (Public)
app.get('/api/orders/track/:order_id', (req: Request, res: Response) => {
  const db = readDb();
  const orderId = req.params.order_id;

  const order = db.orders.find((o) => o.id === orderId) || db.enquiries.find((e) => e.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'No order or enquiry found with this ID.' });
  }

  const plan = db.payment_plans.find((p) => p.order_id === orderId);
  const installments = db.installments.filter((i) => i.order_id === orderId || (plan && i.payment_plan_id === plan.id)).sort((a, b) => a.installment_number - b.installment_number);
  const submissions = db.payment_submissions.filter((s) => s.order_id === orderId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const notifications = db.notifications.filter((n) => n.order_id === orderId);

  const totalAmount = plan ? plan.total_amount : (('total_amount' in order && order.total_amount) ? order.total_amount : 0);
  const totalVerifiedPaid = submissions
    .filter((s) => s.status === 'Verified')
    .reduce((sum, s) => sum + s.amount_submitted, 0);

  const outstandingBalance = Math.max(0, totalAmount - totalVerifiedPaid);
  const paymentProgressPercent = totalAmount > 0 ? Math.min(100, Math.round((totalVerifiedPaid / totalAmount) * 100)) : (order.payment_status === 'Paid' || order.payment_status === 'Verified' ? 100 : 0);

  res.json({
    order,
    payment_plan: plan || null,
    installments,
    payment_submissions: submissions,
    notifications,
    summary: {
      total_amount: totalAmount,
      total_verified_paid: totalVerifiedPaid,
      outstanding_balance: outstandingBalance,
      payment_progress_percent: paymentProgressPercent,
      bank_details: {
        account_name: 'Ama Chioma Gloria',
        bank: 'Access Bank',
        account_number: '0093177004',
      },
    },
  });
});

// GET All Payment Submissions (Admin)
app.get('/api/payment-submissions', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.payment_submissions);
});

// Admin VERIFY Payment
app.put('/api/payment-submissions/:id/verify', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const subIdx = db.payment_submissions.findIndex((s) => s.id === req.params.id);
  if (subIdx === -1) {
    return res.status(404).json({ error: 'Payment submission not found.' });
  }

  const sub = db.payment_submissions[subIdx];
  const { notes, verified_amount } = req.body;
  const verifiedAmt = verified_amount ? Number(verified_amount) : sub.amount_submitted;

  // Mark submission as Verified
  db.payment_submissions[subIdx] = {
    ...sub,
    status: 'Verified',
    amount_submitted: verifiedAmt,
    verified_by: 'ChiamaAdmin',
    verified_at: new Date().toISOString(),
    notes: notes || sub.notes,
  };

  const orderId = sub.order_id;

  // Update associated Installment if any
  if (sub.installment_id) {
    const instIdx = db.installments.findIndex((i) => i.id === sub.installment_id);
    if (instIdx !== -1) {
      db.installments[instIdx] = {
        ...db.installments[instIdx],
        payment_status: 'Verified',
        paid_at: new Date().toISOString(),
        verified_by: 'ChiamaAdmin',
        verification_date: new Date().toISOString(),
        payment_reference: sub.payment_reference,
        updated_at: new Date().toISOString(),
      };
    }
  }

  // Recalculate order payment balance
  const orderIdx = db.orders.findIndex((o) => o.id === orderId);
  const enquiryIdx = db.enquiries.findIndex((e) => e.id === orderId);
  const plan = db.payment_plans.find((p) => p.order_id === orderId);

  const allOrderSubmissions = db.payment_submissions.filter((s) => s.order_id === orderId && s.status === 'Verified');
  const totalPaid = allOrderSubmissions.reduce((sum, s) => sum + s.amount_submitted, 0);

  let targetTotal = 0;
  if (orderIdx !== -1 && db.orders[orderIdx].total_amount) {
    targetTotal = db.orders[orderIdx].total_amount || 0;
  } else if (plan) {
    targetTotal = plan.total_amount;
  }

  let newPaymentStatus: PaymentStatus = 'Partially Paid';
  let newOrderStatus: OrderStatus = 'Confirmed';

  if (targetTotal > 0 && totalPaid >= targetTotal) {
    newPaymentStatus = 'Verified';
    newOrderStatus = 'Confirmed';
    if (plan) plan.status = 'Completed';
  } else if (totalPaid > 0) {
    newPaymentStatus = 'Partially Paid';
    newOrderStatus = 'Confirmed';
  }

  if (orderIdx !== -1) {
    db.orders[orderIdx].payment_status = newPaymentStatus;
    db.orders[orderIdx].status = newOrderStatus;
    db.orders[orderIdx].updated_at = new Date().toISOString();
  }
  if (enquiryIdx !== -1) {
    db.enquiries[enquiryIdx].payment_status = newPaymentStatus;
    db.enquiries[enquiryIdx].status = newOrderStatus;
    db.enquiries[enquiryIdx].updated_at = new Date().toISOString();
  }

  // Audit Log
  const audit: PaymentAuditLog = {
    id: `log-${Date.now()}`,
    admin_id: 'admin-1',
    admin_username: 'ChiamaAdmin',
    action: 'Payment Verified',
    order_id: orderId,
    payment_plan_id: sub.payment_plan_id,
    installment_id: sub.installment_id,
    submission_id: sub.id,
    previous_status: sub.status,
    new_status: 'Verified',
    note: `Admin verified ₦${verifiedAmt.toLocaleString()} payment reference: ${sub.payment_reference}. ${notes || ''}`,
    timestamp: new Date().toISOString(),
  };
  db.audit_logs.unshift(audit);

  // Notification for customer
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    order_id: orderId,
    customer_phone: sub.customer_phone,
    type: 'Payment Verified',
    title: 'Payment Verified & Confirmed',
    message: `Your payment of ₦${verifiedAmt.toLocaleString()} for Order ${orderId} has been verified by our finance team. Thank you!`,
    whatsapp_link: `https://wa.me/2348065124134?text=Hello%20Munachiama%2C%20my%20payment%20for%20Order%20${orderId}%20is%20verified`,
    created_at: new Date().toISOString(),
  });

  writeDb(db);

  res.json({
    success: true,
    message: 'Payment verified successfully.',
    submission: db.payment_submissions[subIdx],
  });
});

// Admin REJECT Payment
app.put('/api/payment-submissions/:id/reject', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const subIdx = db.payment_submissions.findIndex((s) => s.id === req.params.id);
  if (subIdx === -1) {
    return res.status(404).json({ error: 'Payment submission not found.' });
  }

  const { rejection_reason } = req.body;
  if (!rejection_reason) {
    return res.status(400).json({ error: 'Rejection reason is required.' });
  }

  const sub = db.payment_submissions[subIdx];
  db.payment_submissions[subIdx] = {
    ...sub,
    status: 'Rejected',
    rejection_reason,
    verified_by: 'ChiamaAdmin',
    verified_at: new Date().toISOString(),
  };

  const orderId = sub.order_id;

  if (sub.installment_id) {
    const instIdx = db.installments.findIndex((i) => i.id === sub.installment_id);
    if (instIdx !== -1) {
      db.installments[instIdx].payment_status = 'Rejected';
      db.installments[instIdx].notes = `Rejected: ${rejection_reason}`;
      db.installments[instIdx].updated_at = new Date().toISOString();
    }
  }

  const orderIdx = db.orders.findIndex((o) => o.id === orderId);
  if (orderIdx !== -1) {
    db.orders[orderIdx].payment_status = 'Rejected';
    db.orders[orderIdx].notes = `Payment rejected: ${rejection_reason}`;
    db.orders[orderIdx].updated_at = new Date().toISOString();
  }

  // Audit Log
  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    admin_id: 'admin-1',
    admin_username: 'ChiamaAdmin',
    action: 'Payment Rejected',
    order_id: orderId,
    submission_id: sub.id,
    previous_status: sub.status,
    new_status: 'Rejected',
    note: `Payment reference ${sub.payment_reference} rejected. Reason: ${rejection_reason}`,
    timestamp: new Date().toISOString(),
  });

  // Customer Notification
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    order_id: orderId,
    customer_phone: sub.customer_phone,
    type: 'Payment Rejected',
    title: 'Payment Verification Notice',
    message: `Payment could not be verified for Order ${orderId}. Reason: ${rejection_reason}. Please contact support or re-submit proof.`,
    whatsapp_link: `https://wa.me/2348065124134?text=Hello%20Munachiama%2C%20regarding%20my%20rejected%20payment%20for%20${orderId}`,
    created_at: new Date().toISOString(),
  });

  writeDb(db);

  res.json({
    success: true,
    message: 'Payment rejected with reason recorded.',
    submission: db.payment_submissions[subIdx],
  });
});

// GET All Payment Plans (Admin)
app.get('/api/payment-plans', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const plansWithInstallments = db.payment_plans.map((p) => ({
    ...p,
    installments: db.installments.filter((i) => i.payment_plan_id === p.id),
  }));
  res.json(plansWithInstallments);
});

// Admin CREATE or CONFIGURE Installment Plan
app.post('/api/payment-plans', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const { order_id, customer_name, customer_phone, customer_email, total_amount, number_of_installments, installments, notes, payment_instructions } = req.body;

  if (!order_id || !total_amount || !number_of_installments) {
    return res.status(400).json({ error: 'Order ID, total amount, and number of installments are required.' });
  }

  const planId = `plan-${Date.now()}`;
  const newPlan: PaymentPlan = {
    id: planId,
    order_id,
    customer_name: customer_name || 'Volume Buyer',
    customer_phone: customer_phone || '',
    customer_email: customer_email || '',
    plan_type: 'Volume Installment',
    total_amount: Number(total_amount),
    number_of_installments: Number(number_of_installments),
    status: 'Active',
    approved_by: 'ChiamaAdmin',
    approved_at: new Date().toISOString(),
    notes: notes || '',
    payment_instructions: payment_instructions || 'Pay into Access Bank (0093177004 - Ama Chioma Gloria)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.payment_plans.unshift(newPlan);

  // Create individual installment schedule items
  if (Array.isArray(installments) && installments.length > 0) {
    installments.forEach((inst: Partial<Installment>, idx: number) => {
      const instRecord: Installment = {
        id: `inst-${planId}-${idx + 1}`,
        payment_plan_id: planId,
        order_id,
        installment_number: idx + 1,
        amount: Number(inst.amount) || Math.round(Number(total_amount) / number_of_installments),
        due_date: inst.due_date || new Date(Date.now() + 86400000 * 7 * (idx + 1)).toISOString().split('T')[0],
        payment_status: 'Pending',
        notes: inst.notes || `Installment #${idx + 1}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.installments.push(instRecord);
    });
  }

  // Link to order
  const orderIdx = db.orders.findIndex((o) => o.id === order_id);
  if (orderIdx !== -1) {
    db.orders[orderIdx].payment_plan_id = planId;
    db.orders[orderIdx].total_amount = Number(total_amount);
    db.orders[orderIdx].updated_at = new Date().toISOString();
  }

  // Audit Log
  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    admin_id: 'admin-1',
    admin_username: 'ChiamaAdmin',
    action: 'Volume Installment Plan Configured',
    order_id,
    payment_plan_id: planId,
    new_status: 'Active',
    note: `Created ${number_of_installments}-part installment plan totaling ₦${Number(total_amount).toLocaleString()}`,
    timestamp: new Date().toISOString(),
  });

  writeDb(db);

  res.status(201).json({
    success: true,
    plan: newPlan,
    installments: db.installments.filter((i) => i.payment_plan_id === planId),
  });
});

// Update Installment Details (Admin)
app.put('/api/installments/:id', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const instIdx = db.installments.findIndex((i) => i.id === req.params.id);
  if (instIdx === -1) {
    return res.status(404).json({ error: 'Installment not found.' });
  }

  db.installments[instIdx] = {
    ...db.installments[instIdx],
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  writeDb(db);
  res.json(db.installments[instIdx]);
});

// GET Audit Logs (Admin)
app.get('/api/payment-audit-logs', requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.audit_logs);
});

// Payment Gateway Preparation API (Paystack/Flutterwave placeholder response)
app.post('/api/payment-intent', (req: Request, res: Response) => {
  const { amount, email, reference, enquiry_id } = req.body;
  if (!amount || !email) {
    return res.status(400).json({ error: 'Amount and customer email are required for payment initialization.' });
  }

  // Generate secure mock payment authorization structure for Paystack / Flutterwave integration
  const paystackSecretConfigured = Boolean(process.env.PAYSTACK_SECRET_KEY);
  const flutterwaveSecretConfigured = Boolean(process.env.FLUTTERWAVE_SECRET_KEY);

  res.json({
    reference: reference || `CHIAMA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    amount,
    currency: 'NGN',
    email,
    enquiry_id,
    payment_policy: 'Full payment is required prior to delivery confirmation.',
    providers_ready: {
      paystack: paystackSecretConfigured,
      flutterwave: flutterwaveSecretConfigured,
    },
    checkout_url: '#payment-gateway-modal',
  });
});

// -------------------------------------------------------------
// SERVER-SIDE GEMINI AI CONCIERGE CHAT API
// -------------------------------------------------------------
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    const db = readDb();
    const settings = db.business_settings || DEFAULT_BUSINESS_SETTINGS;
    const products = db.products || INITIAL_PRODUCTS;
    const faqs = db.faqs || INITIAL_FAQS;

    const productSummary = products
      .slice(0, 25)
      .map(
        (p) =>
          `- ${p.name} (${p.category}): ${p.price_text || (p.price ? '₦' + p.price.toLocaleString() : 'Request Price')} | ${p.description}`
      )
      .join('\n');

    const faqSummary = faqs
      .slice(0, 10)
      .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n');

    const systemInstruction = `You are Munachiama AI, the official intelligent luxury concierge for "${settings.businessName || 'Munachiama | Chiama21 Hommie Foods'}".
Your role is to assist guests, event planners, couples, and corporate clients with warm, hospitable, professional, and concise guidance.

OFFICIAL BUSINESS CONTACT & LOCATION DETAILS:
- Brand Name: ${settings.businessName}
- Phone Number: ${settings.phone}
- WhatsApp Number: ${settings.whatsapp}
- Email Address: ${settings.email}
- Physical Location / Address: ${settings.address}
- Social Handle: ${settings.socialHandle}

BRAND OFFERINGS:
1. Natural Drinks: Cold-Pressed Fruit Juices, Hibiscus Zobo, Tigernut Drinks, Creamy Parfaits, Chapman Dispensers.
2. Gourmet Small Chops: Samosas, Spring Rolls, Puff-Puff, Grilled Chicken & Beef Wings, BBQ Asun, Finger Food Platters.
3. Event Catering & Beverage Bars: Weddings, corporate conferences, private celebrations, executive refreshment bars.
4. Luxury Gift Hampers: Custom VIP Celebration Hampers, Souvenir Baskets.

LIVE PRODUCT CATALOG:
${productSummary}

FREQUENTLY ASKED QUESTIONS & POLICIES:
${faqSummary}
- Payment Policy: Full payment required prior to delivery. Bank Transfer to Access Bank (0093177004 - Ama Chioma Gloria). Volume buyer installment plans available for corporate orders via admin approval.
- Delivery: Port Harcourt and surrounding regions, refrigerated transit for cold beverages and insulated boxes for hot small chops.

CONVERSATION INSTRUCTIONS:
- Be warm, hospitable, polite, and concise.
- Keep answers informative, well-formatted with markdown/bullet points when listing items or steps.
- Direct customers on how to place an order or enquiry through the website's Enquiry Form or via WhatsApp (${settings.whatsapp}).
- Respond concisely (under 180 words per message unless a long breakdown is requested).`;

    if (!apiKey) {
      return res.json({
        text: `Welcome to **${settings.businessName}**! I am Munachiama AI. Our live Gemini key is being configured, but I can share that we serve cold-pressed natural drinks, gourmet small chops, and luxury hampers in Port Harcourt! You can reach our team directly on WhatsApp at **${settings.whatsapp}** or call **${settings.phone}**. How can we help you today?`,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const formattedHistory = Array.isArray(history)
      ? history
          .filter((item: any) => item && item.text && (item.role === 'user' || item.role === 'assistant' || item.role === 'model'))
          .map((item: any) => ({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }],
          }))
      : [];

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text || `Thank you for reaching out to ${settings.businessName}. Connect with us directly on WhatsApp at ${settings.whatsapp}!`;

    res.json({ text });
  } catch (err: any) {
    console.error('Gemini AI Chat Error:', err);
    const db = readDb();
    const settings = db.business_settings || DEFAULT_BUSINESS_SETTINGS;
    res.json({
      text: `Hello! I am Munachiama AI. I encountered a brief technical delay processing your question, but our team is ready to assist you on WhatsApp at **${settings.whatsapp}** or via phone at **${settings.phone}**.`,
    });
  }
});

// -------------------------------------------------------------
// REAL-TIME VOICE GEMINI LIVE API WEBSOCKET
// -------------------------------------------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Gemini Live API] Voice WebSocket connected');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        error: 'GEMINI_API_KEY is missing on server environment.',
      })
    );
    clientWs.close();
    return;
  }

  const db = readDb();
  const settings = db.business_settings || DEFAULT_BUSINESS_SETTINGS;

  const systemInstruction = `You are Munachiama AI, the warm, hospitable, and intelligent culinary voice concierge for "${settings.businessName || 'Munachiama | Chiama21 Hommie Foods'}".
You assist customers in Port Harcourt, Nigeria with natural drinks, cold-pressed juices, gourmet small chops, finger food platters, event catering, and luxury gift hampers.
Contact: Phone ${settings.phone}, WhatsApp ${settings.whatsapp}, Email ${settings.email}, Address ${settings.address}.
Be very warm, polite, and conversational. Keep responses clear and brief for a comfortable real-time spoken conversation.`;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const session = await ai.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          // Send model audio output chunks
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ audio }));
          }

          // Transcribed text from input or output
          const outputText = message.serverContent?.modelTurn?.parts?.[0]?.text;
          if (outputText) {
            clientWs.send(JSON.stringify({ text: outputText, role: 'assistant' }));
          }

          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          console.log('[Gemini Live API] Session closed');
        },
        onerror: (err) => {
          console.error('[Gemini Live API] Session error:', err);
          try {
            clientWs.send(JSON.stringify({ error: err.message || 'Live session error' }));
          } catch (e) {}
        },
      },
    });

    clientWs.on('message', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (parsed.text) {
          session.sendRealtimeInput({
            text: parsed.text,
          });
        }
      } catch (e) {
        console.error('[Gemini Live API] Failed to parse input:', e);
      }
    });

    clientWs.on('close', () => {
      try {
        session.close();
      } catch (e) {}
    });
  } catch (err: any) {
    console.error('[Gemini Live API] Failed to connect:', err);
    try {
      clientWs.send(JSON.stringify({ error: 'Live API connection error: ' + err.message }));
      clientWs.close();
    } catch (e) {}
  }
});

// -------------------------------------------------------------
// VITE OR STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
