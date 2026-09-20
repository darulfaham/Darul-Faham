import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { SeatMap } from './components/StudySpace/SeatMap';
import { TestCatalog } from './components/TestEngine/TestCatalog';
import { TestTakingInterface } from './components/TestEngine/TestTakingInterface';
import { StudentDirectory } from './components/AadhaarSecurity/StudentDirectory';
import { AuditLogsTable } from './components/AuditLogs/AuditLogsTable';
import { PaymentModal } from './components/Payments/PaymentModal';
import { PaymentHistoryView } from './components/Payments/PaymentHistoryView';
import { DigitalBooksSection } from './components/DigitalBooks/DigitalBooksSection';
import { PastResultsSection } from './components/Results/PastResultsSection';
import { CouponManagement } from './components/Coupons/CouponManagement';
import { PrivacyAuditLab } from './components/Privacy/PrivacyAuditLab';
import { IdCardManagement } from './components/IdCards/IdCardManagement';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminAttendanceSection } from './components/Attendance/AdminAttendanceSection';
import { db } from './firebase/config';
import {
  collection,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
} from './services/dataService';
import { getStoredActiveUser, setStoredActiveUser } from './services/auth';
import {
  UserProfile,
  UserRole,
  Student,
  Branch,
  Room,
  Seat,
  TestItem,
  TestAttempt,
  AttendanceRecord,
  AttendanceCorrection,
  GeofenceSettings,
  StudentIdCard,
  AuditLog,
  DigitalBook,
} from './types';
import { INITIAL_GEOFENCE_SETTINGS } from './firebase/mockData';
import {
  Armchair,
  Users,
  ShieldCheck,
  Award,
  MapPin,
  ShieldAlert,
  ChevronRight,
  FileCode2,
  Lock,
  CreditCard,
  X,
  AlertTriangle,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getStoredActiveUser());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');
  const [accessDeniedAlert, setAccessDeniedAlert] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Payment Checkout Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentProduct, setPaymentProduct] = useState<{
    productId: string;
    productTitle: string;
    productType: 'MEMBERSHIP' | 'MEMBERSHIP_RENEWAL' | 'TEST_SERIES' | 'DIGITAL_BOOK' | 'COURSE';
    amount: number;
    details?: string;
  }>({
    productId: 'mem-sanctum-monthly',
    productTitle: 'Sanctum Study Space Monthly Fee',
    productType: 'MEMBERSHIP_RENEWAL',
    amount: 1500,
    details: 'Dedicated cubicle, 24/7 power backup & air-conditioned study hall.',
  });

  // Study space state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch-central');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-101');

  // Master collections
  const [students, setStudents] = useState<Student[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [geofenceSettings, setGeofenceSettings] = useState<GeofenceSettings>(INITIAL_GEOFENCE_SETTINGS);
  const [studentIdCards, setStudentIdCards] = useState<StudentIdCard[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Active examination state
  const [activeTakingTest, setActiveTakingTest] = useState<TestItem | null>(null);

  // Helper to get role home route
  const getRoleHomeRoute = useCallback((role: UserRole): string => {
    switch (role) {
      case 'STUDENT':
        return '/student/dashboard';
      case 'STAFF':
        return '/staff/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      case 'SUPER_ADMIN':
        return '/super-admin/dashboard';
      default:
        return '/student/dashboard';
    }
  }, []);

  // Safe navigation function updating URL and tab state
  const navigateTo = useCallback(
    (targetPathOrTab: string) => {
      let resolvedTab: NavTab = 'dashboard';
      let resolvedPath = targetPathOrTab;

      // Map clean routes
      if (targetPathOrTab === '/student/dashboard' || targetPathOrTab === '/staff/dashboard' || targetPathOrTab === '/admin/dashboard' || targetPathOrTab === '/super-admin/dashboard' || targetPathOrTab === 'dashboard') {
        resolvedTab = 'dashboard';
        resolvedPath = getRoleHomeRoute(currentUser.role);
      } else if (targetPathOrTab === '/attendance' || targetPathOrTab === 'attendance') {
        resolvedTab = 'attendance';
        resolvedPath = '/attendance';
      } else if (targetPathOrTab === '/studyspace' || targetPathOrTab === '/seats' || targetPathOrTab === 'studyspace') {
        resolvedTab = 'studyspace';
        resolvedPath = '/studyspace';
      } else if (targetPathOrTab === '/testengine' || targetPathOrTab === '/tests' || targetPathOrTab === 'testengine') {
        resolvedTab = 'testengine';
        resolvedPath = '/testengine';
      } else if (targetPathOrTab === '/payments' || targetPathOrTab === 'payments') {
        resolvedTab = 'payments';
        resolvedPath = '/payments';
      } else if (targetPathOrTab === '/digitalbooks' || targetPathOrTab === '/books' || targetPathOrTab === 'digitalbooks') {
        resolvedTab = 'digitalbooks';
        resolvedPath = '/digitalbooks';
      } else if (targetPathOrTab === '/pastresults' || targetPathOrTab === '/results' || targetPathOrTab === 'pastresults') {
        resolvedTab = 'pastresults';
        resolvedPath = '/pastresults';
      } else if (targetPathOrTab === '/coupons' || targetPathOrTab === 'coupons') {
        resolvedTab = 'coupons';
        resolvedPath = '/coupons';
      } else if (targetPathOrTab === '/idcards' || targetPathOrTab === '/id-cards' || targetPathOrTab === 'idcards') {
        resolvedTab = 'idcards';
        resolvedPath = '/idcards';
      } else if (targetPathOrTab === '/students' || targetPathOrTab === 'students') {
        resolvedTab = 'students';
        resolvedPath = '/students';
      } else if (targetPathOrTab === '/privacytest' || targetPathOrTab === 'privacytest') {
        resolvedTab = 'privacytest';
        resolvedPath = '/privacytest';
      } else if (targetPathOrTab === '/auditlogs' || targetPathOrTab === 'auditlogs') {
        resolvedTab = 'auditlogs';
        resolvedPath = '/auditlogs';
      }

      // Check role authorization for destination
      if (currentUser.role === 'STUDENT') {
        const forbiddenPrefixes = ['/admin', '/super-admin', '/staff', '/auditlogs', '/coupons'];
        const isForbidden = forbiddenPrefixes.some((prefix) => resolvedPath.startsWith(prefix));
        if (isForbidden) {
          setAccessDeniedAlert(
            `ACCESS DENIED: As a Student, you cannot access administrative or staff consoles (${resolvedPath}). Redirected to your Student Dashboard.`
          );
          resolvedPath = '/student/dashboard';
          resolvedTab = 'dashboard';
        }
      }

      // Push state
      try {
        if (window.location.pathname !== resolvedPath) {
          window.history.pushState({}, '', resolvedPath);
        }
      } catch (e) {
        // Fallback for sandboxed frames
      }

      setCurrentPath(resolvedPath);
      setActiveTab(resolvedTab);
      setActiveTakingTest(null);
    },
    [currentUser.role, getRoleHomeRoute]
  );

  // Initial Route Validation on mount & handle popstate
  useEffect(() => {
    const handleUrlSync = () => {
      const path = window.location.pathname;
      if (currentUser.role === 'STUDENT') {
        const forbidden = ['/admin', '/super-admin', '/staff', '/auditlogs'];
        if (forbidden.some((f) => path.startsWith(f))) {
          setAccessDeniedAlert(
            `ACCESS DENIED: Direct URL access to '${path}' is blocked for students. Redirected to /student/dashboard.`
          );
          navigateTo('/student/dashboard');
          return;
        }
      }

      if (path === '/' || path === '') {
        navigateTo(getRoleHomeRoute(currentUser.role));
      } else {
        navigateTo(path);
      }
    };

    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, [currentUser.role, navigateTo, getRoleHomeRoute]);

  // Firestore Subscriptions
  useEffect(() => {
    const unsubBranches = onSnapshot(collection(db, 'branches'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBranches(data);
      if (data.length > 0 && !selectedBranchId) {
        setSelectedBranchId(data[0].id);
      }
    });

    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRooms(data);
      if (data.length > 0 && !selectedRoomId) {
        setSelectedRoomId(data[0].id);
      }
    });

    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStudents(data);
    });

    const unsubSeats = onSnapshot(collection(db, 'seats'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSeats(data);
    });

    const unsubAttempts = onSnapshot(collection(db, 'test_attempts'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAttempts(data);
    });

    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAttendance(data);
    });

    const unsubCorrections = onSnapshot(collection(db, 'attendanceCorrections'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCorrections(data);
    });

    const unsubGeofence = onSnapshot(collection(db, 'geofenceSettings'), (snap) => {
      if (snap.docs.length > 0) {
        setGeofenceSettings(snap.docs[0].data() as GeofenceSettings);
      }
    });

    const unsubIdCards = onSnapshot(collection(db, 'studentIdCards'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStudentIdCards(data);
    });

    const unsubAudit = onSnapshot(collection(db, 'audit_logs'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAuditLogs(data);
    });

    return () => {
      unsubBranches();
      unsubRooms();
      unsubStudents();
      unsubSeats();
      unsubAttempts();
      unsubAttendance();
      unsubCorrections();
      unsubGeofence();
      unsubIdCards();
      unsubAudit();
    };
  }, []);

  const handleUserChange = (newUser: UserProfile) => {
    setCurrentUser(newUser);
    setStoredActiveUser(newUser);
    setAccessDeniedAlert(null);
    // Route user to their role's specific dashboard URL
    const destination = getRoleHomeRoute(newUser.role);
    navigateTo(destination);
  };

  // Find current student profile if user is a student
  const currentStudentProfile = useMemo(() => {
    if (currentUser.role !== 'STUDENT') return null;
    return (
      students.find((s) => s.studentId === currentUser.studentId || s.id === currentUser.uid) || {
        id: currentUser.uid,
        studentId: currentUser.studentId || 'DF-STU-2026-00001',
        name: currentUser.displayName,
        fatherName: 'Guardian',
        motherName: 'Guardian',
        dob: '2002-05-15',
        phone: '+91 98390 12345',
        email: currentUser.email,
        address: 'Civil Lines, Lucknow, UP',
        aadhaarNumber: 'XXXX-XXXX-5821',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        classLevel: 'UPSC Civil Services Foundation 2026',
        course: 'UPSC Civil Services Foundation 2026',
        membershipType: 'Sanctum 24/7 Dedicated',
        status: 'active' as const,
        branchId: 'branch-central',
        branchName: 'DARULFAHAM Central Campus',
        assignedRoom: 'Room 101',
        assignedSeat: 'Seat #03',
        registeredDate: '2026-01-15',
      }
    );
  }, [currentUser, students]);

  // Find matching student ID card
  const currentStudentIdCard = useMemo(() => {
    if (!currentUser.studentId) return undefined;
    return studentIdCards.find((c) => c.studentId === currentUser.studentId);
  }, [currentUser, studentIdCards]);

  // Filter rooms by active branch
  const activeRooms = rooms.filter((r) => r.branchId === selectedBranchId);
  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || activeRooms[0];

  // Stats computation
  const totalSeats = seats.length;
  const occupiedSeats = seats.filter((s) => s.status === 'occupied').length;
  const availableSeats = seats.filter((s) => s.status === 'available').length;
  const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
  const highSeverityAudits = auditLogs.filter((l) => l.severity === 'high').length;

  const handleInitiatePayment = (product: {
    productId: string;
    productTitle: string;
    productType: 'MEMBERSHIP' | 'MEMBERSHIP_RENEWAL' | 'TEST_SERIES' | 'DIGITAL_BOOK' | 'COURSE';
    amount: number;
    details?: string;
  }) => {
    setPaymentProduct(product);
    setIsPaymentModalOpen(true);
  };

  const handlePurchaseBook = (book: DigitalBook) => {
    handleInitiatePayment({
      productId: book.id,
      productTitle: book.title,
      productType: 'DIGITAL_BOOK',
      amount: book.price,
      details: `Digital E-Book access for ${book.subject} by ${book.author}`,
    });
  };

  // ATTENDANCE HANDLERS
  const handleAttendanceMarked = async (newRecord: AttendanceRecord) => {
    try {
      await setDoc(doc(db, 'attendance', newRecord.id), newRecord);

      // Audit log
      await addDoc(collection(db, 'audit_logs'), {
        adminId: currentUser.uid,
        adminName: currentUser.displayName,
        action: 'MARK_ATTENDANCE',
        targetStudent: newRecord.studentId,
        targetStudentName: newRecord.studentName,
        timestamp: serverTimestamp(),
        severity: 'low',
        ip: '192.168.1.112',
        details: `Attendance logged for ${newRecord.studentName} on ${newRecord.date} via ${newRecord.verificationMethod}.`,
      });
    } catch (e) {
      console.error('Error recording attendance:', e);
    }
  };

  const handleUpdateGeofence = async (newSettings: GeofenceSettings) => {
    try {
      await setDoc(doc(db, 'geofenceSettings', 'global_settings'), newSettings);
      setGeofenceSettings(newSettings);

      // Audit log
      await addDoc(collection(db, 'audit_logs'), {
        adminId: currentUser.uid,
        adminName: currentUser.displayName,
        action: 'UPDATE_GEOFENCE_SETTINGS',
        timestamp: serverTimestamp(),
        severity: 'high',
        ip: '192.168.1.112',
        details: `Geofence perimeter reconfigured: ${newSettings.allowedRadiusMeters}m radius at (${newSettings.latitude}, ${newSettings.longitude}).`,
      });
    } catch (e) {
      console.error('Error updating geofence:', e);
    }
  };

  const handleCorrectAttendance = async (
    correction: AttendanceCorrection,
    updatedRecord: AttendanceRecord
  ) => {
    try {
      // 1. Update attendance record
      await setDoc(doc(db, 'attendance', updatedRecord.id), updatedRecord);

      // 2. Add to corrections collection
      await addDoc(collection(db, 'attendanceCorrections'), correction);

      // 3. High severity audit log
      await addDoc(collection(db, 'audit_logs'), {
        adminId: currentUser.uid,
        adminName: currentUser.displayName,
        action: 'CORRECT_ATTENDANCE',
        targetStudent: updatedRecord.studentId,
        targetStudentName: updatedRecord.studentName,
        timestamp: serverTimestamp(),
        severity: 'high',
        ip: '192.168.1.112',
        details: `Administrative attendance correction for ${updatedRecord.studentName} on ${updatedRecord.date}. Status changed: ${correction.previousStatus} -> ${correction.newStatus}. Reason: "${correction.reason}".`,
      });
    } catch (e) {
      console.error('Error saving attendance correction:', e);
    }
  };

  const getHeaderTitle = () => {
    if (currentUser.role === 'STUDENT' && (activeTab === 'dashboard' || activeTab === 'attendance')) {
      return 'Student Study Portal';
    }

    switch (activeTab) {
      case 'dashboard':
        return currentUser.role === 'STUDENT' ? 'Student Study Portal' : 'Command Center';
      case 'attendance':
        return currentUser.role === 'STUDENT' ? 'Sanctum Attendance' : 'Attendance Operations Console';
      case 'studyspace':
        return 'Study Space (Seat Map)';
      case 'testengine':
        return 'Online Examination & Test Series';
      case 'payments':
        return 'Financial Settlements & Cashfree Gateway';
      case 'digitalbooks':
        return 'Digital Library & E-Book Compendiums';
      case 'pastresults':
        return 'Institutional Results & Hall of Rankers';
      case 'coupons':
        return 'Promotional Discounts & Coupon Codes';
      case 'students':
        return 'Student Directory & Aadhaar Vault';
      case 'idcards':
        return currentUser.role === 'STUDENT' ? 'My Digital Student ID' : 'ID Cards & Badges';
      case 'privacytest':
        return 'Student Privacy & Security Audit Verification';
      case 'auditlogs':
        return 'Cryptographic Security & Audit Logs';
      default:
        return 'DARULFAHAM Sanctum';
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#fbf9fe] font-sans text-slate-900 overflow-hidden">
      {/* Sleek Interface Sidebar */}
      <Sidebar
        currentUser={currentUser}
        onUserChange={handleUserChange}
        activeTab={activeTab}
        onTabChange={(tab) => navigateTo(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#fbf9fe]">
        {/* Sleek Header */}
        <Header
          title={getHeaderTitle()}
          currentUser={currentUser}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* ACCESS DENIED ALERT BANNER */}
        {accessDeniedAlert && (
          <div className="mx-6 sm:mx-8 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Access Denied
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">{accessDeniedAlert}</p>
              </div>
            </div>
            <button
              onClick={() => setAccessDeniedAlert(null)}
              className="text-rose-400 hover:text-rose-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Views */}
        <main className="flex-1">
          {/* Active Examination Simulator View */}
          {activeTakingTest ? (
            <div className="p-6 sm:p-8 space-y-4">
              <button
                id="btn-back-to-catalog"
                onClick={() => setActiveTakingTest(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-800 hover:text-purple-950 transition-colors"
              >
                ← Cancel & Return to Tests
              </button>
              <TestTakingInterface
                test={activeTakingTest}
                currentUser={currentUser}
                onFinishTest={() => {}}
                onExit={() => setActiveTakingTest(null)}
              />
            </div>
          ) : (
            <>
              {/* 1. STUDENT DASHBOARD VIEW (WHEN STUDENT LOGS IN OR VISITS DASHBOARD) */}
              {currentUser.role === 'STUDENT' && (activeTab === 'dashboard' || activeTab === 'attendance') && currentStudentProfile && (
                <div className="p-6 sm:p-8">
                  <StudentDashboard
                    student={currentStudentProfile}
                    studentIdCard={currentStudentIdCard}
                    attendanceRecords={attendance}
                    geofenceSettings={geofenceSettings}
                    onNavigate={navigateTo}
                    onAttendanceMarked={handleAttendanceMarked}
                  />
                </div>
              )}

              {/* 2. ADMIN/STAFF ATTENDANCE DASHBOARD */}
              {currentUser.role !== 'STUDENT' && activeTab === 'attendance' && (
                <div className="p-6 sm:p-8">
                  <AdminAttendanceSection
                    currentUser={currentUser}
                    students={students}
                    branches={branches}
                    attendanceRecords={attendance}
                    corrections={corrections}
                    geofenceSettings={geofenceSettings}
                    onCorrectAttendance={handleCorrectAttendance}
                    onUpdateGeofence={handleUpdateGeofence}
                  />
                </div>
              )}

              {/* 3. STAFF / ADMIN COMMAND CENTER (ONLY FOR NON-STUDENT ROLES) */}
              {currentUser.role !== 'STUDENT' && activeTab === 'dashboard' && (
                <div className="space-y-8">
                  {/* Top Metrics Section */}
                  <section className="p-6 sm:p-8 pb-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      id="stat-students-enrolled"
                      title="Total Students"
                      value={students.length}
                      icon={Users}
                      trend="12.5%"
                      subtitle="Biometrically registered"
                      badgeColor="bg-purple-50 text-purple-900"
                    />

                    <StatCard
                      id="stat-seats-occupancy"
                      title="Study Space Occupancy"
                      value={`${occupancyRate}%`}
                      icon={Armchair}
                      trend="8.4%"
                      subtitle={`${occupiedSeats} of ${totalSeats} seats allocated`}
                      badgeColor="bg-emerald-50 text-emerald-700"
                    />

                    <StatCard
                      id="stat-tests-completed"
                      title="Examinations Evaluated"
                      value={attempts.length}
                      icon={Award}
                      trend="14.2%"
                      subtitle="Auto-timed & ranked"
                      badgeColor="bg-amber-50 text-amber-800"
                    />

                    <StatCard
                      id="stat-aadhaar-audits"
                      title="Security Clearances"
                      value={highSeverityAudits}
                      icon={ShieldCheck}
                      subtitle="High-severity UIDAI logged"
                      badgeColor="bg-rose-50 text-rose-700"
                    />
                  </section>

                  {/* Main Command Center Grid */}
                  <div className="px-6 sm:px-8 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Col Span 8: Study Space Map */}
                    <div className="lg:col-span-8 space-y-4">
                      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <MapPin className="h-4 w-4 text-purple-800" />
                          <span>Campus:</span>
                          <select
                            id="dashboard-branch-select"
                            value={selectedBranchId}
                            onChange={(e) => {
                              setSelectedBranchId(e.target.value);
                              const firstRoom = rooms.find((r) => r.branchId === e.target.value);
                              if (firstRoom) setSelectedRoomId(firstRoom.id);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>

                          <span className="text-slate-300 ml-1">|</span>
                          <span className="ml-1">Hall:</span>
                          <select
                            id="dashboard-room-select"
                            value={selectedRoomId}
                            onChange={(e) => setSelectedRoomId(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            {activeRooms.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => navigateTo('studyspace')}
                          className="text-xs font-semibold text-purple-900 hover:text-purple-950 inline-flex items-center gap-1 transition-colors"
                        >
                          Full Map View <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Interactive SeatMap */}
                      <SeatMap
                        roomId={selectedRoomId}
                        roomName={currentRoom ? currentRoom.name : 'Hall A'}
                        currentUser={currentUser}
                        studentsList={students}
                      />

                      {/* Architectural Blueprint Compliance Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-xl bg-purple-50 text-purple-900">
                            <FileCode2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              DARULFAHAM Production Architecture
                            </h3>
                            <p className="text-xs text-slate-500">
                              Role-separated attendance, facial anti-proxy foundation, and student isolation.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-4">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="font-bold text-slate-900 block mb-0.5">Aadhaar Vault</span>
                            <p className="text-slate-600 text-[11px]">Strict role check & immutable audit logs.</p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="font-bold text-slate-900 block mb-0.5">Study Space</span>
                            <p className="text-slate-600 text-[11px]">Live reactive seats mapped via Firestore.</p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="font-bold text-slate-900 block mb-0.5">Sanctum Attendance</span>
                            <p className="text-slate-600 text-[11px]">Geofence & biometric verified check-ins.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Col Span 4: Right Column */}
                    <div className="lg:col-span-4 space-y-6">
                      {/* Attendance Quick Snapshot Card for Admins */}
                      <div className="bg-gradient-to-br from-purple-950 to-indigo-950 rounded-2xl p-6 text-white shadow-lg shadow-purple-950/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300">
                            Attendance Command
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-purple-200">
                            Active Geofence
                          </span>
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">Daily Sanctum Presence</h4>
                          <p className="text-xs text-purple-200 mt-1">
                            {attendance.filter((a) => a.date === '2026-09-05' && a.status === 'present').length} students checked in today with GPS verification.
                          </p>
                        </div>
                        <button
                          onClick={() => navigateTo('attendance')}
                          className="w-full py-2.5 bg-white text-purple-950 hover:bg-purple-50 rounded-xl text-xs font-bold transition-all shadow"
                        >
                          Open Attendance Console
                        </button>
                      </div>

                      {/* Recent Security Audit Logs */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                          <h2 className="font-bold text-slate-800 text-base">Recent Security Audit Logs</h2>
                          <button
                            onClick={() => navigateTo('auditlogs')}
                            className="text-xs text-purple-900 font-semibold hover:text-purple-950 transition-colors"
                          >
                            View All
                          </button>
                        </div>

                        <div className="p-6 space-y-3.5">
                          {auditLogs.slice(0, 4).map((log, index) => {
                            const isHigh = log.severity === 'high';
                            const isMedium = log.severity === 'medium';
                            const borderColor = isHigh
                              ? 'border-rose-500'
                              : isMedium
                              ? 'border-amber-500'
                              : 'border-emerald-500';

                            return (
                              <div
                                key={log.id || index}
                                className={`p-3 bg-slate-50 border-l-4 ${borderColor} rounded-r-lg transition-all hover:bg-slate-100/70`}
                              >
                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                  <span className="font-mono">{log.action}</span>
                                  <span className="text-slate-400 font-normal text-[11px]">
                                    {new Date(log.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                  {log.details || `Operator ${log.adminName || 'System'} executed action.`}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Study Space Management */}
              {activeTab === 'studyspace' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <MapPin className="h-4 w-4 text-purple-800" />
                        <span>Campus:</span>
                        <select
                          id="branch-selector"
                          value={selectedBranchId}
                          onChange={(e) => {
                            setSelectedBranchId(e.target.value);
                            const firstRoom = rooms.find((r) => r.branchId === e.target.value);
                            if (firstRoom) setSelectedRoomId(firstRoom.id);
                          }}
                          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-purple-700"
                        >
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.city})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <span>Room:</span>
                        <select
                          id="room-selector"
                          value={selectedRoomId}
                          onChange={(e) => setSelectedRoomId(e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-purple-700"
                        >
                          {activeRooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.floor})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-500">
                        Available: <strong className="text-emerald-600">{availableSeats}</strong> / {totalSeats}
                      </span>
                      <span className="text-slate-500">
                        Occupancy: <strong className="text-slate-900">{occupancyRate}%</strong>
                      </span>
                    </div>
                  </div>

                  <SeatMap
                    roomId={selectedRoomId}
                    roomName={currentRoom?.name || 'Sanctum A'}
                    currentUser={currentUser}
                    studentsList={students}
                  />
                </div>
              )}

              {/* Tab: Online Test Engine */}
              {activeTab === 'testengine' && (
                <div className="p-6 sm:p-8">
                  <TestCatalog
                    currentUser={currentUser}
                    onStartTest={(test) => setActiveTakingTest(test)}
                  />
                </div>
              )}

              {/* Tab: Payments & Financial Settlements */}
              {activeTab === 'payments' && (
                <div className="p-6 sm:p-8">
                  <PaymentHistoryView
                    currentUser={currentUser}
                    onInitiatePayment={handleInitiatePayment}
                  />
                </div>
              )}

              {/* Tab: Digital Books Library */}
              {activeTab === 'digitalbooks' && (
                <div className="p-6 sm:p-8">
                  <DigitalBooksSection
                    currentUser={currentUser}
                    onPurchaseBook={handlePurchaseBook}
                  />
                </div>
              )}

              {/* Tab: Past Results & Hall of Rankers */}
              {activeTab === 'pastresults' && (
                <div className="p-6 sm:p-8">
                  <PastResultsSection currentUser={currentUser} />
                </div>
              )}

              {/* Tab: Promotional Coupons */}
              {activeTab === 'coupons' && (
                <div className="p-6 sm:p-8">
                  <CouponManagement currentUser={currentUser} />
                </div>
              )}

              {/* Tab: Student Directory & Aadhaar Vault */}
              {activeTab === 'students' && (
                <div className="p-6 sm:p-8">
                  <StudentDirectory
                    students={students}
                    currentUser={currentUser}
                    branches={branches}
                    onUpdateStudent={async (updated) => {
                      try {
                        await setDoc(doc(db, 'students', updated.id), updated);
                      } catch (err) {
                        console.error('Failed to update student:', err);
                      }
                    }}
                  />
                </div>
              )}

              {/* Tab: Digital ID Cards & Badges */}
              {activeTab === 'idcards' && (
                <div className="p-6 sm:p-8">
                  <IdCardManagement currentUser={currentUser} />
                </div>
              )}

              {/* Tab: Privacy & Security Audit Lab */}
              {activeTab === 'privacytest' && (
                <div className="p-6 sm:p-8">
                  <PrivacyAuditLab currentUser={currentUser} />
                </div>
              )}

              {/* Tab: Audit Logs (Super Admin / Admin Only) */}
              {activeTab === 'auditlogs' &&
                (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' ? (
                  <div className="p-6 sm:p-8">
                    <AuditLogsTable currentUser={currentUser} />
                  </div>
                ) : (
                  <div className="p-8 max-w-md mx-auto text-center py-20">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Access Prohibited</h2>
                    <p className="text-xs text-slate-600 mt-2">
                      Students and unauthorized personnel have zero access to administrative audit logs.
                    </p>
                    <button
                      onClick={() => navigateTo('/student/dashboard')}
                      className="mt-4 px-4 py-2 bg-purple-900 text-white text-xs font-bold rounded-xl"
                    >
                      Return to Student Dashboard
                    </button>
                  </div>
                ))}
            </>
          )}
        </main>

        {/* Global Cashfree Payment Modal */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          currentUser={currentUser}
          product={paymentProduct}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            navigateTo('payments');
          }}
        />

        {/* Sleek Interface Footer */}
        <footer className="mt-auto bg-white border-t border-slate-200 py-4 px-6 sm:px-8 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-purple-950">DARULFAHAM</span>
              <span>•</span>
              <span>Sanctum Study & Examination Infrastructure</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-emerald-700 font-semibold">● Live Firestore Sync</span>
              <span>•</span>
              <span>Geofence & Biometric Verification</span>
              <span>•</span>
              <span>ISO 27001 Standard</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
