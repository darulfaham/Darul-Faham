import React, { useState, useEffect } from 'react';
import { UserProfile, StudentIdCard, StaffIdCard, IdCardSettings } from '../../types';
import { db } from '../../firebase/config';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  generateNextStudentId,
  generateNextStaffId,
  createStudentIdCard,
} from '../../services/dataService';
import { IdCardViewer } from './IdCardViewer';
import {
  CreditCard,
  UserCheck,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Settings,
  Sparkles,
  Users,
  Building,
  RotateCw,
  QrCode,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Sliders,
  Calendar,
  Lock,
} from 'lucide-react';

interface IdCardManagementProps {
  currentUser: UserProfile;
}

export const IdCardManagement: React.FC<IdCardManagementProps> = ({ currentUser }) => {
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const isStudent = currentUser.role === 'STUDENT';
  const isStaffOnly = currentUser.role === 'STAFF';

  // Master collections
  const [studentCards, setStudentCards] = useState<StudentIdCard[]>([]);
  const [staffCards, setStaffCards] = useState<StaffIdCard[]>([]);
  const [idSettings, setIdSettings] = useState<IdCardSettings | null>(null);

  // Admin view state
  const [activeAdminTab, setActiveAdminTab] = useState<'students' | 'staff' | 'issue' | 'settings'>(
    isStudent ? 'students' : 'students'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'REVOKED'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [selectedCardForModal, setSelectedCardForModal] = useState<{
    card: StudentIdCard | StaffIdCard;
    isStaff: boolean;
  } | null>(null);

  // New Card Issuance Form
  const [issueType, setIssueType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueSuccessMsg, setIssueSuccessMsg] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCourse, setFormCourse] = useState('UPSC CSE 2026 - Comprehensive Foundation');
  const [formBranchId, setFormBranchId] = useState('branch-central');
  const [formBranchName, setFormBranchName] = useState('Central Campus - Civil Lines');
  const [formAssignedSeat, setFormAssignedSeat] = useState('Seat A-12');
  const [formBloodGroup, setFormBloodGroup] = useState('O+');
  const [formEmergencyContact, setFormEmergencyContact] = useState('+91 98765 43210');
  const [formDesignation, setFormDesignation] = useState('Senior Academic Proctor');
  const [formDepartment, setFormDepartment] = useState('Sanctum Operations');
  const [formPhotoUrl, setFormPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
  );

  // Subscribe to live collections
  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'studentIdCards'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as StudentIdCard[];
      setStudentCards(data);
    });

    const unsubStaff = onSnapshot(collection(db, 'staffIdCards'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as StaffIdCard[];
      setStaffCards(data);
    });

    const unsubSettings = onSnapshot(collection(db, 'idCardSettings'), (snap) => {
      if (!snap.empty) {
        setIdSettings({ id: snap.docs[0].id, ...snap.docs[0].data() } as IdCardSettings);
      }
    });

    return () => {
      unsubStudents();
      unsubStaff();
      unsubSettings();
    };
  }, []);

  // Update card status (Admin only)
  const handleStatusUpdate = async (
    cardId: string,
    isStaffCard: boolean,
    newStatus: 'ACTIVE' | 'INACTIVE' | 'REVOKED'
  ) => {
    try {
      const col = isStaffCard ? 'staffIdCards' : 'studentIdCards';
      await updateDoc(doc(db, col, cardId), { status: newStatus });
      if (selectedCardForModal) {
        setSelectedCardForModal({
          ...selectedCardForModal,
          card: { ...selectedCardForModal.card, status: newStatus },
        });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Regenerate verification token
  const handleRegenerateToken = async (cardId: string, isStaffCard: boolean) => {
    try {
      const col = isStaffCard ? 'staffIdCards' : 'studentIdCards';
      const newToken = `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const targetCard = (isStaffCard ? staffCards : studentCards).find((c) => c.id === cardId);
      const officialId = isStaffCard
        ? (targetCard as StaffIdCard)?.staffId
        : (targetCard as StudentIdCard)?.studentId;
      const newQr = `https://darulfaham.edu.in/verify/id?cardId=${officialId}&token=${newToken}`;

      await updateDoc(doc(db, col, cardId), {
        verificationToken: newToken,
        qrCodeData: newQr,
      });

      if (selectedCardForModal) {
        setSelectedCardForModal({
          ...selectedCardForModal,
          card: {
            ...selectedCardForModal.card,
            verificationToken: newToken,
            qrCodeData: newQr,
          },
        });
      }
    } catch (err) {
      console.error('Failed to regenerate token:', err);
    }
  };

  // Issue new ID Card (Server-side generated atomic ID)
  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIssueSuccessMsg(null);

    try {
      let allocatedId = '';
      // Attempt server-side atomic endpoint first
      try {
        const endpoint =
          issueType === 'STUDENT'
            ? '/api/ids/generate-student-id'
            : '/api/ids/generate-staff-id';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ academicYear: idSettings?.academicYear || '2026' }),
        });
        if (res.ok) {
          const json = await res.json();
          allocatedId = issueType === 'STUDENT' ? json.studentId : json.staffId;
        }
      } catch (srvErr) {
        console.warn('Server endpoint fallback to dataService ID generator:', srvErr);
      }

      // Fallback to dataService if server endpoint unavailable
      if (!allocatedId) {
        allocatedId =
          issueType === 'STUDENT'
            ? await generateNextStudentId(idSettings?.academicYear || '2026')
            : await generateNextStaffId(idSettings?.academicYear || '2026');
      }

      const token = `tok_auth_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const qrData = `https://darulfaham.edu.in/verify/id?cardId=${allocatedId}&token=${token}`;

      if (issueType === 'STUDENT') {
        const newCard: Omit<StudentIdCard, 'id'> = {
          studentId: allocatedId,
          studentName: formName,
          photoUrl: formPhotoUrl,
          course: formCourse,
          membershipType: 'SANCTUM_PREMIUM',
          branchId: formBranchId,
          branchName: formBranchName,
          assignedSeat: formAssignedSeat,
          issueDate: new Date().toISOString().split('T')[0],
          validUntil: `${idSettings?.academicYear || '2026'}-12-31`,
          status: 'ACTIVE',
          bloodGroup: formBloodGroup,
          emergencyContact: formEmergencyContact,
          qrCodeData: qrData,
          verificationToken: token,
        };

        const docRef = await addDoc(collection(db, 'studentIdCards'), newCard);
        setIssueSuccessMsg(`Successfully issued Student ID ${allocatedId} for ${formName}!`);
        setSelectedCardForModal({
          card: { id: docRef.id, ...newCard },
          isStaff: false,
        });
      } else {
        const newCard: Omit<StaffIdCard, 'id'> = {
          staffId: allocatedId,
          staffName: formName,
          designation: formDesignation,
          department: formDepartment,
          photoUrl: formPhotoUrl,
          branchId: formBranchId,
          branchName: formBranchName,
          issueDate: new Date().toISOString().split('T')[0],
          validUntil: `${idSettings?.academicYear || '2026'}-12-31`,
          status: 'ACTIVE',
          bloodGroup: formBloodGroup,
          emergencyContact: formEmergencyContact,
          qrCodeData: qrData,
          verificationToken: token,
        };

        const docRef = await addDoc(collection(db, 'staffIdCards'), newCard);
        setIssueSuccessMsg(`Successfully issued Staff ID ${allocatedId} for ${formName}!`);
        setSelectedCardForModal({
          card: { id: docRef.id, ...newCard },
          isStaff: true,
        });
      }

      // Reset form fields
      setFormName('');
      setFormEmail('');
      setFormPhone('');
    } catch (err: any) {
      console.error('Card issuance error:', err);
      alert('Error issuing ID card: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student's personal ID card lookup
  const myStudentCard = studentCards.find(
    (c) => c.studentId === currentUser.studentId || c.studentName === currentUser.displayName
  ) || studentCards[0];

  // Staff's personal ID card lookup
  const myStaffCard = staffCards.find(
    (c) => c.staffName === currentUser.displayName
  ) || staffCards[0];

  // ==========================================================
  // VIEW FOR STUDENTS: Personal ID Card Access & Wallet
  // ==========================================================
  if (isStudent) {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-900/40 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>OFFICIAL DIGITAL CREDENTIAL</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                My Student Identity Card
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                Cryptographically signed smart ID for Sanctum Study Space biometric entry, test hall check-ins, and proctor verification.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active & Verified</span>
              </span>
            </div>
          </div>
        </div>

        {/* Student Card Interactive Showcase */}
        {myStudentCard ? (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col items-center">
            <IdCardViewer
              card={myStudentCard}
              isStaff={false}
              currentUser={currentUser}
            />
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Student ID Card Issued Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Your admission enrollment is being reviewed by DARULFAHAM Academic Registry. Your ID card will appear here automatically upon activation.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================
  // VIEW FOR STAFF ONLY: Staff Digital Credential
  // ==========================================================
  if (isStaffOnly) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-900/40 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>STAFF IDENTITY CREDENTIAL</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Staff Official Credential
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                Authorized staff card for sanctum proctoring, student verification, and facility access.
              </p>
            </div>
          </div>
        </div>

        {myStaffCard ? (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col items-center">
            <IdCardViewer card={myStaffCard} isStaff={true} currentUser={currentUser} />
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Staff Card Record Found</h3>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================
  // VIEW FOR ADMIN & SUPER ADMIN: Full Management & Issuance
  // ==========================================================
  const filteredStudents = studentCards.filter((c) => {
    const matchSearch =
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchBranch = branchFilter === 'ALL' || c.branchId === branchFilter;
    return matchSearch && matchStatus && matchBranch;
  });

  const filteredStaff = staffCards.filter((c) => {
    const matchSearch =
      c.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalActiveStudents = studentCards.filter((c) => c.status === 'ACTIVE').length;
  const totalRevokedStudents = studentCards.filter((c) => c.status === 'REVOKED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-900/40 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>ACADEMIC CREDENTIAL MANAGEMENT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Student & Staff ID Card System
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Server-side atomic ID allocation (DF-STU-2026-XXXXX), tamper-evident QR verification, photo badges, and physical print layouts.
            </p>
          </div>

          <button
            onClick={() => setActiveAdminTab('issue')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New ID Card</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-900/60">
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-indigo-950/80">
            <span className="text-[11px] text-slate-400 font-medium">Student Credentials</span>
            <p className="text-xl font-black text-white mt-0.5">{studentCards.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-indigo-950/80">
            <span className="text-[11px] text-slate-400 font-medium">Active Cards</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{totalActiveStudents}</p>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-indigo-950/80">
            <span className="text-[11px] text-slate-400 font-medium">Staff Credentials</span>
            <p className="text-xl font-black text-indigo-400 mt-0.5">{staffCards.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-indigo-950/80">
            <span className="text-[11px] text-slate-400 font-medium">Revoked / Inactive</span>
            <p className="text-xl font-black text-rose-400 mt-0.5">{totalRevokedStudents}</p>
          </div>
        </div>
      </div>

      {/* Admin Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('students')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 ${
            activeAdminTab === 'students'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student ID Cards ({studentCards.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 ${
            activeAdminTab === 'staff'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Staff ID Cards ({staffCards.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('issue')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 ${
            activeAdminTab === 'issue'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Issue New Card</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 ${
            activeAdminTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>ID Format & Settings</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* SUB-TAB: STUDENT ID CARDS TABLE                              */}
      {/* ============================================================ */}
      {activeAdminTab === 'students' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, ID, or course..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="REVOKED">Revoked</option>
              </select>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Campuses</option>
                <option value="branch-central">Central Campus</option>
                <option value="branch-south">South Ext Hub</option>
                <option value="branch-east">East Regional Centre</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Official ID</th>
                    <th className="py-3 px-4">Course & Seat</th>
                    <th className="py-3 px-4">Campus</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((card) => (
                      <tr key={card.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={card.photoUrl}
                              alt={card.studentName}
                              className="w-8 h-9 object-cover rounded-lg border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{card.studentName}</p>
                              <p className="text-[10px] text-slate-500">{card.membershipType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          {card.studentId}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-700 max-w-[200px] truncate">{card.course}</p>
                          <span className="text-[10px] text-indigo-600 font-semibold">
                            {card.assignedSeat || 'Floating Desk'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{card.branchName}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              card.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : card.status === 'INACTIVE'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {card.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCardForModal({ card, isStaff: false })}
                              className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Card View</span>
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  card.id,
                                  false,
                                  card.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE'
                                )
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                card.status === 'ACTIVE'
                                  ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {card.status === 'ACTIVE' ? 'Revoke' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No student ID cards matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB: STAFF ID CARDS TABLE                                */}
      {/* ============================================================ */}
      {activeAdminTab === 'staff' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Official Staff ID</th>
                    <th className="py-3 px-4">Role & Department</th>
                    <th className="py-3 px-4">Campus</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((card) => (
                    <tr key={card.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={card.photoUrl}
                            alt={card.staffName}
                            className="w-8 h-9 object-cover rounded-lg border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{card.staffName}</p>
                            <p className="text-[10px] text-slate-500">{card.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">{card.staffId}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{card.department}</td>
                      <td className="py-3 px-4 text-slate-600">{card.branchName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            card.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {card.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedCardForModal({ card, isStaff: true })}
                          className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Card View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB: ISSUE NEW ID CARD (Atomic Server Allocation)        */}
      {/* ============================================================ */}
      {activeAdminTab === 'issue' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Issue New Academic ID Credential</h2>
            <p className="text-xs text-slate-500 mt-1">
              Issues an official credential with an atomically allocated sequence number and cryptographic QR code.
            </p>
          </div>

          {issueSuccessMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{issueSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleIssueCard} className="space-y-4">
            {/* Card Category Toggle */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIssueType('STUDENT')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  issueType === 'STUDENT'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Student Credential (DF-STU-2026-XXXXX)
              </button>
              <button
                type="button"
                onClick={() => setIssueType('STAFF')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  issueType === 'STAFF'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Staff Credential (DF-STF-2026-XXXXX)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Asim Qureshi"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus / Branch *
                </label>
                <select
                  value={formBranchId}
                  onChange={(e) => {
                    setFormBranchId(e.target.value);
                    setFormBranchName(e.target.options[e.target.selectedIndex].text);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="branch-central">Central Campus - Civil Lines</option>
                  <option value="branch-south">South Extension Sanctum</option>
                  <option value="branch-east">East Regional Centre</option>
                </select>
              </div>

              {issueType === 'STUDENT' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Course *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCourse}
                      onChange={(e) => setFormCourse(e.target.value)}
                      placeholder="e.g. UPSC CSE 2026 Foundation"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Study Cubicle
                    </label>
                    <input
                      type="text"
                      value={formAssignedSeat}
                      onChange={(e) => setFormAssignedSeat(e.target.value)}
                      placeholder="e.g. Seat A-12 (Hall 1)"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Staff Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      placeholder="e.g. Lead Academic Proctor"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department *
                    </label>
                    <input
                      type="text"
                      required
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder="e.g. Examinations & Invigilation"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={formBloodGroup}
                  onChange={(e) => setFormBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="A+">A+ Positive</option>
                  <option value="A-">A- Negative</option>
                  <option value="B+">B+ Positive</option>
                  <option value="B-">B- Negative</option>
                  <option value="O+">O+ Positive</option>
                  <option value="O-">O- Negative</option>
                  <option value="AB+">AB+ Positive</option>
                  <option value="AB-">AB- Negative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Helpline Phone
                </label>
                <input
                  type="text"
                  value={formEmergencyContact}
                  onChange={(e) => setFormEmergencyContact(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Photo URL
              </label>
              <input
                type="url"
                value={formPhotoUrl}
                onChange={(e) => setFormPhotoUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
              >
                {isSubmitting ? 'Allocating Atomic ID...' : 'Generate & Issue Credential'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB: ID SYSTEM SETTINGS & FORMAT                         */}
      {/* ============================================================ */}
      {activeAdminTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">ID System Configuration</h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure institution prefixes, academic year formats, and privacy policies.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-700">Student ID Prefix:</span>
                <span className="font-mono font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {idSettings?.studentPrefix || 'DF-STU'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-700">Staff ID Prefix:</span>
                <span className="font-mono font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {idSettings?.staffPrefix || 'DF-STF'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-700">Academic Year:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {idSettings?.academicYear || '2026'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-700">Student Sequence Counter:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  #{String(idSettings?.studentSequenceStart || 5).padStart(5, '0')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-700">Student Phone Privacy:</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  ENFORCED (Hidden on Student Cards)
                </span>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-3">
              <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-indigo-950">UIDAI / Student Privacy Mandate</p>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                  Student phone numbers and Aadhaar numbers are stripped at database query layer. Only Super Admin and authorized Staff can view emergency contact details.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Card Preview Modal */}
      {selectedCardForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Credential Inspection</h3>
                <p className="text-xs text-slate-500">Interactive 3D Badge with QR Signature</p>
              </div>
              <button
                onClick={() => setSelectedCardForModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <IdCardViewer
              card={selectedCardForModal.card}
              isStaff={selectedCardForModal.isStaff}
              currentUser={currentUser}
              onStatusChange={(newStatus) =>
                handleStatusUpdate(selectedCardForModal.card.id, selectedCardForModal.isStaff, newStatus)
              }
              onRegenerateQr={() =>
                handleRegenerateToken(selectedCardForModal.card.id, selectedCardForModal.isStaff)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};
