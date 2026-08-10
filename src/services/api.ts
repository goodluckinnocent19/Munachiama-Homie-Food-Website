import {
  Product,
  Category,
  Enquiry,
  Order,
  GalleryItem,
  FAQItem,
  DashboardMetrics,
  AdminUser,
  PaymentPlan,
  Installment,
  PaymentSubmission,
  PaymentAuditLog,
  CustomerNotification,
  BusinessSettings,
} from '../types';

const API_BASE = '/api';

export async function fetchProducts(params?: { category?: string; featured?: boolean; search?: string; includeHidden?: boolean }): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.featured) query.append('featured', 'true');
  if (params?.search) query.append('search', params.search);
  if (params?.includeHidden) query.append('includeHidden', 'true');

  const res = await fetch(`${API_BASE}/products?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function submitEnquiry(data: Partial<Enquiry>): Promise<{ success: boolean; enquiry: Enquiry; message: string; notice: string }> {
  const res = await fetch(`${API_BASE}/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit enquiry');
  }
  return res.json();
}

export async function fetchGallery(): Promise<GalleryItem[]> {
  const res = await fetch(`${API_BASE}/gallery`);
  if (!res.ok) throw new Error('Failed to fetch gallery');
  return res.json();
}

export async function fetchFAQs(): Promise<FAQItem[]> {
  const res = await fetch(`${API_BASE}/faqs`);
  if (!res.ok) throw new Error('Failed to fetch FAQs');
  return res.json();
}

// -------------------------------------------------------------
// PUBLIC PAYMENT & TRACKING API
// -------------------------------------------------------------

export async function submitBankTransfer(data: {
  order_id: string;
  installment_id?: string;
  payment_plan_id?: string;
  customer_name?: string;
  customer_phone?: string;
  amount_submitted: number;
  payment_reference: string;
  bank_name?: string;
  payment_date?: string;
  notes?: string;
  proof_url?: string;
}): Promise<{ success: boolean; submission: PaymentSubmission; headline: string; message: string; bank_account: any }> {
  const res = await fetch(`${API_BASE}/payments/submit-transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit payment proof');
  }
  return res.json();
}

export async function trackOrderAndPayment(orderId: string): Promise<{
  order: Order | Enquiry;
  payment_plan: PaymentPlan | null;
  installments: Installment[];
  payment_submissions: PaymentSubmission[];
  notifications: CustomerNotification[];
  summary: {
    total_amount: number;
    total_verified_paid: number;
    outstanding_balance: number;
    payment_progress_percent: number;
    bank_details: { account_name: string; bank: string; account_number: string };
  };
}> {
  const res = await fetch(`${API_BASE}/orders/track/${encodeURIComponent(orderId)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Order tracking record not found');
  }
  return res.json();
}

// -------------------------------------------------------------
// ADMIN PAYMENT VERIFICATION & INSTALLMENT MANAGEMENT
// -------------------------------------------------------------

export async function adminLogin(credentials: { username: string; password: string }): Promise<{ token: string; user: AdminUser }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

export async function fetchAdminEnquiries(token: string): Promise<Enquiry[]> {
  const res = await fetch(`${API_BASE}/enquiries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch enquiries');
  return res.json();
}

export async function updateEnquiryStatus(token: string, id: string, updates: Partial<Enquiry>): Promise<Enquiry> {
  const res = await fetch(`${API_BASE}/enquiries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update enquiry status');
  return res.json();
}

export async function fetchAdminOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function updateOrderStatus(token: string, id: string, updates: Partial<Order>): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update order');
  return res.json();
}

export async function fetchAdminPaymentSubmissions(token: string): Promise<PaymentSubmission[]> {
  const res = await fetch(`${API_BASE}/payment-submissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch payment submissions');
  return res.json();
}

export async function verifyPaymentSubmission(token: string, id: string, payload?: { notes?: string; verified_amount?: number }): Promise<{ success: boolean; message: string; submission: PaymentSubmission }> {
  const res = await fetch(`${API_BASE}/payment-submissions/${id}/verify`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to verify payment');
  }
  return res.json();
}

export async function rejectPaymentSubmission(token: string, id: string, rejection_reason: string): Promise<{ success: boolean; message: string; submission: PaymentSubmission }> {
  const res = await fetch(`${API_BASE}/payment-submissions/${id}/reject`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rejection_reason }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to reject payment');
  }
  return res.json();
}

export async function fetchAdminPaymentPlans(token: string): Promise<PaymentPlan[]> {
  const res = await fetch(`${API_BASE}/payment-plans`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch payment plans');
  return res.json();
}

export async function createAdminPaymentPlan(token: string, planData: {
  order_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  total_amount: number;
  number_of_installments: number;
  installments?: Array<{ installment_number: number; amount: number; due_date: string; notes?: string }>;
  notes?: string;
  payment_instructions?: string;
}): Promise<{ success: boolean; plan: PaymentPlan; installments: Installment[] }> {
  const res = await fetch(`${API_BASE}/payment-plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(planData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create payment plan');
  }
  return res.json();
}

export async function updateAdminInstallment(token: string, id: string, updates: Partial<Installment>): Promise<Installment> {
  const res = await fetch(`${API_BASE}/installments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update installment');
  return res.json();
}

export async function fetchAdminPaymentAuditLogs(token: string): Promise<PaymentAuditLog[]> {
  const res = await fetch(`${API_BASE}/payment-audit-logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch payment audit logs');
  return res.json();
}

export async function createAdminProduct(token: string, productData: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create product');
  }
  return res.json();
}

export async function updateAdminProduct(token: string, id: string, productData: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function deleteAdminProduct(token: string, id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

export async function fetchAdminMetrics(token: string): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE}/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch business settings');
  return res.json();
}

export async function updateBusinessSettings(token: string, settings: Partial<BusinessSettings>): Promise<{ success: boolean; message: string; settings: BusinessSettings }> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update business settings');
  }
  return res.json();
}

// Generate pre-filled WhatsApp link
export function buildWhatsAppLink(details?: { name?: string; enquiryType?: string; date?: string; quantity?: string; phoneNum?: string }): string {
  const rawPhone = details?.phoneNum ? details.phoneNum.replace(/[^0-9]/g, '') : '2348065124134';
  const phone = rawPhone || '2348065124134'; // Official Brand WhatsApp line: +234 806 512 4134
  let msg = 'Hello Munachiama | Chiama21 Hommie Foods, I would like to make an enquiry about an order.';
  if (details?.name) {
    msg = `Hello Munachiama | Chiama21 Hommie Foods, my name is ${details.name}. I would like to enquire about ${details.enquiryType || 'catering/drinks'} for ${details.date || 'an upcoming event'} (${details.quantity || 'custom quantity'}).`;
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// Send Chat Message to Server-Side Gemini AI Concierge
export async function sendChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; text: string }>
): Promise<{ text: string }> {
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('[AI Chat API Error] Response not OK:', res.status, res.statusText, errData);
      throw new Error(errData.error || `Server error (${res.status}): Failed to communicate with Munachiama AI`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('[AI Chat API Fetch Error]:', err);
    throw err;
  }
}

