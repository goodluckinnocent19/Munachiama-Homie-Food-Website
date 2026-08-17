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

/**
 * Helper function to safely parse API responses.
 * Prevents "Unexpected end of JSON input" syntax errors on non-JSON or HTML responses.
 */
async function safeFetchJson<T = any>(res: Response, fallbackError = 'Request failed'): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    if (isJson) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `${fallbackError} (Status ${res.status})`);
    } else {
      const textText = await res.text().catch(() => '');
      const cleanMsg = textText.length > 0 && textText.length < 200 ? textText : `Server returned non-JSON error (Status ${res.status})`;
      throw new Error(cleanMsg);
    }
  }

  if (!isJson) {
    const textText = await res.text().catch(() => '');
    if (!textText || textText.trim().length === 0) {
      throw new Error(`Empty response received from server (${fallbackError})`);
    }
    try {
      return JSON.parse(textText) as T;
    } catch (e) {
      throw new Error(`Invalid JSON payload received from server for ${fallbackError}`);
    }
  }

  return res.json() as Promise<T>;
}

export async function fetchProducts(params?: { category?: string; featured?: boolean; search?: string; includeHidden?: boolean }): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.featured) query.append('featured', 'true');
  if (params?.search) query.append('search', params.search);
  if (params?.includeHidden) query.append('includeHidden', 'true');

  const res = await fetch(`${API_BASE}/products?${query.toString()}`);
  return safeFetchJson<Product[]>(res, 'Failed to fetch products');
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  return safeFetchJson<Category[]>(res, 'Failed to fetch categories');
}

export async function submitEnquiry(data: Partial<Enquiry>): Promise<{ success: boolean; enquiry: Enquiry; message: string; notice: string }> {
  const res = await fetch(`${API_BASE}/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return safeFetchJson(res, 'Failed to submit enquiry');
}

export async function fetchGallery(): Promise<GalleryItem[]> {
  const res = await fetch(`${API_BASE}/gallery`);
  return safeFetchJson<GalleryItem[]>(res, 'Failed to fetch gallery');
}

export async function fetchFAQs(): Promise<FAQItem[]> {
  const res = await fetch(`${API_BASE}/faqs`);
  return safeFetchJson<FAQItem[]>(res, 'Failed to fetch FAQs');
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
  return safeFetchJson(res, 'Failed to submit payment proof');
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
  return safeFetchJson(res, 'Order tracking record not found');
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
  return safeFetchJson(res, 'Login failed');
}

export async function fetchAdminEnquiries(token: string): Promise<Enquiry[]> {
  const res = await fetch(`${API_BASE}/enquiries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return safeFetchJson<Enquiry[]>(res, 'Failed to fetch enquiries');
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
  return safeFetchJson<Enquiry>(res, 'Failed to update enquiry status');
}

export async function fetchAdminOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return safeFetchJson<Order[]>(res, 'Failed to fetch orders');
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
  return safeFetchJson<Order>(res, 'Failed to update order');
}

export async function fetchAdminPaymentSubmissions(token: string): Promise<PaymentSubmission[]> {
  const res = await fetch(`${API_BASE}/payment-submissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return safeFetchJson<PaymentSubmission[]>(res, 'Failed to fetch payment submissions');
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
  return safeFetchJson(res, 'Failed to verify payment');
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
  return safeFetchJson(res, 'Failed to reject payment');
}

export async function fetchAdminPaymentPlans(token: string): Promise<PaymentPlan[]> {
  const res = await fetch(`${API_BASE}/payment-plans`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return safeFetchJson<PaymentPlan[]>(res, 'Failed to fetch payment plans');
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
  return safeFetchJson(res, 'Failed to create payment plan');
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
  return safeFetchJson<Installment>(res, 'Failed to update installment');
}

export async function fetchAdminPaymentAuditLogs(token: string): Promise<PaymentAuditLog[]> {
  const res = await fetch(`${API_BASE}/payment-audit-logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return safeFetchJson<PaymentAuditLog[]>(res, 'Failed to fetch payment audit logs');
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
  return safeFetchJson<Product>(res, 'Failed to create product');
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
  return safeFetchJson<Product>(res, 'Failed to update product');
}

export async function deleteAdminProduct(token: string, id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return safeFetchJson<{ success: boolean }>(res, 'Failed to delete product');
}

export async function fetchAdminMetrics(token: string): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE}/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return safeFetchJson<DashboardMetrics>(res, 'Failed to fetch metrics');
}

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  return safeFetchJson<BusinessSettings>(res, 'Failed to fetch business settings');
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
  return safeFetchJson(res, 'Failed to update business settings');
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
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  return safeFetchJson<{ text: string }>(res, 'Failed to communicate with Munachiama AI');
}

// Upload Product Image via Admin API Endpoint
export async function uploadAdminProductImage(token: string, file: File): Promise<string> {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Unsupported image format. Please select JPG, JPEG, PNG, or WEBP file.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 5MB limit. Please select a smaller file.`);
  }

  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.readAsDataURL(file);
  });

  const res = await fetch(`${API_BASE}/admin/upload-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileData: base64Data,
      fileName: file.name,
      mimeType: file.type,
    }),
  });

  const data = await safeFetchJson<{ success: boolean; url: string; error?: string }>(res, 'Image upload failed');
  if (!data.url) {
    throw new Error(data.error || 'Upload succeeded but no download URL was returned.');
  }
  return data.url;
}

