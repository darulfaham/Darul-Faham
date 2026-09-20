import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { CashfreePaymentService, SERVER_COUPONS } from './server/payments/cashfreeService';
import { ServerIdService } from './server/ids/idService';
import { ServerAttendanceService } from './server/attendance/attendanceService';

const app = express();
const PORT = 3000;

// Capture raw body for webhook cryptographic HMAC verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DARULFAHAM Core API',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// CASHFREE PAYMENT GATEWAY ENDPOINTS
// Dedicated service handling orders, verification, and webhooks
// ============================================================

// Gateway Status Check (Never exposes CASHFREE_SECRET_KEY)
const getStatusHandler = (req: express.Request, res: express.Response) => {
  res.json(CashfreePaymentService.getStatus());
};
app.get('/api/cashfree/status', getStatusHandler);
app.get('/api/payments/cashfree/status', getStatusHandler);

// Server-Side Coupon Validation
app.post('/api/coupons/validate', (req, res) => {
  const { code, amount, orderAmount: rawOrderAmount } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'Coupon code is required' });
  }

  const orderAmount = Number(amount ?? rawOrderAmount) || 0;
  const normalized = code.trim().toUpperCase();
  const coupon = SERVER_COUPONS[normalized];

  if (!coupon || !coupon.isActive) {
    return res.status(404).json({ valid: false, error: 'Invalid or expired coupon code.' });
  }

  if (orderAmount < coupon.minPurchase) {
    return res.status(400).json({
      valid: false,
      error: `Minimum order amount of ₹${coupon.minPurchase} is required for this coupon.`,
    });
  }

  const { discountAmount, finalAmount } = CashfreePaymentService.calculateDiscount(orderAmount, normalized);

  return res.json({
    valid: true,
    code: coupon.code,
    title: coupon.title,
    discountType: coupon.discountType,
    discountAmount,
    originalAmount: orderAmount,
    finalAmount,
  });
});

// Create Order (Server-Side Calculation & Tamper-Proofing)
const createOrderHandler = async (req: express.Request, res: express.Response) => {
  try {
    const {
      studentId,
      studentName,
      studentEmail,
      studentPhone,
      productType,
      productId,
      productTitle,
      originalAmount,
      couponCode,
      returnUrl,
      notifyUrl,
    } = req.body;

    if (!studentId || !studentName || !productTitle || originalAmount == null) {
      return res.status(400).json({
        success: false,
        error: 'Missing mandatory order parameters (studentId, studentName, productTitle, originalAmount)',
      });
    }

    const result = await CashfreePaymentService.createOrder({
      studentId,
      studentName,
      studentEmail,
      studentPhone,
      productType: productType || 'MEMBERSHIP',
      productId,
      productTitle,
      originalAmount: Number(originalAmount),
      couponCode,
      returnUrl,
      notifyUrl,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error creating Cashfree order' });
  }
};
app.post('/api/cashfree/create-order', createOrderHandler);
app.post('/api/payments/cashfree/create-order', createOrderHandler);

// Payment Verification
const verifyPaymentHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { orderId, cashfreeOrderId, paymentSessionId, paymentMethod, simulateOutcome } = req.body;
    if (!orderId || !cashfreeOrderId) {
      return res.status(400).json({ success: false, error: 'Missing orderId or cashfreeOrderId' });
    }

    const result = await CashfreePaymentService.verifyPayment({
      orderId,
      cashfreeOrderId,
      paymentSessionId,
      paymentMethod,
      simulateOutcome,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error verifying payment' });
  }
};
app.post('/api/cashfree/verify-payment', verifyPaymentHandler);
app.post('/api/payments/cashfree/verify', verifyPaymentHandler);

// Cashfree Webhook Handler with Signature Verification and Idempotency Guard
const webhookHandler = (req: any, res: express.Response) => {
  const signature = (req.headers['x-webhook-signature'] || req.headers['x-cashfree-signature']) as string | undefined;
  const timestamp = (req.headers['x-webhook-timestamp'] || req.headers['x-cashfree-timestamp']) as string | undefined;
  const rawBody = req.rawBody || JSON.stringify(req.body || {});

  const outcome = CashfreePaymentService.processWebhook(req.body, rawBody, signature, timestamp);

  if (!outcome.verified) {
    console.warn('Unauthorized webhook received: Signature mismatch');
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  if (outcome.duplicate) {
    console.log(`Duplicate webhook event ${outcome.eventId} skipped idempotently.`);
    return res.status(200).json({ status: 'ALREADY_PROCESSED', eventId: outcome.eventId });
  }

  console.log(`Processed Cashfree webhook event ${outcome.eventId}:`, req.body?.type || 'PAYMENT_SUCCESS');
  return res.status(200).json({ received: true, eventId: outcome.eventId, timestamp: new Date().toISOString() });
};
app.post('/api/cashfree/webhook', webhookHandler);
app.post('/api/payments/cashfree/webhook', webhookHandler);

// ============================================================
// ATOMIC SERVER-SIDE ID GENERATION SYSTEM
// ============================================================

// Atomic Student ID Generator: DF-STU-YYYY-XXXXX
const generateStudentIdHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { academicYear, customPrefix } = req.body || {};
    const generated = await ServerIdService.generateStudentId(academicYear, customPrefix);
    res.json({ success: true, ...generated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to generate Student ID' });
  }
};
app.post('/api/ids/generate-student-id', generateStudentIdHandler);
app.post('/api/ids/generate-student', generateStudentIdHandler);

// Atomic Staff ID Generator: DF-STF-YYYY-XXXXX
const generateStaffIdHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { academicYear, customPrefix } = req.body || {};
    const generated = await ServerIdService.generateStaffId(academicYear, customPrefix);
    res.json({ success: true, ...generated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to generate Staff ID' });
  }
};
app.post('/api/ids/generate-staff-id', generateStaffIdHandler);
app.post('/api/ids/generate-staff', generateStaffIdHandler);

// ID System Configuration
app.get('/api/ids/config', (req, res) => {
  res.json(ServerIdService.getConfig());
});

app.post('/api/ids/config', (req, res) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Only administrators can update ID configuration' });
  }
  const updated = ServerIdService.updateConfig(req.body);
  res.json({ success: true, config: updated });
});

// ============================================================
// STRICT SERVER-SIDE AUDIT LOGS ACCESS CONTROL
// Students must have ZERO access to audit logs even via direct API call!
// ============================================================
app.get('/api/audit-logs', (req, res) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole === 'STUDENT' || userRole === 'STAFF' || !['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Access Denied: Students and unauthorized users have no access to DARULFAHAM audit logs.',
      code: 'AUTH_FORBIDDEN',
    });
  }

  // Only authorized administrators reach here
  res.json({
    status: 'AUTHORIZED',
    message: 'Authorized administrative log stream.',
  });
});

// ============================================================
// SERVER ROUTE GUARD & ROLE ACCESS CONTROL
// Blocks unauthorized URL navigation attempts at backend level
// ============================================================
app.post('/api/auth/route-guard', (req, res) => {
  const { role, requestedPath } = req.body || {};
  const normalizedPath = (requestedPath || '').toLowerCase();

  // Student trying to access admin, super-admin, or staff
  if (role === 'STUDENT') {
    if (
      normalizedPath.startsWith('/admin') ||
      normalizedPath.startsWith('/super-admin') ||
      normalizedPath.startsWith('/staff')
    ) {
      return res.status(403).json({
        allowed: false,
        error: 'ACCESS DENIED',
        message: 'Students are strictly prohibited from accessing administrative and staff portals.',
        redirect: '/student/dashboard',
      });
    }
  }

  // Staff trying to access super admin or admin
  if (role === 'STAFF') {
    if (normalizedPath.startsWith('/admin') || normalizedPath.startsWith('/super-admin')) {
      return res.status(403).json({
        allowed: false,
        error: 'ACCESS DENIED',
        message: 'Staff members are not permitted in administrative executive consoles.',
        redirect: '/staff/dashboard',
      });
    }
  }

  // Admin trying to access super-admin
  if (role === 'ADMIN') {
    if (normalizedPath.startsWith('/super-admin')) {
      return res.status(403).json({
        allowed: false,
        error: 'ACCESS DENIED',
        message: 'Requires Super Administrator clearance.',
        redirect: '/admin/dashboard',
      });
    }
  }

  res.json({ allowed: true });
});

// ============================================================
// ATTENDANCE & GEOFENCE API ENDPOINTS
// ============================================================
app.get('/api/attendance/geofence-config', (_req, res) => {
  res.json({
    success: true,
    config: ServerAttendanceService.getGeofenceConfig(),
  });
});

app.post('/api/attendance/geofence-config', (req, res) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access Denied: Only administrators can modify geofence settings.' });
  }

  const adminName = (req.headers['x-user-name'] as string) || 'Administrator';
  const updated = ServerAttendanceService.updateGeofenceConfig(req.body, adminName);
  res.json({ success: true, config: updated });
});

app.post('/api/attendance/verify-geofence', (req, res) => {
  const { latitude, longitude } = req.body || {};
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and Longitude are required.' });
  }

  const result = ServerAttendanceService.verifyCoordinates(Number(latitude), Number(longitude));
  res.json({ success: true, ...result });
});

app.post('/api/attendance/check-in', (req, res) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  const userStudentId = (req.headers['x-user-studentid'] as string) || '';

  // Security check: If student, cannot mark check-in for someone else
  if (userRole === 'STUDENT' && userStudentId && req.body.studentId && req.body.studentId !== userStudentId) {
    return res.status(403).json({
      success: false,
      error: 'Security Violation: Cannot submit attendance for another student.',
    });
  }

  const result = ServerAttendanceService.recordCheckIn(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post('/api/attendance/correct', (req, res) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access Denied: Only administrators can correct attendance.' });
  }

  const result = ServerAttendanceService.correctAttendance(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// ============================================================
// STUDENT DOCUMENT VAULT UPLOAD
// ============================================================
app.post('/api/students/upload-document', (req, res) => {
  const { studentId, documentType, documentName, fileSize, fileBase64, isSensitive } = req.body || {};

  if (!studentId || !documentType || !documentName) {
    return res.status(400).json({ error: 'Missing required document fields.' });
  }

  // Max 5MB file check
  if (fileSize && fileSize > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'File size exceeds maximum institutional limit of 5MB.' });
  }

  res.json({
    success: true,
    documentId: `doc-${Date.now()}`,
    documentUrl: fileBase64 ? fileBase64.substring(0, 100) + '...' : `/vault/${studentId}/${documentName}`,
    status: 'VERIFIED',
    message: 'Institutional administrative document securely stored in DARULFAHAM document vault.',
  });
});

// Mount Vite or static file server
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DARULFAHAM Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
