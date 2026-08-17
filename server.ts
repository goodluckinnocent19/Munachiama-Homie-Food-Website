import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app as firebaseApp } from './src/lib/firebase';
import firebaseConfigJson from './firebase-applet-config.json';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import { Resend } from 'resend';
import {
  getProducts,
  saveProduct,
  deleteProduct,
  getCategories,
  getEnquiries,
  saveEnquiry,
  getOrders,
  saveOrder,
  getGallery,
  getFAQs,
  getPaymentPlans,
  savePaymentPlan,
  getInstallments,
  saveInstallment,
  getPaymentSubmissions,
  savePaymentSubmission,
  getAuditLogs,
  saveAuditLog,
  getNotifications,
  saveNotification,
  getBusinessSettings,
  saveBusinessSettings,
} from './src/lib/firestoreDb';
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
} from './src/types';
import { DEFAULT_BUSINESS_SETTINGS, INITIAL_PRODUCTS, INITIAL_FAQS } from './src/data/initialData';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Admin Security Token & Authorized Emails
const getAdminSecretToken = () => {
  if (process.env.ADMIN_SECRET_TOKEN) {
    return process.env.ADMIN_SECRET_TOKEN;
  }
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    return 'ChiamaAdminSecretTokenKey2026';
  }
  return '';
};

const AUTHORIZED_ADMIN_EMAILS = [
  'admin@chiama21foods.com',
  'goodluckinnocent19@gmail.com',
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.toLowerCase()] : []),
];

// Middleware for Secure Admin Protection
async function requireAdmin(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication token required.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  const adminSecret = getAdminSecretToken();

  if (adminSecret && token === adminSecret) {
    return next();
  }

  return res.status(401).json({ success: false, error: 'Unauthorized: Invalid admin credentials.' });
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// GET Business Settings
app.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const settings = await getBusinessSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
});

// UPDATE Business Settings (Admin)
app.put('/api/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const current = await getBusinessSettings();
    const updated: BusinessSettings = {
      ...current,
      ...req.body,
      updated_at: new Date().toISOString(),
    };
    await saveBusinessSettings(updated);
    res.json({ success: true, message: 'Business settings updated successfully.', settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update settings' });
  }
});

// Admin Login Route (Requires configured credentials or token)
app.post('/api/admin/login', async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;

    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;
    const envToken = process.env.ADMIN_SECRET_TOKEN;

    // Check production environment configuration requirements
    if (isProduction && (!envUser || !envPass || !envToken)) {
      return res.status(500).json({
        success: false,
        error: 'Admin authentication is not configured.',
      });
    }

    const effectiveUser = envUser || (!isProduction ? 'chiama_admin' : '');
    const effectivePass = envPass || (!isProduction ? 'admin123' : '');
    const effectiveToken = getAdminSecretToken();

    if (!effectiveUser || !effectivePass || !effectiveToken) {
      return res.status(500).json({
        success: false,
        error: 'Admin authentication is not configured.',
      });
    }

    // Email based login verification
    if (email && AUTHORIZED_ADMIN_EMAILS.includes(email.toLowerCase())) {
      return res.json({
        token: effectiveToken,
        user: {
          id: `admin-${Date.now()}`,
          username: email.split('@')[0],
          email,
          role: 'admin',
        },
      });
    }

    // Username & Password login verification
    if (username === effectiveUser && password === effectivePass) {
      return res.json({
        token: effectiveToken,
        user: {
          id: 'admin-1',
          username: 'ChiamaAdmin',
          email: 'admin@chiama21foods.com',
          role: 'admin',
        },
      });
    }

    return res.status(401).json({ success: false, error: 'Invalid admin credentials. Access denied.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Login failed' });
  }
});

// GET Products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const featured = req.query.featured === 'true';
    const search = req.query.search as string;
    const includeHidden = req.query.includeHidden === 'true';

    const items = await getProducts({ category, featured, search, includeHidden });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
});

// CREATE Product (Admin)
app.post('/api/products', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      name,
      category,
      description,
      price,
      price_text,
      image_url,
      featured,
      available,
      availability,
      minimum_order_quantity,
      display_order,
      ingredients,
      serves_text,
    } = req.body;

    if (!name || !category || !description) {
      return res.status(400).json({ error: 'Name, category, and description are required.' });
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      category,
      description,
      price: price !== undefined && price !== null && price !== '' ? Number(price) : null,
      price_text: price_text || (price ? `₦${Number(price).toLocaleString()}` : 'Quote on Request'),
      image_url: image_url || 'https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=1000&q=80',
      featured: Boolean(featured),
      available: available !== undefined ? Boolean(available) : availability !== 'OUT_OF_STOCK',
      availability: availability || (available === false ? 'OUT_OF_STOCK' : 'AVAILABLE'),
      minimum_order_quantity: minimum_order_quantity || '',
      display_order: display_order ? Number(display_order) : 0,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      serves_text: serves_text || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveProduct(newProduct);
    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// UPDATE Product (Admin)
app.put('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const products = await getProducts({ includeHidden: true });
    const existing = products.find((p) => p.id === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const updated: Product = {
      ...existing,
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    await saveProduct(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

// DELETE Product (Admin)
app.delete('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// -------------------------------------------------------------
// RESEND EMAIL NOTIFICATIONS SYSTEM (Server-Side)
// -------------------------------------------------------------
let resendClient: Resend | null = null;
function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const BUSINESS_NOTIFICATION_EMAIL = process.env.BUSINESS_NOTIFICATION_EMAIL || 'chiama21hommiefoods@gmail.com';
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM || 'Munachiama Orders <onboarding@resend.dev>';

async function sendBusinessNotificationEmail(params: {
  subject: string;
  headline: string;
  badgeText: string;
  detailsHtml: string;
  plainText: string;
}) {
  try {
    const resend = getResend();
    if (!resend) {
      console.log(`[Email Notification Notice] RESEND_API_KEY not set. Notification skipped for: "${params.subject}"`);
      return;
    }

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #120305; color: #FDF8F2; padding: 32px 16px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1A0507; border: 1px solid #D4AF37; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3D0C11 0%, #1A0507 100%); padding: 24px; border-bottom: 1px solid rgba(212, 175, 55, 0.3); text-align: center;">
            <div style="display: inline-block; padding: 4px 12px; background-color: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 20px; font-size: 11px; font-weight: bold; color: #D4AF37; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px;">
              ${params.badgeText}
            </div>
            <h1 style="color: #FDF8F2; margin: 4px 0 0 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">
              MUNACHIAMA | CHIAMA21 HOMMIE FOODS
            </h1>
            <p style="color: #D4AF37; margin: 4px 0 0 0; font-size: 13px; font-style: italic;">
              ${params.headline}
            </p>
          </div>

          <!-- Body Content -->
          <div style="padding: 24px; color: #FDF8F2; font-size: 14px; line-height: 1.6;">
            ${params.detailsHtml}
          </div>

          <!-- Footer -->
          <div style="background-color: #120305; padding: 16px 24px; border-top: 1px solid rgba(212, 175, 55, 0.2); text-align: center; font-size: 12px; color: rgba(253, 248, 242, 0.6);">
            <p style="margin: 0; color: #D4AF37; font-weight: 600;">Munachiama Catering & Culinary Management</p>
            <p style="margin: 4px 0 0 0;">Official WhatsApp: +234 806 512 4134 | Email: chiama21hommiefoods@gmail.com</p>
          </div>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: EMAIL_FROM_ADDRESS,
      to: [BUSINESS_NOTIFICATION_EMAIL],
      subject: `[Munachiama Foods] ${params.subject}`,
      html: htmlBody,
      text: params.plainText,
    });

    console.log(`[Resend Email Dispatched] Subject: "${params.subject}"`, result);
  } catch (err: any) {
    console.error(`[Resend Email Dispatch Error] Failed to send email for "${params.subject}":`, err?.message || err);
  }
}

function formatFirebaseStorageError(err: any, bucketName: string): string {
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code === 'storage/unauthorized') {
    return `Firebase Storage permission denied (storage/unauthorized). Please verify Firebase Storage Security Rules for bucket: ${bucketName}.`;
  }
  if (code === 'storage/unauthenticated') {
    return 'Firebase Storage user unauthenticated (storage/unauthenticated). Admin user authentication required.';
  }
  if (code === 'storage/quota-exceeded') {
    return `Firebase Storage quota exceeded (storage/quota-exceeded) on bucket '${bucketName}'.`;
  }
  if (code === 'storage/invalid-argument') {
    return 'Invalid file argument provided to Firebase Storage (storage/invalid-argument).';
  }
  if (code === 'storage/object-not-found') {
    return 'Firebase Storage object not found (storage/object-not-found).';
  }
  if (code === 'storage/retry-limit-exceeded') {
    return 'Firebase Storage operation timed out (storage/retry-limit-exceeded). Please try uploading again.';
  }
  if (code === 'storage/unknown' || err?.status_ === 404) {
    return `Firebase Storage bucket error (storage/unknown, HTTP 404). Please ensure Cloud Storage is enabled in Firebase Console for project 'centering-sequence-vf6jr' and VITE_FIREBASE_STORAGE_BUCKET is configured as '${bucketName}'.`;
  }
  return `Firebase Storage Error (${code || 'unknown'}): ${msg}`;
}

async function handleImageUploadRequest(req: Request, res: Response) {
  try {
    const { fileData, fileName, mimeType, image } = req.body;
    const rawData = fileData || image;

    if (!rawData) {
      return res.status(400).json({ success: false, error: 'No image file or base64 data provided.' });
    }

    // Determine MIME type
    let detectedMime = mimeType || 'image/jpeg';
    if (typeof rawData === 'string' && rawData.startsWith('data:')) {
      const parts = rawData.split(';')[0];
      detectedMime = parts.replace('data:', '');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(detectedMime.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported image format. Allowed formats: PNG, JPG, JPEG, or WEBP.',
      });
    }

    // Extract base64 content
    let base64Content = rawData;
    if (typeof rawData === 'string' && rawData.includes(';base64,')) {
      base64Content = rawData.split(';base64,')[1];
    }

    const buffer = Buffer.from(base64Content, 'base64');
    const fileSizeInMB = buffer.length / (1024 * 1024);

    if (fileSizeInMB > 5) {
      return res.status(400).json({
        success: false,
        error: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 5MB limit. Please select a smaller file.`,
      });
    }

    const sanitizedName = (fileName || 'product_image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
    const randomId = Math.random().toString(36).substring(2, 10);
    const storagePath = `products/${Date.now()}-${randomId}-${sanitizedName}`;

    const rawBucket =
      process.env.VITE_FIREBASE_STORAGE_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      firebaseConfigJson.storageBucket ||
      'centering-sequence-vf6jr.firebasestorage.app';

    const cleanBucket = rawBucket.replace(/^gs:\/\//, '');

    const dataUrl = `data:${detectedMime};base64,${base64Content}`;

    try {
      const storageObj = getStorage(firebaseApp, `gs://${cleanBucket}`);
      const storageRef = ref(storageObj, storagePath);

      const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(snapshot.ref);

      console.log(`[Firebase Storage Success] Product image uploaded to ${storagePath}`);
      return res.json({ success: true, url: downloadUrl, path: storagePath });
    } catch (storageErr: any) {
      console.warn('[Firebase Storage Notice]: Storage upload failed or bucket uninitialized, falling back to data URL payload:', {
        code: storageErr.code,
        message: storageErr.message,
        status: storageErr.status_,
        path: storagePath,
      });

      // Provide resilient fallback so admin product creation is never blocked
      return res.json({
        success: true,
        url: dataUrl,
        path: storagePath,
        fallback: true,
      });
    }
  } catch (err: any) {
    console.error('[Admin Image Upload Handler Error]:', err?.message || err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to process image upload.',
    });
  }
}

// IMAGE UPLOAD ENDPOINTS (Admin Protected)
app.post('/api/upload', requireAdmin, handleImageUploadRequest);
app.post('/api/admin/upload-image', requireAdmin, handleImageUploadRequest);

// GET Categories
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const categories = await getCategories();
    const products = await getProducts();
    const categoriesWithCounts = categories.map((c) => ({
      ...c,
      item_count: products.filter((p) => p.category === c.slug).length,
    }));
    res.json(categoriesWithCounts);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch categories' });
  }
});

// CREATE Enquiry (Public - Order / Quote Request)
app.post('/api/enquiries', async (req: Request, res: Response) => {
  try {
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

    await saveEnquiry(newEnquiry);

    // Send Server-Side Email Notification via Resend
    sendBusinessNotificationEmail({
      subject: `New ${event_type.toUpperCase()} Enquiry #${newEnquiry.id} from ${customer_name}`,
      headline: `New Catering / Quote Request Received`,
      badgeText: 'New Enquiry Notification',
      detailsHtml: `
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold; width: 35%;">Enquiry ID:</td>
            <td style="padding: 8px 0; color: #FDF8F2; font-family: monospace;">${newEnquiry.id}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Customer Name:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${customer_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Phone Number:</td>
            <td style="padding: 8px 0; color: #FDF8F2;"><a href="tel:${phone}" style="color: #D4AF37; text-decoration: none;">${phone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">WhatsApp Line:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${newEnquiry.whatsapp}</td>
          </tr>
          ${email ? `
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Email Address:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${email}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Event Type:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${event_type}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Category:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${newEnquiry.product_category}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Event Date:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${newEnquiry.event_date}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Location:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${location}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Estimated Quantity:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${newEnquiry.quantity}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Estimated Budget:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${newEnquiry.budget}</td>
          </tr>
          ${message ? `
          <tr>
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold; vertical-align: top;">Customer Note:</td>
            <td style="padding: 8px 0; color: #FDF8F2; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">${message}</td>
          </tr>` : ''}
        </table>
      `,
      plainText: `New Enquiry #${newEnquiry.id}\nCustomer: ${customer_name}\nPhone: ${phone}\nEvent: ${event_type}\nCategory: ${newEnquiry.product_category}\nDate: ${newEnquiry.event_date}\nLocation: ${location}\nQuantity: ${newEnquiry.quantity}\nBudget: ${newEnquiry.budget}\nMessage: ${message || 'None'}`,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      enquiry: newEnquiry,
      message: 'Thank you! Your request has been received. Our team will review your details and contact you shortly.',
      notice: 'Payment Policy: Full payment is required before delivery. We do not offer credit arrangements.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit enquiry' });
  }
});

// GET Enquiries (Admin)
app.get('/api/enquiries', requireAdmin, async (req: Request, res: Response) => {
  try {
    const enquiries = await getEnquiries();
    res.json(enquiries);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch enquiries' });
  }
});

// UPDATE Enquiry Status (Admin)
app.put('/api/enquiries/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const enquiries = await getEnquiries();
    const existing = enquiries.find((e) => e.id === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Enquiry not found.' });
    }

    const updated: Enquiry = {
      ...existing,
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    await saveEnquiry(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update enquiry' });
  }
});

// GET Orders (Admin)
app.get('/api/orders', requireAdmin, async (req: Request, res: Response) => {
  try {
    const orders = await getOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
});

// UPDATE Order Status (Admin)
app.put('/api/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const orders = await getOrders();
    const existing = orders.find((o) => o.id === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const updated: Order = {
      ...existing,
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    await saveOrder(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update order' });
  }
});

// GET Gallery
app.get('/api/gallery', async (req: Request, res: Response) => {
  try {
    const gallery = await getGallery();
    res.json(gallery);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch gallery' });
  }
});

// GET FAQs
app.get('/api/faqs', async (req: Request, res: Response) => {
  try {
    const faqs = await getFAQs();
    res.json(faqs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch faqs' });
  }
});

// GET Dashboard Metrics (Admin)
app.get('/api/metrics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const enquiries = await getEnquiries();
    const orders = await getOrders();
    const submissions = await getPaymentSubmissions();
    const installments = await getInstallments();

    const totalEnquiries = enquiries.length;
    const newEnquiries = enquiries.filter((e) => e.status === 'New').length;
    const confirmedOrders = orders.filter((o) => o.status === 'Confirmed' || o.payment_status === 'Paid' || o.payment_status === 'Verified').length;
    const pendingOrders = orders.filter((o) => o.payment_status === 'Unpaid' || o.payment_status === 'Under Review' || o.payment_status === 'Payment Submitted').length;
    const completedOrders = orders.filter((o) => o.status === 'Completed').length;

    const verifiedRevenue = submissions
      .filter((s) => s.status === 'Verified')
      .reduce((sum, s) => sum + (s.amount_submitted || 0), 0);

    const totalRevenueEstimated = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const pendingVerificationCount = submissions.filter((s) => s.status === 'Submitted' || s.status === 'Under Review').length;

    const totalInstallmentsExpected = installments.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalInstallmentsPaid = installments.filter((i) => i.payment_status === 'Verified').reduce((sum, i) => sum + (i.amount || 0), 0);
    const outstandingInstallmentBalance = Math.max(0, totalInstallmentsExpected - totalInstallmentsPaid);

    const overdueInstallmentCount = installments.filter((i) => i.payment_status === 'Overdue').length;
    const partiallyPaidOrdersCount = orders.filter((o) => o.payment_status === 'Partially Paid').length;
    const fullyPaidOrdersCount = orders.filter((o) => o.payment_status === 'Paid' || o.payment_status === 'Verified').length;

    const catMap: Record<string, number> = {};
    enquiries.forEach((e) => {
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
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch metrics' });
  }
});

// Submit Bank Transfer Payment (Customer Public Endpoint)
async function handleSubmitTransfer(req: Request, res: Response) {
  try {
    const { order_id, installment_id, payment_plan_id, customer_name, customer_phone, amount_submitted, payment_reference, bank_name, payment_date, notes, proof_url } = req.body;

    if (!order_id || !payment_reference || !amount_submitted) {
      return res.status(400).json({ error: 'Order ID, transaction reference, and amount submitted are required.' });
    }

    const orders = await getOrders();
    const enquiries = await getEnquiries();

    const order = orders.find((o) => o.id === order_id);
    const enquiry = enquiries.find((e) => e.id === order_id);

    if (!order && !enquiry) {
      return res.status(404).json({ error: 'Order or Enquiry record not found.' });
    }

    const submissionId = `sub-${Date.now()}`;
    const newSubmission: PaymentSubmission = {
      id: submissionId,
      order_id,
      installment_id: installment_id || undefined,
      payment_plan_id: payment_plan_id || undefined,
      customer_name: customer_name || (order ? order.customer_name : enquiry?.customer_name || 'Customer'),
      customer_phone: customer_phone || (order ? order.customer_phone : enquiry?.phone || ''),
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

    await savePaymentSubmission(newSubmission);

    // Update order or enquiry status to Under Review (DO NOT MARK AS VERIFIED AUTOMATICALLY)
    if (order) {
      await saveOrder({
        ...order,
        payment_status: 'Under Review',
        status: 'Payment Verification',
        updated_at: new Date().toISOString(),
      });
    }
    if (enquiry) {
      await saveEnquiry({
        ...enquiry,
        payment_status: 'Under Review',
        status: 'Payment Verification',
        updated_at: new Date().toISOString(),
      });
    }

    if (installment_id) {
      const installments = await getInstallments();
      const inst = installments.find((i) => i.id === installment_id);
      if (inst) {
        await saveInstallment({
          ...inst,
          payment_status: 'Under Review',
          payment_reference,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Create Audit Log
    await saveAuditLog({
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
    });

    // Send Server-Side Email Notification via Resend for Payment Verification
    sendBusinessNotificationEmail({
      subject: `Bank Transfer Proof Submitted for Order #${order_id} (₦${Number(amount_submitted).toLocaleString()})`,
      headline: `Bank Transfer Awaiting Admin Verification`,
      badgeText: 'Payment Proof Received',
      detailsHtml: `
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold; width: 35%;">Order / Enquiry ID:</td>
            <td style="padding: 8px 0; color: #FDF8F2; font-family: monospace;">${order_id}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Customer Name:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${newSubmission.customer_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Customer Phone:</td>
            <td style="padding: 8px 0; color: #FDF8F2;"><a href="tel:${newSubmission.customer_phone}" style="color: #D4AF37; text-decoration: none;">${newSubmission.customer_phone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Amount Paid:</td>
            <td style="padding: 8px 0; color: #4ADE80; font-size: 16px; font-weight: bold;">₦${Number(amount_submitted).toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Transaction Reference:</td>
            <td style="padding: 8px 0; color: #FDF8F2; font-family: monospace;">${payment_reference}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Paying Bank:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${bank_name || 'Access Bank'}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Payment Date:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${payment_date || new Date().toISOString().split('T')[0]}</td>
          </tr>
          ${notes ? `
          <tr>
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold; vertical-align: top;">Customer Notes:</td>
            <td style="padding: 8px 0; color: #FDF8F2; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">${notes}</td>
          </tr>` : ''}
        </table>
        <div style="margin-top: 16px; padding: 12px; background-color: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; font-size: 13px; text-align: center;">
          <p style="margin: 0; color: #D4AF37; font-weight: bold;">Action Required:</p>
          <p style="margin: 4px 0 0 0; color: #FDF8F2;">Log into Admin Dashboard to verify funds received in Access Bank account (0093177004).</p>
        </div>
      `,
      plainText: `Bank Transfer Proof Submitted for Order #${order_id}\nCustomer: ${newSubmission.customer_name}\nPhone: ${newSubmission.customer_phone}\nAmount: ₦${Number(amount_submitted).toLocaleString()}\nReference: ${payment_reference}\nBank: ${bank_name || 'Access Bank'}\nDate: ${payment_date}`,
    }).catch(() => {});

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
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit bank transfer proof' });
  }
}

app.post('/api/payments/submit-transfer', handleSubmitTransfer);
app.post('/api/payments/submit-proof', handleSubmitTransfer);

// CREATE Order (Public / Customer Checkout)
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      order_type,
      items_summary,
      delivery_date,
      delivery_location,
      budget,
      total_amount,
      product_subtotal: reqSubtotal,
      service_charge: reqServiceCharge,
      logistics_charge: reqLogisticsCharge,
      notes,
    } = req.body;

    if (!customer_name || !customer_phone) {
      return res.status(400).json({ error: 'Customer name and phone number are required.' });
    }

    const orderId = `ord-${Math.floor(1000 + Math.random() * 9000)}`;
    const product_subtotal = reqSubtotal !== undefined ? Number(reqSubtotal) : (total_amount ? Number(total_amount) : 0);
    const service_charge = reqServiceCharge !== undefined ? Number(reqServiceCharge) : Math.round(product_subtotal * 0.20);
    const logistics_charge = reqLogisticsCharge !== undefined ? Number(reqLogisticsCharge) : 0;
    const total_payable = product_subtotal + service_charge + logistics_charge;

    const newOrder: Order = {
      id: orderId,
      customer_id: `cust-${Date.now()}`,
      customer_name,
      customer_phone,
      customer_email: customer_email || '',
      order_type: order_type || 'Catering / Menu Order',
      items_summary: items_summary || 'Custom Selection',
      delivery_date: delivery_date || 'To be confirmed',
      delivery_location: delivery_location || 'Customer Address',
      quantity: req.body.quantity || 'Standard',
      budget: budget || (total_payable ? `₦${total_payable.toLocaleString()}` : 'Standard'),
      product_subtotal,
      service_charge,
      logistics_charge,
      total_payable,
      total_amount: total_payable,
      payment_requirement: 'FULL_PAYMENT',
      pricing_notice: 'Please note: Stated product prices do not include service and logistics charges. Service charge is 20% of product subtotal. Full payment confirms order.',
      status: 'New',
      payment_status: 'Unpaid',
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveOrder(newOrder);

    // Send Email Notification
    sendBusinessNotificationEmail({
      subject: `New Order #${newOrder.id} Placed by ${customer_name}`,
      headline: `New Catering Order Placed`,
      badgeText: 'New Order Received',
      detailsHtml: `
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold; width: 35%;">Order ID:</td>
            <td style="padding: 8px 0; color: #FDF8F2; font-family: monospace;">${newOrder.id}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Customer Name:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${customer_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Customer Phone:</td>
            <td style="padding: 8px 0; color: #FDF8F2;"><a href="tel:${customer_phone}" style="color: #D4AF37; text-decoration: none;">${customer_phone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Items / Menu:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${newOrder.items_summary}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Delivery Date:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${newOrder.delivery_date}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Delivery Location:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">${newOrder.delivery_location}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Product Subtotal:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">₦${(newOrder.product_subtotal || 0).toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Service Charge (20%):</td>
            <td style="padding: 8px 0; color: #FDF8F2;">₦${(newOrder.service_charge || 0).toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Logistics Charge:</td>
            <td style="padding: 8px 0; color: #FDF8F2;">₦${(newOrder.logistics_charge || 0).toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">Total Payable:</td>
            <td style="padding: 8px 0; color: #4ADE80; font-weight: bold; font-size: 16px;">₦${Number(newOrder.total_payable || 0).toLocaleString()}</td>
          </tr>
        </table>
        <div style="margin-top: 12px; font-size: 11px; color: #D4AF37; font-style: italic;">
          * Full payment is required to confirm this order.
        </div>
      `,
      plainText: `New Order #${newOrder.id}\nCustomer: ${customer_name}\nPhone: ${customer_phone}\nItems: ${newOrder.items_summary}\nSubtotal: ₦${newOrder.product_subtotal?.toLocaleString()}\nService Charge (20%): ₦${newOrder.service_charge?.toLocaleString()}\nLogistics: ₦${newOrder.logistics_charge?.toLocaleString()}\nTotal Payable: ₦${newOrder.total_payable?.toLocaleString()}`,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      order: newOrder,
      message: 'Order created successfully. Please submit full bank transfer payment to confirm your order.',
      policy: 'FULL PAYMENT CONFIRMS ORDER. Stated product prices do not include service and logistics charges.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// Track Order & Payment Status (Public)
app.get('/api/orders/track/:order_id', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.order_id;

    const orders = await getOrders();
    const enquiries = await getEnquiries();
    const plans = await getPaymentPlans();
    const installments = await getInstallments();
    const submissions = await getPaymentSubmissions();
    const notifications = await getNotifications();

    const order = orders.find((o) => o.id === orderId) || enquiries.find((e) => e.id === orderId);
    if (!order) {
      return res.status(404).json({ error: 'No order or enquiry found with this ID.' });
    }

    const plan = plans.find((p) => p.order_id === orderId);
    const orderInstallments = installments
      .filter((i) => i.order_id === orderId || (plan && i.payment_plan_id === plan.id))
      .sort((a, b) => a.installment_number - b.installment_number);

    const orderSubmissions = submissions
      .filter((s) => s.order_id === orderId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const orderNotifs = notifications.filter((n) => n.order_id === orderId);

    const rawTotal = 'total_payable' in order && order.total_payable
      ? order.total_payable
      : ('total_amount' in order && order.total_amount
        ? order.total_amount
        : (plan ? plan.total_amount : 0));

    const productSubtotal = 'product_subtotal' in order && order.product_subtotal !== undefined
      ? order.product_subtotal
      : Math.round(rawTotal / 1.2);

    const serviceCharge = 'service_charge' in order && order.service_charge !== undefined
      ? order.service_charge
      : Math.round(productSubtotal * 0.20);

    const logisticsCharge = 'logistics_charge' in order && order.logistics_charge !== undefined
      ? order.logistics_charge
      : 0;

    const totalPayable = rawTotal || (productSubtotal + serviceCharge + logisticsCharge);

    const totalVerifiedPaid = orderSubmissions
      .filter((s) => s.status === 'Verified')
      .reduce((sum, s) => sum + s.amount_submitted, 0);

    const outstandingBalance = Math.max(0, totalPayable - totalVerifiedPaid);
    const isFullyPaid = totalPayable > 0 && totalVerifiedPaid >= totalPayable;
    const paymentProgressPercent = totalPayable > 0 ? Math.min(100, Math.round((totalVerifiedPaid / totalPayable) * 100)) : (order.payment_status === 'Paid' || order.payment_status === 'Verified' ? 100 : 0);

    res.json({
      order,
      payment_plan: plan || null,
      installments: orderInstallments,
      payment_submissions: orderSubmissions,
      notifications: orderNotifs,
      pricing_breakdown: {
        product_subtotal: productSubtotal,
        service_charge: serviceCharge,
        service_charge_percent: 20,
        logistics_charge: logisticsCharge,
        total_payable: totalPayable,
        stated_prices_notice: 'Please note: Stated product prices do not include service and logistics charges.',
        payment_policy_notice: 'FULL PAYMENT CONFIRMS ORDER. Full payment is required before culinary preparation and event dispatch.',
      },
      summary: {
        total_amount: totalPayable,
        total_payable: totalPayable,
        product_subtotal: productSubtotal,
        service_charge: serviceCharge,
        logistics_charge: logisticsCharge,
        total_verified_paid: totalVerifiedPaid,
        outstanding_balance: outstandingBalance,
        is_fully_paid: isFullyPaid,
        payment_progress_percent: paymentProgressPercent,
        policy_notice: 'Full payment confirms order.',
        bank_details: {
          account_name: 'Ama Chioma Gloria',
          bank: 'Access Bank',
          account_number: '0093177004',
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to track order' });
  }
});

// GET All Payment Submissions (Admin)
app.get('/api/payment-submissions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const submissions = await getPaymentSubmissions();
    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch payment submissions' });
  }
});

// Admin VERIFY Payment
app.put('/api/payment-submissions/:id/verify', requireAdmin, async (req: Request, res: Response) => {
  try {
    const submissions = await getPaymentSubmissions();
    const sub = submissions.find((s) => s.id === req.params.id);
    if (!sub) {
      return res.status(404).json({ error: 'Payment submission not found.' });
    }

    const { notes, verified_amount } = req.body;
    const verifiedAmt = verified_amount ? Number(verified_amount) : sub.amount_submitted;

    const updatedSub: PaymentSubmission = {
      ...sub,
      status: 'Verified',
      amount_submitted: verifiedAmt,
      verified_by: 'ChiamaAdmin',
      verified_at: new Date().toISOString(),
      notes: notes || sub.notes,
    };

    await savePaymentSubmission(updatedSub);

    const orderId = sub.order_id;

    if (sub.installment_id) {
      const installments = await getInstallments();
      const inst = installments.find((i) => i.id === sub.installment_id);
      if (inst) {
        await saveInstallment({
          ...inst,
          payment_status: 'Verified',
          paid_at: new Date().toISOString(),
          verified_by: 'ChiamaAdmin',
          verification_date: new Date().toISOString(),
          payment_reference: sub.payment_reference,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Recalculate order status: FULL PAYMENT CONFIRMS ORDER
    const orders = await getOrders();
    const enquiries = await getEnquiries();
    const plans = await getPaymentPlans();
    const order = orders.find((o) => o.id === orderId);
    const enquiry = enquiries.find((e) => e.id === orderId);
    const plan = plans.find((p) => p.order_id === orderId);

    const allVerifiedSubs = (await getPaymentSubmissions()).filter((s) => s.order_id === orderId && s.status === 'Verified');
    const totalPaid = allVerifiedSubs.reduce((sum, s) => sum + s.amount_submitted, 0);

    const targetTotal = order?.total_payable || order?.total_amount || plan?.total_amount || 0;
    
    let newPaymentStatus: PaymentStatus = 'Partially Paid';
    let newOrderStatus: OrderStatus = 'Awaiting Payment';

    // Business Rule: FULL PAYMENT CONFIRMS ORDER
    if (targetTotal > 0 && totalPaid >= targetTotal) {
      newPaymentStatus = 'Verified';
      newOrderStatus = 'Confirmed';
      if (plan) await savePaymentPlan({ ...plan, status: 'Completed', updated_at: new Date().toISOString() });
    } else if (totalPaid > 0) {
      newPaymentStatus = 'Partially Paid';
      newOrderStatus = 'Payment Verification'; // Remains in verification until 100% full payment
    }

    if (order) {
      await saveOrder({
        ...order,
        payment_status: newPaymentStatus,
        status: newOrderStatus,
        updated_at: new Date().toISOString(),
      });
    }
    if (enquiry) {
      await saveEnquiry({
        ...enquiry,
        payment_status: newPaymentStatus,
        status: newOrderStatus,
        updated_at: new Date().toISOString(),
      });
    }

    // Audit Log
    await saveAuditLog({
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
    });

    // Customer Notification
    await saveNotification({
      id: `notif-${Date.now()}`,
      order_id: orderId,
      customer_phone: sub.customer_phone,
      type: 'Payment Verified',
      title: 'Payment Verified & Confirmed',
      message: `Your payment of ₦${verifiedAmt.toLocaleString()} for Order ${orderId} has been verified by our finance team. Thank you!`,
      whatsapp_link: `https://wa.me/2348065124134?text=Hello%20Munachiama%2C%20my%20payment%20for%20Order%20${orderId}%20is%20verified`,
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      submission: updatedSub,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to verify payment' });
  }
});

// Admin REJECT Payment
app.put('/api/payment-submissions/:id/reject', requireAdmin, async (req: Request, res: Response) => {
  try {
    const submissions = await getPaymentSubmissions();
    const sub = submissions.find((s) => s.id === req.params.id);
    if (!sub) {
      return res.status(404).json({ error: 'Payment submission not found.' });
    }

    const { rejection_reason } = req.body;
    if (!rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required.' });
    }

    const updatedSub: PaymentSubmission = {
      ...sub,
      status: 'Rejected',
      rejection_reason,
      verified_by: 'ChiamaAdmin',
      verified_at: new Date().toISOString(),
    };

    await savePaymentSubmission(updatedSub);

    const orderId = sub.order_id;

    if (sub.installment_id) {
      const installments = await getInstallments();
      const inst = installments.find((i) => i.id === sub.installment_id);
      if (inst) {
        await saveInstallment({
          ...inst,
          payment_status: 'Rejected',
          notes: `Rejected: ${rejection_reason}`,
          updated_at: new Date().toISOString(),
        });
      }
    }

    const orders = await getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      await saveOrder({
        ...order,
        payment_status: 'Rejected',
        notes: `Payment rejected: ${rejection_reason}`,
        updated_at: new Date().toISOString(),
      });
    }

    // Audit Log
    await saveAuditLog({
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

    res.json({
      success: true,
      message: 'Payment rejected with reason recorded.',
      submission: updatedSub,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reject payment' });
  }
});

// GET All Payment Plans (Admin)
app.get('/api/payment-plans', requireAdmin, async (req: Request, res: Response) => {
  try {
    const plans = await getPaymentPlans();
    const installments = await getInstallments();
    const plansWithInstallments = plans.map((p) => ({
      ...p,
      installments: installments.filter((i) => i.payment_plan_id === p.id),
    }));
    res.json(plansWithInstallments);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch payment plans' });
  }
});

// Admin CREATE or CONFIGURE Installment Plan
app.post('/api/payment-plans', requireAdmin, async (req: Request, res: Response) => {
  try {
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

    await savePaymentPlan(newPlan);

    // Create individual installment items
    const createdInstallments: Installment[] = [];
    if (Array.isArray(installments) && installments.length > 0) {
      for (let idx = 0; idx < installments.length; idx++) {
        const inst = installments[idx];
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
        await saveInstallment(instRecord);
        createdInstallments.push(instRecord);
      }
    }

    const orders = await getOrders();
    const order = orders.find((o) => o.id === order_id);
    if (order) {
      await saveOrder({
        ...order,
        payment_plan_id: planId,
        total_amount: Number(total_amount),
        updated_at: new Date().toISOString(),
      });
    }

    await saveAuditLog({
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

    res.status(201).json({
      success: true,
      plan: newPlan,
      installments: createdInstallments,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create payment plan' });
  }
});

// Update Installment Details (Admin)
app.put('/api/installments/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const installments = await getInstallments();
    const existing = installments.find((i) => i.id === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Installment not found.' });
    }

    const updated: Installment = {
      ...existing,
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    await saveInstallment(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update installment' });
  }
});

// GET Audit Logs (Admin)
app.get('/api/payment-audit-logs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const logs = await getAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
  }
});

// -------------------------------------------------------------
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

    let settings: BusinessSettings;
    try {
      settings = await getBusinessSettings();
    } catch (err) {
      console.error('[Gemini AI Chat] Failed to load business settings:', err);
      settings = DEFAULT_BUSINESS_SETTINGS;
    }

    let products: Product[] = [];
    try {
      products = await getProducts();
    } catch (err) {
      console.error('[Gemini AI Chat] Failed to load products:', err);
      products = INITIAL_PRODUCTS;
    }

    let faqs: FAQItem[] = [];
    try {
      faqs = await getFAQs();
    } catch (err) {
      console.error('[Gemini AI Chat] Failed to load FAQs:', err);
      faqs = INITIAL_FAQS;
    }

    const productSummary = products
      .slice(0, 30)
      .map(
        (p) =>
          `- ${p.name} (${p.category}): ${p.price_text || (p.price ? '₦' + p.price.toLocaleString() : 'Request Price')} | ${p.description}`
      )
      .join('\n');

    const faqSummary = faqs
      .slice(0, 10)
      .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n');

    const systemInstruction = `You are Munachiama AI, the official intelligent luxury culinary concierge for "${settings.businessName || 'Munachiama | Chiama21 Hommie Foods'}".
Your role is to assist guests, event planners, couples, and corporate clients with warm, hospitable, professional, and concise guidance.

OFFICIAL BUSINESS CONTACT & LOCATION DETAILS:
- Brand Name: ${settings.businessName || 'Munachiama | Chiama21 Hommie Foods'}
- Physical Address: ${settings.address || 'Ada-George Road, Mgbuoba, Port Harcourt, Rivers, Nigeria'}
- Phone Number: ${settings.phone || '+234 806 512 4134'}
- WhatsApp Line: ${settings.whatsapp || '+234 806 512 4134'}
- Email Address: ${settings.email || 'chiama21hommiefoods@gmail.com'}
- Social Media: ${settings.socialHandle || '@Munachiama.ng'} (Facebook, Instagram, TikTok, Snapchat)

BRAND OFFERINGS & CULINARY SERVICES:
1. Natural Drinks & Refreshments: Cold-Pressed Fruit Juices, Hibiscus Zobo, Tigernut Drinks, Creamy Parfaits, Chapman Dispensers, Healthy Salads, Fresh Mocktails & Cocktails.
2. Gourmet Small Chops & Finger Foods: Samosas, Spring Rolls, Puff-Puff, Grilled Chicken & Beef Wings, BBQ Asun, Finger Food Platters.
3. Event Catering & Beverage Bars: Weddings, corporate conferences, private celebrations, executive refreshment bars.
4. Luxury Gift Hampers: Custom VIP Celebration Hampers, Souvenir Baskets.

OFFICIAL PAYMENT DETAILS:
- Bank Name: Access Bank
- Account Name: Ama Chioma Gloria
- Account Number: 0093177004

PAYMENT & INSTALLMENT POLICIES:
- Payment must be made prior to delivery. The business does NOT offer ordinary credit.
- An installment payment arrangement is available for eligible volume buyers, and the specific arrangement is discussed directly with the buyer.
- DO NOT independently approve or calculate installment percentages, dates, schedules, or eligibility requirements.
- DO NOT claim that a payment has been verified or confirmed simply because a customer says they have paid. Payment confirmation can only be verified through our backend admin payment-verification system.
- If a customer asks about a payment they made, instruct them to check their status using the Order & Payment Tracker on the website or send their payment proof/reference directly on WhatsApp (${settings.whatsapp || '+234 806 512 4134'}).

DELIVERY & LOGISTICS:
- Primary Region: Port Harcourt, Rivers State, and surrounding regions.
- Transit Care: Refrigerated transit for cold beverages and insulated boxes for hot small chops to ensure optimal taste and temperature.

LIVE PRODUCT CATALOG:
${productSummary}

FREQUENTLY ASKED QUESTIONS:
${faqSummary}

CONVERSATION INSTRUCTIONS:
- Be warm, hospitable, polite, and concise.
- Keep answers informative, well-formatted with markdown/bullet points when listing items or steps.
- Direct customers on how to place an order or enquiry through the website's Enquiry Form or via WhatsApp (${settings.whatsapp || '+234 806 512 4134'}).
- If information is unavailable or unconfirmed, politely ask the customer to contact our team on WhatsApp (${settings.whatsapp || '+234 806 512 4134'}) rather than inventing an answer.
- Respond concisely (under 180 words per message unless a long breakdown is requested).`;

    if (!apiKey) {
      console.warn('[Gemini AI Chat] GEMINI_API_KEY environment variable is missing.');
      return res.json({
        text: `Welcome to **${settings.businessName || 'Munachiama | Chiama21 Hommie Foods'}**! I am Munachiama AI. Our AI assistant is connecting, but our human team is ready to serve you! We offer cold-pressed natural drinks, gourmet small chops, and luxury hampers in Port Harcourt. You can reach our team directly on WhatsApp at **${settings.whatsapp || '+234 806 512 4134'}** or call **${settings.phone || '+234 806 512 4134'}**. How can we help you today?`,
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

    // Sanitize turn history to strictly enforce Gemini API turn requirements:
    // 1. History must start with a 'user' turn (skip initial assistant greeting)
    // 2. Roles must strictly alternate between 'user' and 'model'
    let sanitizedHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      const firstUserIdx = history.findIndex(
        (h: any) => h && h.role === 'user' && typeof h.text === 'string' && h.text.trim().length > 0
      );
      if (firstUserIdx !== -1) {
        const rawTurns = history.slice(firstUserIdx);
        for (const item of rawTurns) {
          if (!item || !item.text || typeof item.text !== 'string') continue;
          const role: 'user' | 'model' = item.role === 'user' ? 'user' : 'model';
          if (
            sanitizedHistory.length > 0 &&
            sanitizedHistory[sanitizedHistory.length - 1].role === role
          ) {
            sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += `\n${item.text}`;
          } else {
            sanitizedHistory.push({
              role,
              parts: [{ text: item.text }],
            });
          }
        }
      }
    }

    let contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
      const lastUserTurn = sanitizedHistory.pop();
      const combinedUserText = lastUserTurn
        ? `${lastUserTurn.parts[0].text}\n${message}`
        : message;
      contents = [...sanitizedHistory, { role: 'user', parts: [{ text: combinedUserText }] }];
    } else {
      contents = [...sanitizedHistory, { role: 'user', parts: [{ text: message }] }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const text =
      response.text ||
      `Thank you for reaching out to ${settings.businessName || 'Munachiama'}. Please connect with us directly on WhatsApp at ${settings.whatsapp || '+234 806 512 4134'}!`;

    res.json({ text });
  } catch (err: any) {
    console.error('[Gemini AI Chat Error]:', err?.message || err, err?.stack || '');

    let whatsapp = '+234 806 512 4134';
    let phone = '+234 806 512 4134';
    try {
      const settings = await getBusinessSettings();
      if (settings?.whatsapp) whatsapp = settings.whatsapp;
      if (settings?.phone) phone = settings.phone;
    } catch (e) {
      console.error('[Gemini AI Chat Error Fallback Settings]:', e);
    }

    res.status(200).json({
      text: `I'm sorry, I encountered a temporary technical delay processing your question. Please feel free to reach out directly to our team on WhatsApp at **${whatsapp}** or call **${phone}** for immediate assistance.`,
      error_debug: process.env.NODE_ENV !== 'production' ? err?.message : undefined,
    });
  }
});

// Global Express Error Handling Middleware (Ensures ALL server errors return valid JSON)
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[Global Server Error]:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || err.statusCode || 500).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.',
  });
});

// -------------------------------------------------------------
// STANDALONE SERVER STARTUP & WEBSOCKET SETUP (NON-VERCEL)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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

    const settings = await getBusinessSettings();

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
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }

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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer();
}

export default app;
