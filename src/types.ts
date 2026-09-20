export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'STUDENT';

export interface UserProfile {
  uid: string;
  role: UserRole;
  email: string;
  displayName: string;
  studentId?: string;
  staffId?: string;
  permissions?: string[];
  avatarUrl?: string;
}

export interface Student {
  studentId: string;
  name: string;
  fatherName: string;
  motherName: string;
  dob: string;
  address?: string;
  phone?: string;
  parentPhone?: string;
  email?: string;
  aadhaarNumber?: string; // Formatted e.g. "XXXX-XXXX-4921"
  aadhaarUrl?: string;
  aadhaarDocType?: 'image' | 'pdf';
  aadhaarUploadedAt?: string;
  profilePhotoUrl?: string;
  status: 'active' | 'pending' | 'suspended';
  course?: string;
  membershipType?: string;
  membershipExpiry?: string;
  assignedSeatId?: string;
  seatNumber?: number;
  roomName?: string;
  branchId?: string;
  registeredDate: string;
}

export type ProductType = 'MEMBERSHIP' | 'MEMBERSHIP_RENEWAL' | 'TEST_SERIES' | 'COURSE' | 'DIGITAL_BOOK';

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface Order {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  productType: ProductType;
  productId: string;
  productTitle: string;
  originalAmount: number;
  couponCode?: string;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  status: OrderStatus;
  cashfreeOrderId?: string;
  cashfreePaymentSessionId?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  studentId: string;
  studentName: string;
  productTitle: string;
  productType: ProductType;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  paymentMethod: string;
  cashfreeReference?: string;
  receiptNumber: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  paidAt: string;
  createdAt: string;
  downloadUrl?: string;
}

export type DiscountType = 'FLAT' | 'PERCENTAGE';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // Flat in ₹ or percentage (e.g., 20)
  minPurchase: number;
  maxDiscount?: number; // Cap for percentage discounts
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  perStudentLimit: number;
  usageCount: number;
  applicableProducts: ('ALL' | ProductType)[];
  isActive: boolean;
  createdAt: string;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  couponCode: string;
  studentId: string;
  orderId: string;
  discountAmount: number;
  usedAt: string;
}

export type BookAccessType = 'PUBLIC' | 'STUDENT' | 'MEMBERSHIP' | 'PAID' | 'SPECIFIC_COURSE' | 'SPECIFIC_TEST_SERIES';

export type BookStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface DigitalBook {
  id: string;
  title: string;
  author: string;
  description: string;
  subject: string;
  classLevel?: string;
  classOrCategory?: string;
  course?: string;
  category?: string;
  coverImage?: string;
  coverUrl?: string;
  pdfUrl?: string;
  previewPdfUrl?: string;
  isFree: boolean;
  price: number;
  accessType?: BookAccessType;
  allowDownload: boolean;
  publicationDate?: string;
  status?: BookStatus;
  isPublished?: boolean;
  pageCount?: number;
  totalPages?: number;
  fileSizeBytes?: number;
  samplePreviewPages?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BookAccess {
  id: string;
  studentId: string;
  bookId: string;
  accessType: BookAccessType;
  grantedAt: string;
  orderId?: string;
}

export type DisplayNamePrivacy = 'FULL' | 'INITIALS' | 'ANONYMOUS';

export interface InstitutionResult {
  id: string;
  academicYear: string;
  exam?: string;
  examName?: string;
  classLevel?: string;
  studentId?: string;
  studentName: string;
  displayNameType: DisplayNamePrivacy;
  customDisplayName?: string;
  marks?: number;
  marksObtained?: number;
  maxMarks?: number;
  totalMarks?: number;
  percentage?: number;
  percentile?: number;
  rank?: number;
  subject?: string;
  achievement?: string;
  achievementTitle?: string;
  description?: string;
  testimonial?: string;
  photoUrl?: string;
  resultDocumentUrl?: string;
  showPhoto: boolean;
  showMarks: boolean;
  showPercentage?: boolean;
  isFeatured: boolean;
  status?: 'PUBLISHED' | 'DRAFT';
  isPublished?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CashfreeConfig {
  appId: string;
  secretKeyMasked?: string;
  environment: 'TEST' | 'PRODUCTION';
  apiVersion: string;
  isConfigured: boolean;
  testModeAllowed: boolean;
}


export interface Branch {
  id: string;
  name: string;
  location: string;
  city: string;
  totalRooms: number;
}

export interface Room {
  id: string;
  branchId: string;
  name: string;
  floor: string;
  capacity: number;
}

export interface Seat {
  id: string;
  branchId: string;
  roomId: string;
  seatNumber: number;
  status: 'available' | 'occupied' | 'maintenance';
  assignedTo?: string; // userId or studentId
  studentName?: string;
  assignedAt?: string;
}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  marks: number;
}

export interface TestItem {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  questions: TestQuestion[];
}

export interface TestSeries {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  enrolledCount: number;
  tests: TestItem[];
}

export interface TestAttempt {
  id: string;
  studentId: string;
  studentName: string;
  testId: string;
  testTitle: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  timestamp: string;
  timeSpentSeconds: number;
  rank?: number;
  status: 'completed' | 'timeout';
}

export type AuditAction =
  | 'VIEW_AADHAAR_DOCUMENT'
  | 'DOWNLOAD_AADHAAR_DOCUMENT'
  | 'STUDENT_RECORD_CHANGE'
  | 'FEE_CHANGE'
  | 'PAYMENT_STATUS_CHANGE'
  | 'COUPON_CHANGE'
  | 'RESULT_CHANGE'
  | 'ATTENDANCE_CORRECTION'
  | 'SEAT_CHANGE'
  | 'ID_CARD_GENERATED'
  | 'ID_CARD_STATUS_CHANGE'
  | 'ADMIN_CREATED'
  | 'STAFF_PERMISSIONS_CHANGE'
  | 'SECURITY_SETTINGS_CHANGE'
  | 'PAYMENT_CONFIG_CHANGE'
  | 'REGISTER_STUDENT'
  | 'ASSIGN_SEAT'
  | 'RELEASE_SEAT'
  | 'SUBMIT_TEST'
  | 'ROLE_CHANGE';

export interface AuditLog {
  id: string;
  adminId: string;
  adminName?: string;
  action: AuditAction;
  targetStudent?: string;
  targetStudentName?: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  ip?: string;
  details?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentPhotoUrl?: string;
  classLevel?: string;
  membershipType?: string;
  branchId?: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // e.g. "08:15 AM"
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'pending';
  seatNumber?: number;
  locationVerified: boolean;
  faceVerified: boolean;
  verificationMethod: 'LOCATION_FACE' | 'LOCATION_ONLY' | 'MANUAL_ADMIN' | 'PENDING';
  coordinates?: { latitude: number; longitude: number };
  distanceMeters?: number;
  capturedPhotoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  correctedBy?: string;
  correctionReason?: string;
}

export interface AttendanceCorrection {
  id: string;
  attendanceId: string;
  studentId: string;
  studentName: string;
  date: string;
  previousStatus: 'present' | 'absent' | 'late' | 'pending';
  newStatus: 'present' | 'absent' | 'late' | 'pending';
  reason: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
}

export interface GeofenceSettings {
  id: string;
  premisesName: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  isActive: boolean;
  requireFaceVerification: boolean;
  requireLocation: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface StudentDocument {
  id: string;
  studentId: string;
  documentType: 'AADHAAR_CARD' | 'STUDENT_PHOTO' | 'ADMISSION_FORM' | 'OTHER';
  documentName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  isSensitive: boolean;
}

export type IdCardStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'REVOKED';

export interface StudentIdCard {
  id: string;
  studentId: string; // Format: DF-STU-YYYY-XXXXX (e.g. DF-STU-2026-00001)
  studentName: string;
  photoUrl: string;
  course: string; // e.g. "UPSC Civil Services Foundation 2026"
  membershipType: string; // e.g. "Sanctum 24/7 Dedicated"
  validUntil: string;
  issueDate: string;
  branchId?: string;
  branchName: string;
  branchLocation?: string;
  assignedSeat?: string;
  qrCodeData: string; // Secure non-sensitive verification URL/token (no PII)
  verificationToken: string;
  status: IdCardStatus;
  bloodGroup?: string;
  emergencyContact?: string;
  showPhoneOnCard?: boolean; // Default false. Never printed unless enabled by Super Admin
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffIdCard {
  id: string;
  staffId: string; // Format: DF-STF-YYYY-XXXXX (e.g. DF-STF-2026-00001)
  staffName: string;
  photoUrl: string;
  designation: string; // e.g. "Senior Academic Proctor"
  department: string; // e.g. "Sanctum Operations"
  branchId?: string;
  branchName: string;
  joiningDate?: string;
  validUntil?: string;
  issueDate?: string;
  qrCodeData: string;
  verificationToken: string;
  status: 'ACTIVE' | 'INACTIVE' | 'REVOKED';
  bloodGroup?: string;
  emergencyContact?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IdCardSettings {
  id?: string;
  studentPrefix: string; // default "DF-STU"
  staffPrefix: string; // default "DF-STF"
  academicYear: string; // default "2026"
  studentSequenceStart?: number;
  nextStudentSequence: number;
  nextStaffSequence: number;
  institutionName: string;
  motto: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  emergencyHelpline: string;
  allowPhoneOnStudentCard: boolean; // default false
  qrVerificationBaseUrl: string;
  defaultValidityMonths: number;
}

export interface PaymentWebhookEvent {
  id: string;
  eventId: string;
  orderId: string;
  eventType: string;
  status: string;
  amount: number;
  signatureVerified: boolean;
  receivedAt: string;
  processed: boolean;
}

export interface StudentNotice {
  id: string;
  title: string;
  content: string;
  category: 'ANNOUNCEMENT' | 'STUDY_SPACE' | 'EXAM' | 'HOLIDAY';
  date: string;
  priority: 'HIGH' | 'NORMAL';
  author: string;
}
