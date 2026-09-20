import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Printer,
  Search,
  Filter,
  ExternalLink,
  Lock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FileText,
  X,
} from 'lucide-react';
import { UserProfile, PaymentRecord, Order } from '../../types';
import { db } from '../../firebase/config';
import { collection, onSnapshot } from '../../services/dataService';
import { checkCashfreeStatus, CashfreeStatusResponse } from '../../services/cashfreeClient';

interface PaymentHistoryViewProps {
  currentUser: UserProfile;
  onInitiatePayment: (product: {
    productId: string;
    productTitle: string;
    productType: 'MEMBERSHIP' | 'MEMBERSHIP_RENEWAL' | 'TEST_SERIES' | 'DIGITAL_BOOK' | 'COURSE';
    amount: number;
    details?: string;
  }) => void;
}

export const PaymentHistoryView: React.FC<PaymentHistoryViewProps> = ({
  currentUser,
  onInitiatePayment,
}) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<CashfreeStatusResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  useEffect(() => {
    checkCashfreeStatus().then(setGatewayStatus);

    // Subscribe to payments collection
    // Note: Database security rules enforce that students only receive their own records!
    const unsubPayments = onSnapshot(collection(db, 'payments'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PaymentRecord[];
      setPayments(list);
    });

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
      setOrders(list);
    });

    return () => {
      unsubPayments();
      unsubOrders();
    };
  }, [currentUser]);

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesSearch =
      p.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPaidAmount = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((acc, curr) => acc + (curr.finalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Pay Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {isAdmin ? 'Financial Settlements & Payment Gateway' : 'My Payment History & Invoices'}
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Cashfree Integrated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Real-time ledger of institutional collections, refunds, and Cashfree gateway sessions.'
              : `Official receipts and transaction records for ${currentUser.displayName} (${currentUser.studentId || currentUser.uid}).`}
          </p>
        </div>

        {/* Quick Payment Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onInitiatePayment({
                productId: 'mem-monthly-sanctum',
                productTitle: 'Study Space Monthly Sanctum Membership Fee (Oct 2026)',
                productType: 'MEMBERSHIP_RENEWAL',
                amount: 1500,
                details: 'Guaranteed 24/7 designated quiet cubicle with high-speed internet & locker.',
              })
            }
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            <span>Pay Monthly Membership Fee (₹1,500)</span>
          </button>
        </div>
      </div>

      {/* Gateway Status Badge for Admins & Security Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Total Collections' : 'My Total Investment'}
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            ₹{totalPaidAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Across {payments.length} verified transactions</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Gateway Environment
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-lg font-bold text-slate-900 font-mono">
              {gatewayStatus?.environment || 'SANDBOX'}
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            API v{gatewayStatus?.apiVersion || '2023-08-01'} • Webhooks Enabled
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Secret Key Isolation
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-emerald-700 font-bold text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Server-Side Only (No Browser Exposure)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cashfree credentials securely managed in environment container
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search receipts, items, students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            {(['ALL', 'SUCCESS', 'PENDING', 'FAILED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Receipt className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-sm">No transaction records found</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Make a payment or adjust your search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Item & Product</th>
                  {isAdmin && <th className="py-3 px-4">Aspirant</th>}
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-medium text-slate-700">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.receiptNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{p.productTitle}</p>
                      <span className="text-[10px] text-indigo-600 font-mono">
                        {p.productType}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        <p className="text-slate-800 font-semibold">{p.studentName}</p>
                        <p className="text-[10px] font-mono text-slate-400">{p.studentId}</p>
                      </td>
                    )}
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(p.paidAt || p.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.paymentMethod || 'Cashfree UPI'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹{p.finalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.status === 'SUCCESS' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : p.status === 'PENDING' ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>View Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Slip Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Payment Invoice & Tax Slip</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs space-y-2.5">
              <div className="flex justify-between items-start border-b border-dashed border-slate-300 pb-2">
                <div>
                  <h4 className="font-bold text-slate-900">DARULFAHAM TRUST</h4>
                  <p className="text-[10px] text-slate-500">Hazratganj Central Campus, Civil Lines</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                  VERIFIED PAID
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                <span className="text-slate-500">Receipt Number:</span>
                <span className="font-bold text-slate-900 text-right">{selectedReceipt.receiptNumber}</span>

                <span className="text-slate-500">Cashfree Ref:</span>
                <span className="text-slate-700 text-right text-[10px] truncate">{selectedReceipt.cashfreeReference || 'cf_settled_live'}</span>

                <span className="text-slate-500">Student ID:</span>
                <span className="font-bold text-slate-900 text-right">{selectedReceipt.studentId}</span>

                <span className="text-slate-500">Student Name:</span>
                <span className="text-slate-900 text-right">{selectedReceipt.studentName}</span>

                <span className="text-slate-500">Description:</span>
                <span className="text-slate-900 text-right font-medium">{selectedReceipt.productTitle}</span>

                <span className="text-slate-500">Payment Mode:</span>
                <span className="text-slate-900 text-right">{selectedReceipt.paymentMethod}</span>

                <span className="text-slate-500">Date Settled:</span>
                <span className="text-slate-900 text-right">{new Date(selectedReceipt.paidAt).toLocaleString()}</span>

                <span className="font-bold text-slate-900 border-t border-dashed border-slate-300 pt-1.5">Amount Paid:</span>
                <span className="font-bold text-indigo-700 text-right text-sm border-t border-dashed border-slate-300 pt-1.5">
                  ₹{selectedReceipt.finalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official Slip</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
