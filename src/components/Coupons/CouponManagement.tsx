import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Percent,
  TrendingDown,
  X,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile, Coupon, CouponUsage } from '../../types';
import { db } from '../../firebase/config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from '../../services/dataService';
import { validateCoupon } from '../../services/cashfreeClient';

interface CouponManagementProps {
  currentUser: UserProfile;
}

export const CouponManagement: React.FC<CouponManagementProps> = ({ currentUser }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Test Tool
  const [testCode, setTestCode] = useState('DARUL100');
  const [testAmount, setTestAmount] = useState(1500);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // New Coupon Form Data
  const [formData, setFormData] = useState<Omit<Coupon, 'id'>>({
    code: '',
    title: '',
    description: '',
    discountType: 'FLAT',
    discountValue: 100,
    minPurchase: 500,
    maxDiscount: undefined,
    validFrom: new Date().toISOString(),
    validUntil: '2026-12-31T23:59:59Z',
    isActive: true,
    totalUsageLimit: 500,
    currentUsageCount: 0,
    perStudentLimit: 1,
    applicableProductTypes: ['MEMBERSHIP', 'MEMBERSHIP_RENEWAL', 'TEST_SERIES', 'DIGITAL_BOOK'],
  });

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  useEffect(() => {
    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Coupon[];
      setCoupons(list);
    });

    const unsubUsage = onSnapshot(collection(db, 'couponUsage'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CouponUsage[];
      setUsages(list);
    });

    return () => {
      unsubCoupons();
      unsubUsage();
    };
  }, []);

  const handleTestCoupon = async () => {
    setIsTesting(true);
    const res = await validateCoupon(testCode, testAmount, 'MEMBERSHIP');
    setTestResult(res);
    setIsTesting(false);
  };

  const handleToggleActive = async (coupon: Coupon) => {
    await updateDoc(doc(db, 'coupons', coupon.id), {
      isActive: !coupon.isActive,
    });
  };

  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Delete promo code "${code}"?`)) {
      await deleteDoc(doc(db, 'coupons', id));
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    await addDoc(collection(db, 'coupons'), {
      ...formData,
      code: formData.code.trim().toUpperCase(),
      discountValue: Number(formData.discountValue),
      minPurchase: Number(formData.minPurchase),
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
      totalUsageLimit: Number(formData.totalUsageLimit),
      perStudentLimit: Number(formData.perStudentLimit),
      currentUsageCount: 0,
      createdAt: new Date().toISOString(),
    });

    setIsModalOpen(false);
    setFormData({
      code: '',
      title: '',
      description: '',
      discountType: 'FLAT',
      discountValue: 100,
      minPurchase: 500,
      maxDiscount: undefined,
      validFrom: new Date().toISOString(),
      validUntil: '2026-12-31T23:59:59Z',
      isActive: true,
      totalUsageLimit: 500,
      currentUsageCount: 0,
      perStudentLimit: 1,
      applicableProductTypes: ['MEMBERSHIP', 'MEMBERSHIP_RENEWAL', 'TEST_SERIES', 'DIGITAL_BOOK'],
    });
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Promotional Discount Codes & Fee Subsidies
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Server-Validated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure coupons, student subsidies, and referral rebates for study spaces, test series, and e-books.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Promo Code</span>
          </button>
        )}
      </div>

      {/* Live Server Validation Tester Box */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Live Backend Coupon Validation Sandbox</h3>
          </div>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-indigo-200">
            POST /api/coupons/validate
          </span>
        </div>
        <p className="text-xs text-slate-300 mb-4">
          Test real-time calculation, eligibility rules, and minimum threshold checks before deployment.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Coupon Code</label>
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              className="w-full uppercase font-mono font-bold text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Order Total (₹)</label>
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(Number(e.target.value))}
              className="w-full font-mono font-bold text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleTestCoupon}
              disabled={isTesting}
              className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              {isTesting ? 'Verifying...' : 'Validate Code'}
            </button>
          </div>
        </div>

        {testResult && (
          <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            {testResult.valid ? (
              <div className="flex items-center justify-between text-emerald-400">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  Valid: {testResult.title} (-₹{testResult.discountAmount})
                </span>
                <span className="font-mono text-white">
                  Original: ₹{testResult.originalAmount} ➔ Final: ₹{testResult.finalAmount}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <AlertTriangle className="h-4 w-4" />
                <span>Failed: {testResult.error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coupon List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coupon codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredCoupons.length} Coupons Configured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          {filteredCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                coupon.isActive ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 bg-slate-100/60 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-600 text-white font-mono font-bold text-xs rounded-lg uppercase tracking-wider">
                      {coupon.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        coupon.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {coupon.discountType === 'FLAT'
                        ? `₹${coupon.discountValue} FLAT`
                        : `${coupon.discountValue}% OFF`}
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mt-2">{coupon.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{coupon.description}</p>

                <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400">Min Order: </span>
                    <strong className="font-mono text-slate-800">₹{coupon.minPurchase}</strong>
                  </div>
                  {coupon.maxDiscount && (
                    <div>
                      <span className="text-slate-400">Max Cap: </span>
                      <strong className="font-mono text-slate-800">₹{coupon.maxDiscount}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Expires: </span>
                    <span>{new Date(coupon.validUntil).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Redemptions: </span>
                    <strong className="font-mono text-slate-800">{coupon.currentUsageCount || 0}</strong>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleActive(coupon)}
                    className="font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {coupon.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id, coupon.code)}
                    className="text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Admin Add Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 text-slate-900 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Create New Coupon Code</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UPSC2026"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full uppercase font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20% Aspirant Rebate"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Terms or requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value as 'FLAT' | 'PERCENTAGE' })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="FLAT">Flat Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Value {formData.discountType === 'FLAT' ? '(₹)' : '(%)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Cap (₹, for % discounts)</label>
                  <input
                    type="number"
                    value={formData.maxDiscount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscount: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  Save & Deploy Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
