export type CategorySlug =
  | 'natural-drinks'
  | 'fresh-juices'
  | 'small-chops'
  | 'mocktails-cocktails'
  | 'parfaits'
  | 'healthy-salads'
  | 'chicken-wrap'
  | 'sandwiches'
  | 'luxury-gifting'
  | 'hampers'
  | 'event-catering'
  | string;

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  description: string;
  image_url: string;
  active: boolean;
  item_count?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: CategorySlug;
  description: string;
  price: number | null; // null if request price
  price_text?: string; // e.g. "₦25,000 / platter" or "Quote on Request"
  image_url: string;
  featured: boolean;
  available: boolean;
  availability?: 'AVAILABLE' | 'OUT_OF_STOCK' | 'HIDDEN';
  minimum_order_quantity?: string | number;
  display_order?: number;
  ingredients?: string[];
  serves_text?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
  created_at: string;
}

export type EventType =
  | 'wedding'
  | 'corporate'
  | 'birthday'
  | 'private_party'
  | 'bridal_shower'
  | 'gifting'
  | 'corporate_gifting'
  | 'personal_order'
  | 'other';

export type OrderStatus =
  | 'New'
  | 'Contacted'
  | 'Quote Sent'
  | 'Awaiting Payment'
  | 'Payment Verification'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Completed'
  | 'Cancelled';

export type EnquiryStatus = OrderStatus;

export type PaymentStatus =
  | 'Unpaid'
  | 'Payment Submitted'
  | 'Under Review'
  | 'Partially Paid'
  | 'Paid'
  | 'Verified'
  | 'Rejected'
  | 'Overdue'
  | 'Refunded';

export type PlanType = 'Standard' | 'Volume Installment';

export type PaymentPlanStatus =
  | 'Pending Approval'
  | 'Approved'
  | 'Active'
  | 'Completed'
  | 'Cancelled';

export type InstallmentStatus =
  | 'Pending'
  | 'Submitted'
  | 'Under Review'
  | 'Verified'
  | 'Rejected'
  | 'Overdue';

export interface PaymentPlan {
  id: string;
  order_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  plan_type: PlanType;
  total_amount: number;
  number_of_installments: number;
  status: PaymentPlanStatus;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  payment_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Installment {
  id: string;
  payment_plan_id: string;
  order_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  payment_status: InstallmentStatus;
  paid_at?: string;
  payment_reference?: string;
  verified_by?: string;
  verification_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentSubmission {
  id: string;
  order_id: string;
  installment_id?: string;
  payment_plan_id?: string;
  customer_name: string;
  customer_phone: string;
  payment_method: 'Bank Transfer' | 'Paystack' | 'Flutterwave' | 'Card';
  amount_expected: number;
  amount_submitted: number;
  payment_reference: string;
  bank_name?: string;
  payment_date: string;
  proof_url?: string;
  notes?: string;
  status: 'Submitted' | 'Under Review' | 'Verified' | 'Rejected';
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface PaymentAuditLog {
  id: string;
  admin_id: string;
  admin_username: string;
  action: string;
  order_id: string;
  payment_plan_id?: string;
  installment_id?: string;
  submission_id?: string;
  previous_status?: string;
  new_status?: string;
  note?: string;
  timestamp: string;
}

export interface CustomerNotification {
  id: string;
  order_id: string;
  customer_phone: string;
  type: 'Quote Created' | 'Plan Approved' | 'Installment Due' | 'Payment Submitted' | 'Payment Verified' | 'Payment Rejected' | 'Overdue Notice' | 'Order Confirmed';
  title: string;
  message: string;
  whatsapp_link?: string;
  created_at: string;
}

export interface EnquiryStatusProps {
  status: OrderStatus;
}

export interface Enquiry {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  whatsapp: string;
  event_type: EventType;
  product_category?: CategorySlug | string;
  event_date: string;
  location: string;
  quantity: string;
  budget: string;
  message: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  order_type: EventType;
  items_summary: string;
  delivery_date: string;
  delivery_location: string;
  quantity: string;
  budget: string;
  notes?: string;
  product_subtotal?: number;
  service_charge?: number; // 20% of product subtotal
  logistics_charge?: number; // Distance-based logistics charge
  total_amount?: number; // Total payable
  total_payable?: number; // Total payable (subtotal + 20% service + logistics)
  payment_requirement?: 'FULL_PAYMENT';
  pricing_notice?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_plan_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PricingBreakdown {
  product_subtotal: number;
  service_charge: number; // 20%
  service_charge_percent: number; // 20
  logistics_charge: number;
  total_payable: number;
  stated_prices_notice: string;
  payment_policy_notice: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: CategorySlug | 'events' | 'tablescapes' | 'packaging';
  image_url: string;
  caption: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'ordering' | 'payment' | 'catering';
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor';
}

export interface DashboardMetrics {
  totalEnquiries: number;
  newEnquiries: number;
  confirmedOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenueEstimated: number;
  verifiedRevenue: number;
  pendingVerificationCount: number;
  outstandingInstallmentBalance: number;
  overdueInstallmentCount: number;
  partiallyPaidOrdersCount: number;
  fullyPaidOrdersCount: number;
  popularCategories: { name: string; count: number }[];
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  socialHandle: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  snapchat: string;
  updated_at?: string;
}
