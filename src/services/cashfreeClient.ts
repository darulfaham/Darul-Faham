import { Order, PaymentRecord, CouponUsage, BookAccess } from '../types';
import { db, collection, addDoc, updateDoc, doc, serverTimestamp } from './dataService';

export interface CashfreeStatusResponse {
  isConfigured: boolean;
  environment: string;
  appIdMasked: string | null;
  supportedPaymentModes: string[];
  apiVersion: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  title?: string;
  discountType?: 'FLAT' | 'PERCENTAGE';
  discountAmount?: number;
  originalAmount?: number;
  finalAmount?: number;
  error?: string;
}

export interface CreateOrderParams {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  productType: 'MEMBERSHIP' | 'MEMBERSHIP_RENEWAL' | 'TEST_SERIES' | 'DIGITAL_BOOK' | 'COURSE';
  productId: string;
  productTitle: string;
  originalAmount: number;
  couponCode?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId: string;
  cashfreeOrderId: string;
  paymentSessionId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string | null;
  currency: string;
  status: string;
  isLiveGateway: boolean;
  error?: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  cashfreeOrderId: string;
  paymentSessionId: string;
  paymentMethod: string;
  simulateOutcome?: 'SUCCESS' | 'PENDING' | 'FAILED';
  studentId: string;
  studentName: string;
  productTitle: string;
  productType: 'MEMBERSHIP' | 'MEMBERSHIP_RENEWAL' | 'TEST_SERIES' | 'DIGITAL_BOOK' | 'COURSE';
  productId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  receiptNumber?: string;
  cashfreeReference?: string;
  paymentMethod?: string;
  verifiedAt?: string;
  error?: string;
  message?: string;
}

// 1. Check Cashfree Gateway Status from server
export const checkCashfreeStatus = async (): Promise<CashfreeStatusResponse> => {
  try {
    const res = await fetch('/api/cashfree/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend status endpoint unreachable, using fallback defaults:', err);
  }
  return {
    isConfigured: false,
    environment: 'SANDBOX',
    appIdMasked: null,
    supportedPaymentModes: ['UPI', 'NETBANKING', 'CARDS'],
    apiVersion: '2023-08-01',
  };
};

// 2. Validate Coupon via Server
export const validateCoupon = async (
  code: string,
  amount: number,
  productType: string
): Promise<CouponValidationResult> => {
  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, amount, productType }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { valid: false, error: data.error || 'Coupon validation failed' };
    }
    return data;
  } catch (err: any) {
    return { valid: false, error: err.message || 'Unable to contact server for coupon verification' };
  }
};

// 3. Initiate Order with Server-Side Cashfree Creation
export const initiateCashfreeOrder = async (params: CreateOrderParams): Promise<CreateOrderResult> => {
  try {
    const res = await fetch('/api/cashfree/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Server failed to initialize Cashfree order session');
    }

    // Record initial order state into Database (status: PENDING)
    const newOrder: Order = {
      id: data.orderId,
      studentId: params.studentId,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      studentPhone: params.studentPhone,
      productType: params.productType,
      productId: params.productId,
      productTitle: params.productTitle,
      originalAmount: data.originalAmount,
      couponCode: data.couponCode || undefined,
      discountAmount: data.discountAmount,
      finalAmount: data.finalAmount,
      currency: data.currency || 'INR',
      status: 'PENDING',
      cashfreeOrderId: data.cashfreeOrderId,
      cashfreePaymentSessionId: data.paymentSessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'orders'), newOrder);

    return data;
  } catch (err: any) {
    console.error('Order initiation failed:', err);
    throw err;
  }
};

// 4. Verify Payment with Server and Finalize Entitlements
export const verifyAndFinalizePayment = async (params: VerifyPaymentParams): Promise<VerifyPaymentResult> => {
  try {
    const res = await fetch('/api/cashfree/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: params.orderId,
        cashfreeOrderId: params.cashfreeOrderId,
        paymentSessionId: params.paymentSessionId,
        paymentMethod: params.paymentMethod,
        simulateOutcome: params.simulateOutcome,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success || data.status !== 'SUCCESS') {
      // Update order status in DB to FAILED or PENDING
      try {
        await updateDoc(doc(db, 'orders', params.orderId), {
          status: data.status === 'PENDING' ? 'PENDING' : 'FAILED',
          failureReason: data.error || 'Authorization failed',
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not update order failure status:', e);
      }
      return {
        success: false,
        status: data.status || 'FAILED',
        error: data.error || data.message || 'Payment not verified by gateway',
      };
    }

    // Success! Update Order to PAID
    await updateDoc(doc(db, 'orders', params.orderId), {
      status: 'PAID',
      paymentMethod: data.paymentMethod,
      updatedAt: data.verifiedAt,
    });

    // Record verified receipt in payments collection
    const paymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: params.orderId,
      studentId: params.studentId,
      studentName: params.studentName,
      productTitle: params.productTitle,
      productType: params.productType,
      originalAmount: params.originalAmount,
      discountAmount: params.discountAmount,
      finalAmount: params.finalAmount,
      currency: 'INR',
      paymentMethod: data.paymentMethod,
      cashfreeReference: data.cashfreeReference,
      receiptNumber: data.receiptNumber,
      status: 'SUCCESS',
      paidAt: data.verifiedAt,
      createdAt: data.verifiedAt,
    };

    await addDoc(collection(db, 'payments'), paymentRecord);

    // If coupon was applied, record coupon usage to prevent double-spending
    if (params.couponCode && params.discountAmount > 0) {
      const couponUsageRecord: CouponUsage = {
        id: `use-${Date.now()}`,
        couponId: `coup-${params.couponCode}`,
        couponCode: params.couponCode,
        studentId: params.studentId,
        orderId: params.orderId,
        discountAmount: params.discountAmount,
        usedAt: data.verifiedAt,
      };
      await addDoc(collection(db, 'couponUsage'), couponUsageRecord);
    }

    // If product is a DIGITAL_BOOK, grant access entitlement
    if (params.productType === 'DIGITAL_BOOK') {
      const accessRecord: BookAccess = {
        id: `ba-${Date.now()}`,
        studentId: params.studentId,
        bookId: params.productId,
        accessType: 'PAID',
        grantedAt: data.verifiedAt,
        orderId: params.orderId,
      };
      await addDoc(collection(db, 'bookAccess'), accessRecord);
    }

    // Log security & financial audit record
    try {
      await addDoc(collection(db, 'audit_logs'), {
        adminId: 'system-cashfree-pg',
        adminName: 'Cashfree Payment Gateway (Verified)',
        action: 'PAYMENT_RECEIVED',
        targetStudent: params.studentId,
        targetStudentName: params.studentName,
        timestamp: data.verifiedAt,
        severity: 'low',
        ip: '10.0.4.12',
        details: `Settled ₹${params.finalAmount} for ${params.productTitle}. Receipt: ${data.receiptNumber}. Ref: ${data.cashfreeReference}`,
      });
    } catch (e) {
      // audit log error non-blocking
    }

    return {
      success: true,
      status: 'SUCCESS',
      receiptNumber: data.receiptNumber,
      cashfreeReference: data.cashfreeReference,
      paymentMethod: data.paymentMethod,
      verifiedAt: data.verifiedAt,
    };
  } catch (err: any) {
    console.error('Payment verification error:', err);
    return {
      success: false,
      status: 'FAILED',
      error: err.message || 'Payment verification failed',
    };
  }
};
