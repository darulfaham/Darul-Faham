import {
  INITIAL_BRANCHES,
  INITIAL_ROOMS,
  generateInitialSeats,
  INITIAL_STUDENTS,
  INITIAL_TEST_SERIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
  INITIAL_ATTENDANCE,
  INITIAL_GEOFENCE_SETTINGS,
  INITIAL_ATTENDANCE_CORRECTIONS,
  INITIAL_STUDENT_DOCUMENTS,
  INITIAL_COUPONS,
  INITIAL_DIGITAL_BOOKS,
  INITIAL_INSTITUTION_RESULTS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_STUDENT_ID_CARDS,
  INITIAL_STAFF_ID_CARDS,
  INITIAL_ID_CARD_SETTINGS,
  INITIAL_WEBHOOK_EVENTS,
} from '../firebase/mockData';
import {
  UserProfile,
  Student,
  Seat,
  Branch,
  Room,
  TestSeries,
  TestAttempt,
  AuditLog,
  AttendanceRecord,
  AttendanceCorrection,
  GeofenceSettings,
  StudentDocument,
  Coupon,
  CouponUsage,
  DigitalBook,
  BookAccess,
  InstitutionResult,
  Order,
  PaymentRecord,
  StudentIdCard,
  StaffIdCard,
  IdCardSettings,
  IdCardStatus,
  PaymentWebhookEvent,
} from '../types';

export interface DatabaseState {
  users: UserProfile[];
  students: Student[];
  branches: Branch[];
  rooms: Room[];
  seats: Seat[];
  test_series: TestSeries[];
  test_attempts: TestAttempt[];
  audit_logs: AuditLog[];
  attendance: AttendanceRecord[];
  attendanceCorrections: AttendanceCorrection[];
  geofenceSettings: GeofenceSettings;
  studentDocuments: StudentDocument[];
  orders: Order[];
  payments: PaymentRecord[];
  coupons: Coupon[];
  couponUsage: CouponUsage[];
  digitalBooks: DigitalBook[];
  bookAccess: BookAccess[];
  institutionResults: InstitutionResult[];
  studentIdCards: StudentIdCard[];
  staffIdCards: StaffIdCard[];
  idCardSettings: IdCardSettings;
  paymentWebhookEvents: PaymentWebhookEvent[];
}

const STORAGE_KEY = 'darulfaham_db_v4';

const getInitialData = (): DatabaseState => {
  const defaultState: DatabaseState = {
    users: INITIAL_USERS,
    students: INITIAL_STUDENTS,
    branches: INITIAL_BRANCHES,
    rooms: INITIAL_ROOMS,
    seats: generateInitialSeats(),
    test_series: INITIAL_TEST_SERIES,
    test_attempts: [
      {
        id: 'att-sample-1',
        studentId: 'DF-2026-00001',
        studentName: 'Zeeshan Alam',
        testId: 'test-polity-01',
        testTitle: 'Constitutional Law & Governance Mock Test 01',
        marks: 25,
        maxMarks: 30,
        percentage: 83.3,
        answers: { q1: 1, q2: 0, q3: 1, q4: 0, q5: 0, q6: 0 },
        timestamp: '2026-09-04T16:20:00Z',
        timeSpentSeconds: 680,
        rank: 1,
        status: 'completed',
      },
    ],
    audit_logs: INITIAL_AUDIT_LOGS,
    attendance: INITIAL_ATTENDANCE,
    attendanceCorrections: INITIAL_ATTENDANCE_CORRECTIONS,
    geofenceSettings: INITIAL_GEOFENCE_SETTINGS,
    studentDocuments: INITIAL_STUDENT_DOCUMENTS,
    orders: INITIAL_ORDERS,
    payments: INITIAL_PAYMENTS,
    coupons: INITIAL_COUPONS,
    couponUsage: [
      {
        id: 'use-01',
        couponId: 'coup-100',
        couponCode: 'DARUL100',
        studentId: 'DF-2026-00001',
        orderId: 'ord-1001',
        discountAmount: 100,
        usedAt: '2026-08-01T10:15:00Z',
      },
      {
        id: 'use-02',
        couponId: 'coup-2026',
        couponCode: 'CIVIL2026',
        studentId: 'DF-2026-00001',
        orderId: 'ord-1002',
        discountAmount: 300,
        usedAt: '2026-08-15T14:20:00Z',
      },
      {
        id: 'use-03',
        couponId: 'coup-sanctum',
        couponCode: 'SANCTUM25',
        studentId: 'DF-2026-00002',
        orderId: 'ord-1003',
        discountAmount: 375,
        usedAt: '2026-08-05T09:00:00Z',
      },
    ],
    digitalBooks: INITIAL_DIGITAL_BOOKS,
    bookAccess: [
      {
        id: 'ba-01',
        studentId: 'DF-2026-00001',
        bookId: 'book-01',
        accessType: 'STUDENT',
        grantedAt: '2026-01-15T00:00:00Z',
      },
      {
        id: 'ba-02',
        studentId: 'DF-2026-00001',
        bookId: 'book-03',
        accessType: 'MEMBERSHIP',
        grantedAt: '2026-08-01T10:16:30Z',
      },
    ],
    institutionResults: INITIAL_INSTITUTION_RESULTS,
    studentIdCards: INITIAL_STUDENT_ID_CARDS,
    staffIdCards: INITIAL_STAFF_ID_CARDS,
    idCardSettings: INITIAL_ID_CARD_SETTINGS,
    paymentWebhookEvents: INITIAL_WEBHOOK_EVENTS,
  };

  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.seats && parsed.students && parsed.test_series) {
        return {
          ...defaultState,
          ...parsed,
          coupons: parsed.coupons || INITIAL_COUPONS,
          digitalBooks: parsed.digitalBooks || INITIAL_DIGITAL_BOOKS,
          institutionResults: parsed.institutionResults || INITIAL_INSTITUTION_RESULTS,
          orders: parsed.orders || INITIAL_ORDERS,
          payments: parsed.payments || INITIAL_PAYMENTS,
          couponUsage: parsed.couponUsage || defaultState.couponUsage,
          bookAccess: parsed.bookAccess || defaultState.bookAccess,
          studentIdCards: parsed.studentIdCards || INITIAL_STUDENT_ID_CARDS,
          staffIdCards: parsed.staffIdCards || INITIAL_STAFF_ID_CARDS,
          idCardSettings: parsed.idCardSettings || INITIAL_ID_CARD_SETTINGS,
          paymentWebhookEvents: parsed.paymentWebhookEvents || INITIAL_WEBHOOK_EVENTS,
          attendance: parsed.attendance || INITIAL_ATTENDANCE,
          attendanceCorrections: parsed.attendanceCorrections || INITIAL_ATTENDANCE_CORRECTIONS,
          geofenceSettings: parsed.geofenceSettings || INITIAL_GEOFENCE_SETTINGS,
          studentDocuments: parsed.studentDocuments || INITIAL_STUDENT_DOCUMENTS,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load local DB, using initial mock data:', err);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  } catch (e) {
    // Ignore quota issues
  }

  return defaultState;
};

// Global in-memory instance
let dbState: DatabaseState = getInitialData();
const listeners: Set<() => void> = new Set();

const persist = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dbState));
    }
  } catch (err) {
    console.error('Persistence error:', err);
  }
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Listener notification error:', err);
    }
  });
};

export const resetDatabaseToDefaults = () => {
  dbState = getInitialData();
  persist();
};

/**
 * DATABASE-LEVEL SECURITY AND PRIVACY ENFORCEMENT
 * Reads requesting user profile from local context.
 * Strictly guarantees students CANNOT access other students' phone numbers,
 * parent phone numbers, emails, addresses, or Aadhaar cards.
 */
export const getRequestingUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('darulfaham_active_user_v1');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return null;
};

const enforceSecurityFilter = (collectionName: keyof DatabaseState, rawItems: any[]): any[] => {
  const user = getRequestingUser();
  const role = user?.role || 'STUDENT';
  const userStudentId = user?.studentId;

  // 1. SUPER_ADMIN and ADMIN have administrative access
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return rawItems;
  }

  // 2. STAFF role: Can check attendance, seats, etc., but cannot read Aadhaar, audit logs, or financial orders
  if (role === 'STAFF') {
    if (collectionName === 'audit_logs') return [];
    if (collectionName === 'orders' || collectionName === 'payments' || collectionName === 'couponUsage' || collectionName === 'paymentWebhookEvents') return [];
    if (collectionName === 'staffIdCards') {
      // Staff can ONLY see their own staff ID card!
      return rawItems.filter((item) => item.staffId === user?.staffId || item.id === user?.uid);
    }
    if (collectionName === 'studentDocuments') {
      // Staff has NO access to sensitive Aadhaar documents unless Super Admin explicitly grants it
      return rawItems.filter((doc) => !doc.isSensitive);
    }
    if (collectionName === 'students') {
      return rawItems.map((item) => {
        const copy = { ...item };
        delete copy.aadhaarNumber;
        delete copy.aadhaarUrl;
        return copy;
      });
    }
    return rawItems;
  }

  // 3. STUDENT role: Air-tight PII privacy, attendance isolation, financial isolation, and audit protection
  if (collectionName === 'attendance') {
    // Student A must NOT access Student B's attendance!
    return rawItems.filter((item) => item.studentId === userStudentId || item.studentId === user?.uid);
  }

  if (collectionName === 'attendanceCorrections') {
    return rawItems.filter((item) => item.studentId === userStudentId || item.studentId === user?.uid);
  }

  if (collectionName === 'studentDocuments') {
    // Student can ONLY access their own documents (e.g. Aadhaar upload status)
    return rawItems.filter((doc) => doc.studentId === userStudentId || doc.studentId === user?.uid);
  }

  if (collectionName === 'studentIdCards') {
    // Student can ONLY access their OWN ID card!
    return rawItems.filter((item) => item.studentId === userStudentId || item.id === user?.uid);
  }

  if (collectionName === 'staffIdCards') {
    // Students have ZERO access to staff cards collection
    return [];
  }

  if (collectionName === 'paymentWebhookEvents') {
    // Zero access to payment webhook events for students
    return [];
  }

  if (collectionName === 'students') {
    return rawItems.map((item) => {
      // If this is the student's OWN profile, they are permitted to view their own phone & parent phone
      if (item.studentId === userStudentId || item.id === user?.uid) {
        return { ...item };
      }
      // FOR ANY OTHER STUDENT: Completely redact/strip phone, parentPhone, email, address, Aadhaar!
      // This is enforced at the database driver level.
      const sanitized = { ...item };
      delete sanitized.phone;
      delete sanitized.parentPhone;
      delete sanitized.email;
      delete sanitized.address;
      delete sanitized.aadhaarNumber;
      delete sanitized.aadhaarUrl;
      return sanitized;
    });
  }

  if (collectionName === 'orders') {
    // Students can ONLY query and see their own orders
    return rawItems.filter((item) => item.studentId === userStudentId || item.studentId === user?.uid);
  }

  if (collectionName === 'payments') {
    // Students can ONLY view their own payment transactions and receipts
    return rawItems.filter((item) => item.studentId === userStudentId || item.studentId === user?.uid);
  }

  if (collectionName === 'couponUsage') {
    return rawItems.filter((item) => item.studentId === userStudentId || item.studentId === user?.uid);
  }

  if (collectionName === 'bookAccess') {
    return rawItems.filter((item) => item.studentId === userStudentId || item.studentId === user?.uid);
  }

  if (collectionName === 'test_attempts') {
    return rawItems.filter((item) => item.studentId === userStudentId || item.studentId === user?.uid);
  }

  if (collectionName === 'audit_logs') {
    // Zero access to audit logs for students
    return [];
  }

  if (collectionName === 'digitalBooks') {
    // Students only see published books
    return rawItems.filter((item) => item.status === 'PUBLISHED');
  }

  if (collectionName === 'institutionResults') {
    // Only published institution results are visible to students
    return rawItems
      .filter((item) => item.status === 'PUBLISHED')
      .map((item) => {
        const copy = { ...item };
        if (item.displayNameType === 'INITIALS') {
          copy.displayName = item.customDisplayName || (item.studentName ? item.studentName.split(' ')[0] + ' ' + (item.studentName.split(' ')[1]?.[0] || '') + '.' : 'Student');
        } else if (item.displayNameType === 'ANONYMOUS') {
          copy.displayName = item.customDisplayName || 'Anonymous Aspirant';
        } else {
          copy.displayName = item.studentName;
        }
        if (!item.showMarks) delete copy.marks;
        if (!item.showPercentage) delete copy.percentage;
        if (!item.showPhoto) delete copy.photoUrl;
        return copy;
      });
  }

  return rawItems;
};

export class MockFirestore {
  readonly appName = 'DARULFAHAM';
}

export const db = new MockFirestore();

export interface CollectionRef<T = any> {
  type: 'collection';
  name: keyof DatabaseState;
}

export interface DocRef<T = any> {
  type: 'doc';
  collectionName: keyof DatabaseState;
  id: string;
}

export interface QueryConstraint {
  type: 'where' | 'orderBy' | 'limit';
  field?: string;
  op?: string;
  val?: any;
  direction?: 'asc' | 'desc';
  limitCount?: number;
}

export interface QueryRef {
  type: 'query';
  collectionRef: CollectionRef;
  constraints: QueryConstraint[];
}

export const collection = (firestore: any, collectionName: string): CollectionRef => {
  return {
    type: 'collection',
    name: collectionName as keyof DatabaseState,
  };
};

export const doc = (firestore: any, collectionName: string, id: string): DocRef => {
  return {
    type: 'doc',
    collectionName: collectionName as keyof DatabaseState,
    id,
  };
};

export const where = (field: string, op: string, val: any): QueryConstraint => {
  return { type: 'where', field, op, val };
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint => {
  return { type: 'orderBy', field, direction };
};

export const limit = (limitCount: number): QueryConstraint => {
  return { type: 'limit', limitCount };
};

export const query = (collRef: CollectionRef, ...constraints: QueryConstraint[]): QueryRef => {
  return {
    type: 'query',
    collectionRef: collRef,
    constraints,
  };
};

const executeQuery = (target: CollectionRef | QueryRef): any[] => {
  const collName = target.type === 'collection' ? target.name : target.collectionRef.name;
  const collVal = (dbState as any)[collName];
  const rawItems: any[] = Array.isArray(collVal) ? [...collVal] : collVal ? [collVal] : [];
  const items = enforceSecurityFilter(collName, rawItems);

  if (target.type === 'collection') {
    return items;
  }

  let result = items;
  for (const c of target.constraints) {
    if (c.type === 'where' && c.field && c.op !== undefined) {
      result = result.filter((item) => {
        const val = item[c.field!];
        if (c.op === '==') return val === c.val;
        if (c.op === '!=') return val !== c.val;
        if (c.op === 'in') return Array.isArray(c.val) && c.val.includes(val);
        if (c.op === 'array-contains') return Array.isArray(val) && val.includes(c.val);
        return true;
      });
    } else if (c.type === 'orderBy' && c.field) {
      result.sort((a, b) => {
        const valA = a[c.field!];
        const valB = b[c.field!];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (c.direction === 'desc') {
          return valA > valB ? -1 : 1;
        }
        return valA < valB ? -1 : 1;
      });
    } else if (c.type === 'limit' && typeof c.limitCount === 'number') {
      result = result.slice(0, c.limitCount);
    }
  }
  return result;
};

export interface QuerySnapshot {
  empty: boolean;
  size: number;
  docs: Array<{
    id: string;
    data: () => any;
    [key: string]: any;
  }>;
}

export const onSnapshot = (
  target: CollectionRef | QueryRef,
  callback: (snapshot: QuerySnapshot) => void,
  errorCallback?: (error: Error) => void
): (() => void) => {
  const emit = () => {
    try {
      const items = executeQuery(target);
      const docs = items.map((item) => ({
        id: item.id || item.uid || item.studentId,
        data: () => ({ ...item }),
        ...item,
      }));
      callback({
        empty: docs.length === 0,
        size: docs.length,
        docs,
      });
    } catch (err: any) {
      if (errorCallback) errorCallback(err);
    }
  };

  // Initial immediate call
  emit();

  listeners.add(emit);
  return () => {
    listeners.delete(emit);
  };
};

export const getDocs = async (target: CollectionRef | QueryRef): Promise<QuerySnapshot> => {
  const items = executeQuery(target);
  const docs = items.map((item) => ({
    id: item.id || item.uid || item.studentId,
    data: () => ({ ...item }),
    ...item,
  }));
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
  };
};

export const getDoc = async (
  docRef: DocRef
): Promise<{
  exists: () => boolean;
  data: () => any;
  id: string;
}> => {
  const rawItems = (dbState[docRef.collectionName] || []) as any[];
  const securedItems = enforceSecurityFilter(docRef.collectionName, rawItems);
  const found = securedItems.find((i) => i.id === docRef.id || i.uid === docRef.id || i.studentId === docRef.id);
  return {
    exists: () => !!found,
    data: () => (found ? { ...found } : null),
    id: docRef.id,
  };
};

export const setDoc = async (docRef: DocRef, data: any, options?: { merge?: boolean }): Promise<void> => {
  const items = [...((dbState[docRef.collectionName] || []) as any[])];
  const idx = items.findIndex((i) => i.id === docRef.id || i.uid === docRef.id || i.studentId === docRef.id);
  if (idx >= 0) {
    if (options?.merge) {
      items[idx] = { ...items[idx], ...data };
    } else {
      items[idx] = { id: docRef.id, ...data };
    }
  } else {
    items.push({ id: docRef.id, ...data });
  }
  (dbState as any)[docRef.collectionName] = items;
  persist();
};

export const updateDoc = async (docRef: DocRef, partialData: any): Promise<void> => {
  const items = [...((dbState[docRef.collectionName] || []) as any[])];
  const idx = items.findIndex((i) => i.id === docRef.id || i.uid === docRef.id || i.studentId === docRef.id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...partialData };
    (dbState as any)[docRef.collectionName] = items;
    persist();
  } else {
    throw new Error(`Document ${docRef.id} not found in ${docRef.collectionName}`);
  }
};

export const addDoc = async (collRef: CollectionRef, data: any): Promise<{ id: string }> => {
  const id = data.id || `${collRef.name.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newItem = { id, ...data };
  const items = [...((dbState[collRef.name] || []) as any[])];
  items.unshift(newItem);
  (dbState as any)[collRef.name] = items;
  persist();
  return { id };
};

export const deleteDoc = async (docRef: DocRef): Promise<void> => {
  const items = [...((dbState[docRef.collectionName] || []) as any[])];
  const filtered = items.filter((i) => !(i.id === docRef.id || i.uid === docRef.id || i.studentId === docRef.id));
  (dbState as any)[docRef.collectionName] = filtered;
  persist();
};

export const serverTimestamp = (): string => {
  return new Date().toISOString();
};

// Storage Mock Helper for Aadhaar Documents
export class MockStorage {
  async getDownloadURL(storageRef: { path: string }) {
    return `https://darulfaham-secure-vault.gov.in/preview/${encodeURIComponent(storageRef.path)}?token=df-sec-${Date.now()}`;
  }
}

export const storage = new MockStorage();

export const ref = (storageInstance: any, path: string) => {
  return { path };
};

export const getDownloadURL = async (storageRef: { path: string }) => {
  return `https://darulfaham-secure-vault.gov.in/preview/${encodeURIComponent(storageRef.path)}?auth=sha256_verified&t=${Date.now()}`;
};

// ==========================================
// ID CARD SYSTEM ENGINE & UNIQUE GENERATION
// ==========================================

export const generateNextStudentId = (academicYear?: string): string => {
  const settings = (Array.isArray(dbState.idCardSettings) ? dbState.idCardSettings[0] : dbState.idCardSettings) || INITIAL_ID_CARD_SETTINGS;
  const seq = settings.nextStudentSequence || 1;
  const year = academicYear || settings.academicYear || '2026';
  const prefix = settings.studentPrefix || 'DF-STU';
  const formattedSeq = String(seq).padStart(5, '0');
  const studentId = `${prefix}-${year}-${formattedSeq}`;

  // Increment sequence
  const updatedSettings = {
    ...settings,
    nextStudentSequence: seq + 1,
  };
  if (Array.isArray(dbState.idCardSettings)) {
    dbState.idCardSettings[0] = updatedSettings;
  } else {
    dbState.idCardSettings = updatedSettings;
  }
  persist();
  return studentId;
};

export const generateNextStaffId = (academicYear?: string): string => {
  const settings = (Array.isArray(dbState.idCardSettings) ? dbState.idCardSettings[0] : dbState.idCardSettings) || INITIAL_ID_CARD_SETTINGS;
  const seq = settings.nextStaffSequence || 1;
  const year = academicYear || settings.academicYear || '2026';
  const prefix = settings.staffPrefix || 'DF-STF';
  const formattedSeq = String(seq).padStart(5, '0');
  const staffId = `${prefix}-${year}-${formattedSeq}`;

  // Increment sequence
  const updatedSettings = {
    ...settings,
    nextStaffSequence: seq + 1,
  };
  if (Array.isArray(dbState.idCardSettings)) {
    dbState.idCardSettings[0] = updatedSettings;
  } else {
    dbState.idCardSettings = updatedSettings;
  }
  persist();
  return staffId;
};

export const createStudentIdCard = (student: Partial<Student> & { name: string; course?: string; branchName?: string; assignedSeat?: string; membershipType?: string; photoUrl?: string }): StudentIdCard => {
  const existingId = student.studentId && student.studentId.startsWith('DF-STU-') ? student.studentId : generateNextStudentId();
  const token = `df_v_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
  const qrUrl = `https://darulfaham.edu.in/verify/id?cardId=${existingId}&token=${token}`;

  const newCard: StudentIdCard = {
    id: `card-stu-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    studentId: existingId,
    studentName: student.name,
    photoUrl: student.profilePhotoUrl || student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    course: student.course || 'UPSC Civil Services Foundation 2026-27',
    membershipType: student.membershipType || 'Sanctum 24/7 Dedicated Cubicle',
    validUntil: '2026-12-31',
    issueDate: new Date().toISOString().split('T')[0],
    branchName: student.branchName || 'DARULFAHAM Central Campus',
    branchLocation: 'Hazratganj, Lucknow',
    assignedSeat: student.assignedSeat || 'Unassigned',
    qrCodeData: qrUrl,
    verificationToken: token,
    status: 'ACTIVE',
    bloodGroup: 'B+',
    emergencyContact: '+91 522 400 9999 (DARULFAHAM Desk)',
    showPhoneOnCard: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = dbState.studentIdCards.findIndex((c) => c.studentId === existingId);
  if (existingIdx >= 0) {
    dbState.studentIdCards[existingIdx] = newCard;
  } else {
    dbState.studentIdCards.unshift(newCard);
  }

  // Also log audit event
  const user = getRequestingUser();
  const auditLog: AuditLog = {
    id: `log-idcard-${Date.now()}`,
    adminId: user?.uid || 'system',
    adminName: user?.displayName || 'System Admin',
    action: 'ID_CARD_GENERATED',
    targetStudent: existingId,
    targetStudentName: student.name,
    timestamp: new Date().toISOString(),
    severity: 'low',
    details: `Issued digital ID card for student ${existingId} (${student.name}).`,
  };
  dbState.audit_logs.unshift(auditLog);

  persist();
  return newCard;
};

export const createStaffIdCard = (staff: { name: string; designation: string; department: string; branchName?: string; photoUrl?: string }): StaffIdCard => {
  const staffId = generateNextStaffId();
  const token = `df_stf_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
  const qrUrl = `https://darulfaham.edu.in/verify/id?cardId=${staffId}&token=${token}`;

  const newCard: StaffIdCard = {
    id: `card-stf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    staffId,
    staffName: staff.name,
    photoUrl: staff.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    designation: staff.designation,
    department: staff.department,
    branchName: staff.branchName || 'DARULFAHAM Central Campus',
    joiningDate: new Date().toISOString().split('T')[0],
    qrCodeData: qrUrl,
    verificationToken: token,
    status: 'ACTIVE',
    bloodGroup: 'O+',
    emergencyContact: '+91 522 400 9999 (Admin Cell)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbState.staffIdCards.unshift(newCard);
  persist();
  return newCard;
};

export const setStudentIdCardStatus = (cardId: string, status: IdCardStatus): void => {
  const card = dbState.studentIdCards.find((c) => c.id === cardId || c.studentId === cardId);
  if (!card) return;

  card.status = status;
  card.updatedAt = new Date().toISOString();

  // Audit log
  const user = getRequestingUser();
  const auditLog: AuditLog = {
    id: `log-status-${Date.now()}`,
    adminId: user?.uid || 'admin',
    adminName: user?.displayName || 'Admin',
    action: 'ID_CARD_STATUS_CHANGE',
    targetStudent: card.studentId,
    targetStudentName: card.studentName,
    timestamp: new Date().toISOString(),
    severity: status === 'REVOKED' ? 'high' : 'medium',
    details: `Student ID card ${card.studentId} status modified to ${status}.`,
  };
  dbState.audit_logs.unshift(auditLog);

  persist();
};

export const setStaffIdCardStatus = (cardId: string, status: 'ACTIVE' | 'INACTIVE' | 'REVOKED'): void => {
  const card = dbState.staffIdCards.find((c) => c.id === cardId || c.staffId === cardId);
  if (!card) return;

  card.status = status;
  card.updatedAt = new Date().toISOString();
  persist();
};

export const regenerateCardQr = (cardId: string, isStaff: boolean = false): string => {
  if (isStaff) {
    const card = dbState.staffIdCards.find((c) => c.id === cardId || c.staffId === cardId);
    if (!card) return '';
    const token = `df_stf_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
    card.verificationToken = token;
    card.qrCodeData = `https://darulfaham.edu.in/verify/id?cardId=${card.staffId}&token=${token}`;
    card.updatedAt = new Date().toISOString();
    persist();
    return card.qrCodeData;
  } else {
    const card = dbState.studentIdCards.find((c) => c.id === cardId || c.studentId === cardId);
    if (!card) return '';
    const token = `df_v_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
    card.verificationToken = token;
    card.qrCodeData = `https://darulfaham.edu.in/verify/id?cardId=${card.studentId}&token=${token}`;
    card.updatedAt = new Date().toISOString();
    persist();
    return card.qrCodeData;
  }
};

/**
 * Public Non-Sensitive ID Card Verification
 * Guarantees zero leakage of student phone, parent phone, email, Aadhaar, payment history, or address.
 */
export const verifyCardNonSensitive = (identifier: string): {
  isValid: boolean;
  type: 'STUDENT' | 'STAFF' | 'UNKNOWN';
  id?: string;
  name?: string;
  photoUrl?: string;
  status?: string;
  membershipOrDesignation?: string;
  branch?: string;
  validUntil?: string;
  issueDate?: string;
  assignedSeat?: string;
} => {
  const cleanId = identifier.trim();

  const studentCard = dbState.studentIdCards.find(
    (c) => c.studentId.toLowerCase() === cleanId.toLowerCase() || c.id === cleanId
  );
  if (studentCard) {
    return {
      isValid: true,
      type: 'STUDENT',
      id: studentCard.studentId,
      name: studentCard.studentName,
      photoUrl: studentCard.photoUrl,
      status: studentCard.status,
      membershipOrDesignation: studentCard.membershipType,
      branch: studentCard.branchName,
      validUntil: studentCard.validUntil,
      issueDate: studentCard.issueDate,
      assignedSeat: studentCard.assignedSeat,
    };
  }

  const staffCard = dbState.staffIdCards.find(
    (c) => c.staffId.toLowerCase() === cleanId.toLowerCase() || c.id === cleanId
  );
  if (staffCard) {
    return {
      isValid: true,
      type: 'STAFF',
      id: staffCard.staffId,
      name: staffCard.staffName,
      photoUrl: staffCard.photoUrl,
      status: staffCard.status,
      membershipOrDesignation: `${staffCard.designation} (${staffCard.department})`,
      branch: staffCard.branchName,
      issueDate: staffCard.joiningDate,
    };
  }

  return { isValid: false, type: 'UNKNOWN' };
};
