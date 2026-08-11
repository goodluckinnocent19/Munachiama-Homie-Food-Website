import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
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

// IMAGE UPLOAD ENDPOINT (Admin Failsafe)
app.post('/api/upload', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image file or data provided.' });
    }
    res.json({ success: true, url: image });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to upload image' });
  }
});

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
app.post('/api/payments/submit-transfer', async (req: Request, res: Response) => {
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

    const totalAmount = plan ? plan.total_amount : ('total_amount' in order && order.total_amount ? order.total_amount : 0);
    const totalVerifiedPaid = orderSubmissions
      .filter((s) => s.status === 'Verified')
      .reduce((sum, s) => sum + s.amount_submitted, 0);

    const outstandingBalance = Math.max(0, totalAmount - totalVerifiedPaid);
    const paymentProgressPercent = totalAmount > 0 ? Math.min(100, Math.round((totalVerifiedPaid / totalAmount) * 100)) : (order.payment_status === 'Paid' || order.payment_status === 'Verified' ? 100 : 0);

    res.json({
      order,
      payment_plan: plan || null,
      installments: orderInstallments,
      payment_submissions: orderSubmissions,
      notifications: orderNotifs,
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

    // Recalculate order status
    const orders = await getOrders();
    const enquiries = await getEnquiries();
    const plans = await getPaymentPlans();
    const order = orders.find((o) => o.id === orderId);
    const enquiry = enquiries.find((e) => e.id === orderId);
    const plan = plans.find((p) => p.order_id === orderId);

    const allVerifiedSubs = (await getPaymentSubmissions()).filter((s) => s.order_id === orderId && s.status === 'Verified');
    const totalPaid = allVerifiedSubs.reduce((sum, s) => sum + s.amount_submitted, 0);

    let targetTotal = order?.total_amount || plan?.total_amount || 0;
    let newPaymentStatus: PaymentStatus = 'Partially Paid';
    let newOrderStatus: OrderStatus = 'Confirmed';

    if (targetTotal > 0 && totalPaid >= targetTotal) {
      newPaymentStatus = 'Verified';
      newOrderStatus = 'Confirmed';
      if (plan) await savePaymentPlan({ ...plan, status: 'Completed', updated_at: new Date().toISOString() });
    } else if (totalPaid > 0) {
      newPaymentStatus = 'Partially Paid';
      newOrderStatus = 'Confirmed';
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

// -------------------------------------------------------------
// WEBSOCKET SERVER FOR GEMINI LIVE VOICE (CONTAINER HOSTS)
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

// -------------------------------------------------------------
// VITE DEV SERVER OR STATIC SERVING
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

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer();
}

export default app;
