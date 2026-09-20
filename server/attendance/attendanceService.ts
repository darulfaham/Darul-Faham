export interface GeofenceConfig {
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

export interface AttendanceRecordPayload {
  id: string;
  studentId: string;
  studentName: string;
  studentPhotoUrl?: string;
  classLevel?: string;
  membershipType?: string;
  branchId?: string;
  date: string;
  checkIn: string;
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

let activeGeofence: GeofenceConfig = {
  id: 'geo-hazratganj-main',
  premisesName: 'DARULFAHAM Central Study Sanctum (Hazratganj Campus)',
  latitude: 26.8467,
  longitude: 80.9462,
  allowedRadiusMeters: 100,
  isActive: true,
  requireFaceVerification: true,
  requireLocation: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'Dr. Tariq Rahman (Super Admin)',
};

// In-memory cache of server attendance records
const serverAttendanceStore: Map<string, AttendanceRecordPayload> = new Map();

// Helper: Haversine distance calculation in meters
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const ServerAttendanceService = {
  getGeofenceConfig(): GeofenceConfig {
    return { ...activeGeofence };
  },

  updateGeofenceConfig(config: Partial<GeofenceConfig>, adminName: string): GeofenceConfig {
    activeGeofence = {
      ...activeGeofence,
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: adminName,
    };
    return { ...activeGeofence };
  },

  verifyCoordinates(latitude: number, longitude: number): {
    isWithinRadius: boolean;
    distanceMeters: number;
    allowedRadiusMeters: number;
    premisesName: string;
  } {
    const distance = calculateHaversineDistance(
      latitude,
      longitude,
      activeGeofence.latitude,
      activeGeofence.longitude
    );

    return {
      isWithinRadius: distance <= activeGeofence.allowedRadiusMeters,
      distanceMeters: distance,
      allowedRadiusMeters: activeGeofence.allowedRadiusMeters,
      premisesName: activeGeofence.premisesName,
    };
  },

  recordCheckIn(params: {
    studentId: string;
    studentName: string;
    studentPhotoUrl?: string;
    classLevel?: string;
    membershipType?: string;
    branchId?: string;
    seatNumber?: number;
    coordinates?: { latitude: number; longitude: number };
    faceSnapshotBase64?: string;
    faceConfidenceScore?: number;
  }): {
    success: boolean;
    error?: string;
    record?: AttendanceRecordPayload;
  } {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Authoritative server timestamp (Format: 08:15 AM)
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
    const checkInTime = `${formattedHours}:${minutes} ${ampm}`;

    // Status: If past 09:00 AM, mark as 'late', otherwise 'present'
    const isLate = hours > 9 || (hours === 9 && Number(minutes) > 0);
    const status: 'present' | 'late' = isLate ? 'late' : 'present';

    // 1. Location Validation
    let locationVerified = false;
    let distanceMeters = 0;

    if (activeGeofence.requireLocation && params.coordinates) {
      const geoCheck = this.verifyCoordinates(params.coordinates.latitude, params.coordinates.longitude);
      distanceMeters = geoCheck.distanceMeters;
      locationVerified = geoCheck.isWithinRadius;

      if (!locationVerified && activeGeofence.isActive) {
        return {
          success: false,
          error: `Location verification failed: You are ${distanceMeters}m away from ${activeGeofence.premisesName}. Attendance is permitted only within ${activeGeofence.allowedRadiusMeters}m of study sanctum premises.`,
        };
      }
    } else if (activeGeofence.requireLocation && !params.coordinates) {
      return {
        success: false,
        error: 'Location coordinates are required to mark attendance at DARULFAHAM premises.',
      };
    } else {
      locationVerified = true;
    }

    // 2. Face Verification foundation check
    let faceVerified = false;
    if (params.faceSnapshotBase64) {
      // In production, passes to AI/biometric pipeline.
      // Foundation confirms non-empty capture frame and confidence threshold.
      faceVerified = (params.faceConfidenceScore ?? 85) >= 70;
    }

    const verificationMethod = faceVerified && locationVerified
      ? 'LOCATION_FACE'
      : locationVerified
      ? 'LOCATION_ONLY'
      : 'PENDING';

    const recordId = `att-${params.studentId.toLowerCase()}-${dateStr}`;

    const record: AttendanceRecordPayload = {
      id: recordId,
      studentId: params.studentId,
      studentName: params.studentName,
      studentPhotoUrl: params.studentPhotoUrl,
      classLevel: params.classLevel || 'UPSC Civil Services 2026',
      membershipType: params.membershipType || 'Sanctum 24/7 Dedicated',
      branchId: params.branchId || 'branch-central',
      date: dateStr,
      checkIn: checkInTime,
      status,
      seatNumber: params.seatNumber,
      locationVerified,
      faceVerified,
      verificationMethod,
      coordinates: params.coordinates,
      distanceMeters,
      capturedPhotoUrl: params.faceSnapshotBase64 ? 'data:image/jpeg;base64,...' : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    serverAttendanceStore.set(recordId, record);

    return {
      success: true,
      record,
    };
  },

  correctAttendance(params: {
    attendanceId: string;
    studentId: string;
    studentName: string;
    date: string;
    previousStatus: 'present' | 'absent' | 'late' | 'pending';
    newStatus: 'present' | 'absent' | 'late' | 'pending';
    reason: string;
    adminId: string;
    adminName: string;
  }): {
    success: boolean;
    error?: string;
    correctionId?: string;
  } {
    if (!params.reason || params.reason.trim().length < 5) {
      return {
        success: false,
        error: 'Mandatory correction reason (at least 5 characters) must be provided for audit logging.',
      };
    }

    const correctionId = `cor-${Date.now()}`;
    return {
      success: true,
      correctionId,
    };
  },
};
