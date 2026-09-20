import React, { useState } from 'react';
import {
  User,
  CreditCard,
  CalendarCheck,
  BookOpen,
  Award,
  BookMarked,
  Tag,
  Receipt,
  Bell,
  Trophy,
  Armchair,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Camera,
  MapPin,
  Lock,
} from 'lucide-react';
import {
  Student,
  UserProfile,
  AttendanceRecord,
  GeofenceSettings,
  StudentNotice,
} from '../../types';
import { StudentProfileModal } from './StudentProfileModal';
import { StudentMembershipModal } from './StudentMembershipModal';
import { StudentNoticesModal } from './StudentNoticesModal';
import { AttendanceVerificationModal } from '../AttendanceVerificationModal';

interface StudentDashboardProps {
  currentUser: UserProfile;
  student: Student | undefined;
  attendanceRecords: AttendanceRecord[];
  geofenceSettings: GeofenceSettings;
  onNavigateTab: (
    tab:
      | 'studyspace'
      | 'testengine'
      | 'payments'
      | 'digitalbooks'
      | 'pastresults'
      | 'coupons'
      | 'idcards'
      | 'attendance'
  ) => void;
  onInitiatePayment: (product: {
    productId: string;
    productTitle: string;
    productType: 'MEMBERSHIP' | 'MEMBERSHIP_RENEWAL' | 'TEST_SERIES' | 'DIGITAL_BOOK' | 'COURSE';
    amount: number;
    details?: string;
  }) => void;
  onAttendanceRecorded: (record: AttendanceRecord) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  student,
  attendanceRecords,
  geofenceSettings,
  onNavigateTab,
  onInitiatePayment,
  onAttendanceRecorded,
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [isNoticesModalOpen, setIsNoticesModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  // Compute student attendance stats strictly for this student
  const studentId = currentUser.studentId || student?.studentId || 'DF-STU-2026-00001';
  const myRecords = attendanceRecords.filter((r) => r.studentId === studentId);
  const totalDays = myRecords.length || 25;
  const presentDays = myRecords.filter((r) => r.status === 'present').length;
  const lateDays = myRecords.filter((r) => r.status === 'late').length;
  const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = myRecords.find((r) => r.date === todayStr);

  const studentName = student?.name || currentUser.displayName;
  const studentPhoto =
    student?.profilePhotoUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  const cards = [
    {
      id: 'card-my-profile',
      title: 'MY PROFILE',
      subtitle: 'Personal bio, registration & parents details',
      icon: User,
      color: 'bg-purple-900 text-white',
      badge: 'Verified Scholar',
      action: () => setIsProfileModalOpen(true),
    },
    {
      id: 'card-my-id-card',
      title: 'MY ID CARD',
      subtitle: 'Official digital identity & barcode verification',
      icon: CreditCard,
      color: 'bg-purple-800 text-white',
      badge: 'Active RFID',
      action: () => onNavigateTab('idcards'),
    },
    {
      id: 'card-my-membership',
      title: 'MY MEMBERSHIP',
      subtitle: 'Sanctum 24/7 dedicated desk allocation',
      icon: Armchair,
      color: 'bg-purple-900 text-white',
      badge: student?.membershipExpiry ? `Valid: ${student.membershipExpiry}` : 'Active',
      action: () => setIsMembershipModalOpen(true),
    },
    {
      id: 'card-attendance',
      title: 'ATTENDANCE',
      subtitle: 'Location-geofenced & selfie check-in ledger',
      icon: CalendarCheck,
      color: 'bg-indigo-900 text-white',
      badge: todayRecord ? 'Checked In' : 'Pending Check-In',
      action: () => onNavigateTab('attendance'),
    },
    {
      id: 'card-test-series',
      title: 'TEST SERIES',
      subtitle: 'Curated UPSC, SSC & state mock examinations',
      icon: BookOpen,
      color: 'bg-purple-900 text-white',
      badge: '5 Available',
      action: () => onNavigateTab('testengine'),
    },
    {
      id: 'card-results',
      title: 'RESULTS',
      subtitle: 'Individual scorecards, percentiles & analytics',
      icon: Award,
      color: 'bg-purple-800 text-white',
      badge: 'Auto Evaluated',
      action: () => onNavigateTab('pastresults'),
    },
    {
      id: 'card-digital-books',
      title: 'DIGITAL BOOKS',
      subtitle: 'Curated e-library, compendiums & NCERT notes',
      icon: BookMarked,
      color: 'bg-purple-900 text-white',
      badge: '18 Volumes',
      action: () => onNavigateTab('digitalbooks'),
    },
    {
      id: 'card-offers',
      title: 'OFFERS',
      subtitle: 'Exclusive student tuition & sanctum coupons',
      icon: Tag,
      color: 'bg-indigo-900 text-white',
      badge: 'Save ₹100',
      action: () => onNavigateTab('coupons'),
    },
    {
      id: 'card-fees-payments',
      title: 'FEES & PAYMENTS',
      subtitle: 'Pay monthly study space fees via Cashfree',
      icon: Receipt,
      color: 'bg-purple-900 text-white',
      badge: 'Instant Receipt',
      action: () =>
        onInitiatePayment({
          productId: 'mem-sanctum-monthly',
          productTitle: 'Sanctum Study Space Monthly Fee',
          productType: 'MEMBERSHIP_RENEWAL',
          amount: 1500,
          details: 'Dedicated cubicle, 24/7 power backup & air-conditioned study hall.',
        }),
    },
    {
      id: 'card-payment-history',
      title: 'PAYMENT HISTORY',
      subtitle: 'Download official fee receipts & tax invoices',
      icon: Clock,
      color: 'bg-purple-800 text-white',
      badge: 'GST Invoices',
      action: () => onNavigateTab('payments'),
    },
    {
      id: 'card-notices',
      title: 'NOTICES',
      subtitle: 'Campus announcements & sanctum timing updates',
      icon: Bell,
      color: 'bg-purple-900 text-white',
      badge: '3 New Circulars',
      action: () => setIsNoticesModalOpen(true),
    },
    {
      id: 'card-past-results',
      title: 'PAST RESULTS',
      subtitle: 'Historical hall of rankers & achievements',
      icon: Trophy,
      color: 'bg-indigo-900 text-white',
      badge: 'Rankers Log',
      action: () => onNavigateTab('pastresults'),
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-[#FAFAFC] min-h-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-wider text-purple-900 font-extrabold uppercase px-2.5 py-0.5 bg-purple-100 rounded-md">
              DARULFAHAM ACADEMIC ECOSYSTEM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Welcome, {studentName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalized scholar workstation, sanctum attendance, and examination portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {todayRecord ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Today's Attendance Verified</span>
            </div>
          ) : (
            <button
              id="btn-student-quick-checkin"
              type="button"
              onClick={() => setIsAttendanceModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02]"
            >
              <Camera className="w-4 h-4" />
              <span>Mark Today's Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* Personalized Student Summary Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-800" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Avatar & Identity */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <img
                src={studentPhoto}
                alt={studentName}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-purple-200 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-white text-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {studentName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {student?.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>

              <div className="font-mono text-xs font-bold text-purple-900">
                ID: {studentId}
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Course: <strong className="text-slate-700">{student?.course || 'UPSC Civil Services Foundation 2026'}</strong>
              </div>
            </div>
          </div>

          {/* Right: Key Scholar Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            {/* Indicator 1: Membership */}
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-900 block uppercase tracking-wider">
                Membership
              </span>
              <span className="font-bold text-slate-900 text-xs block mt-0.5">
                {student?.membershipType || 'Sanctum 24/7'}
              </span>
              <span className="text-[10px] text-slate-500">Exp: {student?.membershipExpiry || '31 Dec 2026'}</span>
            </div>

            {/* Indicator 2: Seat Allocation */}
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-900 block uppercase tracking-wider">
                Allocated Seat
              </span>
              <span className="font-bold text-slate-900 text-xs block mt-0.5">
                Seat #{student?.seatNumber ?? 3}
              </span>
              <span className="text-[10px] text-slate-500">{student?.roomName || 'Room 101'}</span>
            </div>

            {/* Indicator 3: Attendance Rate */}
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-900 block uppercase tracking-wider">
                Sanctum Attendance
              </span>
              <span className="font-bold text-purple-900 text-sm block mt-0.5">
                {attendanceRate}%
              </span>
              <span className="text-[10px] text-slate-500">{presentDays}/{totalDays} Days Verified</span>
            </div>

            {/* Indicator 4: Biometric Status */}
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-900 block uppercase tracking-wider">
                Biometrics
              </span>
              <span className="font-bold text-emerald-700 text-xs block mt-0.5">
                Aadhaar Stored
              </span>
              <span className="text-[10px] text-slate-500">Encrypted Vault</span>
            </div>
          </div>
        </div>
      </div>

      {/* 12 Dashboard Feature Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Academic & Facility Services
          </h3>
          <span className="text-xs text-slate-500">Click any service to view or manage</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                id={card.id}
                type="button"
                onClick={card.action}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-200 text-left flex flex-col justify-between group hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
                      {card.badge}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm tracking-tight group-hover:text-purple-900 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-900">
                  <span>Open {card.title}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Modal */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        student={student}
        currentUser={currentUser}
      />

      {/* Membership Modal */}
      <StudentMembershipModal
        isOpen={isMembershipModalOpen}
        onClose={() => setIsMembershipModalOpen(false)}
        student={student}
        onRenew={() =>
          onInitiatePayment({
            productId: 'mem-sanctum-monthly',
            productTitle: 'Sanctum Study Space Monthly Fee',
            productType: 'MEMBERSHIP_RENEWAL',
            amount: 1500,
            details: 'Dedicated cubicle, 24/7 power backup & air-conditioned study hall.',
          })
        }
      />

      {/* Notices Modal */}
      <StudentNoticesModal
        isOpen={isNoticesModalOpen}
        onClose={() => setIsNoticesModalOpen(false)}
      />

      {/* Attendance Verification Modal */}
      {isAttendanceModalOpen && (
        <AttendanceVerificationModal
          isOpen={isAttendanceModalOpen}
          onClose={() => setIsAttendanceModalOpen(false)}
          studentId={studentId}
          studentName={studentName}
          studentPhotoUrl={studentPhoto}
          classLevel={student?.course || 'UPSC Civil Services Foundation 2026'}
          membershipType={student?.membershipType || 'Sanctum 24/7 Dedicated'}
          assignedSeat={student?.seatNumber ? `Seat #${student.seatNumber}` : undefined}
          geofenceSettings={geofenceSettings}
          onSuccess={(newRec) => {
            onAttendanceRecorded(newRec);
            setIsAttendanceModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
