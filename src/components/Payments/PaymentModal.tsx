import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Tag,
  X,
  Printer,
  Download,
  Receipt,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '../../types';
import {
  checkCashfreeStatus,
  validateCoupon,
  initiateCashfreeOrder,
  verifyAndFinalizePayment,
  CashfreeStatusResponse,
} from '../../services/cashfreeClient';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  product: {
    productId: string;
    productTitle: string;
    productType: 'MEMBERSHIP' | 'MEMBERSHIP_RENEWAL' | 'TEST_SERIES' | 'DIGITAL_BOOK' | 'COURSE';
    amount: number;
    details?: string;
  };
  onSuccess: (receiptNumber: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  product,
  onSuccess,
}) => {
  const [step, setStep] = useState<'checkout' | 'processing' | 'result'>('checkout');
  const [paymentMethod, setPaymentMethod] = useState<'UPI_QR' | 'UPI_APP' | 'CARD' | 'NETBANKING'>('UPI_APP');
  const [upiApp, setUpiApp] = useState<'GPAY' | 'PHONEPE' | 'PAYTM'>('GPAY');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    title: string;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Cashfree Gateway Status
  const [gatewayStatus, setGatewayStatus] = useState<CashfreeStatusResponse | null>(null);

  // Active Transaction Details
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [cashfreeOrderId, setCashfreeOrderId] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [simulateOutcome, setSimulateOutcome] = useState<'SUCCESS' | 'PENDING' | 'FAILED'>('SUCCESS');

  // Outcome Details
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    receiptNumber?: string;
    cashfreeReference?: string;
    error?: string;
    verifiedAt?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('checkout');
      setAppliedCoupon(null);
      setCouponInput('');
      setCouponError(null);
      setPaymentResult(null);
      setSimulateOutcome('SUCCESS');

      checkCashfreeStatus().then((status) => {
        setGatewayStatus(status);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const originalAmount = product.amount;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalAmount = Math.max(0, originalAmount - discountAmount);

  // Handle Coupon Application
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);

    const res = await validateCoupon(couponInput.trim(), originalAmount, product.productType);
    setIsValidatingCoupon(false);

    if (res.valid && res.code && res.discountAmount !== undefined) {
      setAppliedCoupon({
        code: res.code,
        title: res.title || 'Discount applied',
        discountAmount: res.discountAmount,
      });
    } else {
      setCouponError(res.error || 'Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  // Proceed with Cashfree Order Creation and Payment Verification
  const handlePayNow = async () => {
    setStep('processing');
    try {
      // Step 1: Server-side Cashfree order creation (secret key stays on server)
      const orderRes = await initiateCashfreeOrder({
        studentId: currentUser.studentId || currentUser.uid,
        studentName: currentUser.displayName,
        studentEmail: currentUser.email,
        productType: product.productType,
        productId: product.productId,
        productTitle: product.productTitle,
        originalAmount,
        couponCode: appliedCoupon?.code,
      });

      setActiveOrderId(orderRes.orderId);
      setCashfreeOrderId(orderRes.cashfreeOrderId);
      setPaymentSessionId(orderRes.paymentSessionId);

      // Simulated network transit / Bank gateway handshake
      setTimeout(async () => {
        // Step 2: Server-side Verification
        const methodLabel =
          paymentMethod === 'UPI_APP'
            ? `UPI (${upiApp})`
            : paymentMethod === 'UPI_QR'
            ? 'UPI QR Code Scan'
            : paymentMethod === 'CARD'
            ? 'Card (Debit/Credit)'
            : 'Net Banking (HDFC/SBI)';

        const verifyRes = await verifyAndFinalizePayment({
          orderId: orderRes.orderId,
          cashfreeOrderId: orderRes.cashfreeOrderId,
          paymentSessionId: orderRes.paymentSessionId,
          paymentMethod: methodLabel,
          simulateOutcome,
          studentId: currentUser.studentId || currentUser.uid,
          studentName: currentUser.displayName,
          productTitle: product.productTitle,
          productType: product.productType,
          productId: product.productId,
          originalAmount,
          discountAmount: orderRes.discountAmount,
          finalAmount: orderRes.finalAmount,
          couponCode: appliedCoupon?.code,
        });

        setPaymentResult({
          success: verifyRes.success,
          status: verifyRes.status,
          receiptNumber: verifyRes.receiptNumber,
          cashfreeReference: verifyRes.cashfreeReference,
          error: verifyRes.error,
          verifiedAt: verifyRes.verifiedAt,
        });

        setStep('result');

        if (verifyRes.success && verifyRes.receiptNumber) {
          onSuccess(verifyRes.receiptNumber);
        }
      }, 1400);
    } catch (err: any) {
      setPaymentResult({
        success: false,
        status: 'FAILED',
        error: err.message || 'Failed to initiate order session with Cashfree',
      });
      setStep('result');
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        id="cashfree-payment-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden text-slate-900 transition-all"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-500/20 border border-indigo-400/30 rounded-xl flex items-center justify-center text-indigo-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-white">DARULFAHAM Payment Gateway</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cashfree PG
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                256-Bit Encrypted • Server-Verified Transactions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step: Checkout Details */}
        {step === 'checkout' && (
          <div className="p-6 space-y-5">
            {/* Product Summary Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {product.productType.replace('_', ' ')}
                  </span>
                  <h4 className="font-bold text-slate-900 text-base mt-1.5">{product.productTitle}</h4>
                  {product.details && (
                    <p className="text-xs text-slate-500 mt-1">{product.details}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Aspirant:</span>
                    <span>{currentUser.displayName}</span>
                    <span className="font-mono text-[11px] text-slate-400">({currentUser.studentId})</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    ₹{originalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-indigo-600" />
                  Have a Coupon or Referral Code?
                </label>
                <span className="text-[11px] text-slate-500">
                  Try: <strong className="text-indigo-600 font-mono">DARUL100</strong>, <strong className="text-indigo-600 font-mono">WELCOME50</strong>
                </span>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold font-mono uppercase">{appliedCoupon.code}</p>
                      <p className="text-[11px] text-emerald-700">
                        {appliedCoupon.title} (Saved ₹{appliedCoupon.discountAmount})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code (e.g. DARUL100)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 uppercase font-mono text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {isValidatingCoupon ? 'Validating...' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-rose-600 font-medium mt-1.5">{couponError}</p>}
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI_APP')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    paymentMethod === 'UPI_APP'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <Smartphone className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs">UPI Apps</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI_QR')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    paymentMethod === 'UPI_QR'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <QrCode className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs">Scan UPI QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    paymentMethod === 'CARD'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs">Debit / Credit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    paymentMethod === 'NETBANKING'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs">NetBanking</span>
                </button>
              </div>

              {/* Sub-options based on payment method */}
              {paymentMethod === 'UPI_APP' && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-around">
                  {(['GPAY', 'PHONEPE', 'PAYTM'] as const).map((app) => (
                    <label
                      key={app}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                        upiApp === app
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="upiApp"
                        checked={upiApp === app}
                        onChange={() => setUpiApp(app)}
                        className="hidden"
                      />
                      <span>{app === 'GPAY' ? 'Google Pay' : app === 'PHONEPE' ? 'PhonePe' : 'Paytm'}</span>
                    </label>
                  ))}
                </div>
              )}

              {paymentMethod === 'UPI_QR' && (
                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                  <div className="h-24 w-24 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-2 shadow-inner">
                    <QrCode className="h-20 w-20 text-slate-800" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Scan with any UPI application</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Works with BHIM, GPay, PhonePe, Paytm, or Mobile Banking apps.
                    </p>
                    <p className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mt-2 inline-block">
                      UPI ID: darulfaham.edu@icici
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* QA / Sandbox Simulation Controller */}
            <div className="border border-dashed border-amber-300 bg-amber-50/60 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                  Payment Gateway Sandbox Simulation
                </span>
                <span className="text-[10px] text-amber-700 font-mono">
                  {gatewayStatus?.isConfigured ? 'LIVE KEY DETECTED' : 'SANDBOX SIMULATOR'}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Cashfree Secret Key remains server-side. You can test authorization scenarios below:
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSimulateOutcome('SUCCESS')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    simulateOutcome === 'SUCCESS'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  Simulate Success
                </button>
                <button
                  type="button"
                  onClick={() => setSimulateOutcome('PENDING')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    simulateOutcome === 'PENDING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  Simulate Pending
                </button>
                <button
                  type="button"
                  onClick={() => setSimulateOutcome('FAILED')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    simulateOutcome === 'FAILED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  Simulate Bank Failure
                </button>
              </div>
            </div>

            {/* Price Summary Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{originalAmount.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount ({appliedCoupon?.code}):</span>
                  <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Payable:</span>
                <span className="font-mono text-indigo-600 text-lg">
                  ₹{finalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-pay"
                onClick={handlePayNow}
                className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
              >
                <span>Pay ₹{finalAmount.toLocaleString('en-IN')} with Cashfree</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="p-12 text-center space-y-4">
            <div className="inline-block p-4 rounded-full bg-indigo-50 border border-indigo-200 animate-pulse">
              <Clock className="h-10 w-10 text-indigo-600 animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Contacting Cashfree Gateway...</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Securing cryptographic payment session and verifying order integrity with DARULFAHAM backend. Please do not refresh.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>ORDER_ID: {activeOrderId || 'CREATING...'}</span>
            </div>
          </div>
        )}

        {/* Step: Result Receipt */}
        {step === 'result' && paymentResult && (
          <div className="p-6 space-y-5">
            {paymentResult.success ? (
              <>
                <div className="text-center space-y-1.5">
                  <div className="inline-block p-3 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Payment Verified & Settled</h4>
                  <p className="text-xs text-slate-500">
                    Your transaction has been confirmed by Cashfree and registered in your student record.
                  </p>
                </div>

                {/* Printable Official Receipt Slip */}
                <div
                  id="darulfaham-receipt-slip"
                  className="bg-slate-50 border border-slate-300 rounded-xl p-4 font-mono text-xs space-y-3 relative"
                >
                  <div className="border-b border-dashed border-slate-300 pb-2.5 flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-slate-900 tracking-wider">DARULFAHAM ACADEMIC TRUST</h5>
                      <p className="text-[10px] text-slate-500">Official Payment Slip & Tax Invoice</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        PAID / SETTLED
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                    <span className="text-slate-500">Receipt No:</span>
                    <span className="font-bold text-slate-800 text-right">{paymentResult.receiptNumber}</span>

                    <span className="text-slate-500">Cashfree Ref:</span>
                    <span className="text-slate-800 text-right text-[10px] truncate">{paymentResult.cashfreeReference}</span>

                    <span className="text-slate-500">Date & Time:</span>
                    <span className="text-slate-800 text-right">{new Date(paymentResult.verifiedAt || Date.now()).toLocaleString()}</span>

                    <span className="text-slate-500">Student ID:</span>
                    <span className="font-bold text-slate-800 text-right">{currentUser.studentId || currentUser.uid}</span>

                    <span className="text-slate-500">Student Name:</span>
                    <span className="text-slate-800 text-right">{currentUser.displayName}</span>

                    <span className="text-slate-500">Item Description:</span>
                    <span className="font-medium text-slate-800 text-right">{product.productTitle}</span>

                    {appliedCoupon && (
                      <>
                        <span className="text-emerald-700">Coupon Code:</span>
                        <span className="text-emerald-700 text-right">{appliedCoupon.code} (-₹{appliedCoupon.discountAmount})</span>
                      </>
                    )}

                    <span className="text-slate-900 font-bold border-t border-dashed border-slate-300 pt-1.5">Total Paid:</span>
                    <span className="font-bold text-indigo-700 text-right border-t border-dashed border-slate-300 pt-1.5 text-sm">
                      ₹{finalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-2 text-[10px] text-slate-400 text-center">
                    Authorized Digital Stamp • DARULFAHAM Finance Division
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={printReceipt}
                    className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : paymentResult.status === 'PENDING' ? (
              <div className="text-center space-y-4 py-4">
                <div className="inline-block p-3 rounded-full bg-amber-100 text-amber-600">
                  <Clock className="h-10 w-10" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Payment Pending Verification</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Your payment was received by the UPI PSP but is awaiting final bank settlement. It will automatically update to PAID once confirmed.
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left font-mono">
                  <p>Order ID: {activeOrderId}</p>
                  <p className="mt-1">Status: PENDING_CONFIRMATION</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="inline-block p-3 rounded-full bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-10 w-10" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Payment Unsuccessful</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {paymentResult.error || 'The transaction could not be authorized by the issuing bank.'}
                  </p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 text-left font-mono">
                  <p>Order ID: {activeOrderId}</p>
                  <p className="mt-1">Status: FAILED</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('checkout')}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
