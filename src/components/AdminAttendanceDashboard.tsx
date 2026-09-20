import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Camera,
  Edit3,
  ShieldCheck,
  Settings,
  History,
  AlertCircle,
  Save,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceCorrection,
  GeofenceSettings,
  Student,
} from '../types';

interface AdminAttendanceDashboardProps {
  attendanceRecords: AttendanceRecord[];
  students: Student[];
  geofenceSettings: GeofenceSettings;
  corrections: AttendanceCorrection[];
  adminName: string;
  adminId: string;
  onUpdateGeofence: (newSettings: GeofenceSettings) => void;
  onCorrectAttendance: (correction: AttendanceCorrection, updatedRecord: AttendanceRecord) => void;
}

export const AdminAttendanceDashboard: React.FC<AdminAttendanceDashboardProps> = ({
  attendanceRecords,
  students,
  geofenceSettings,
  corrections,
  adminName,
  adminId,
  onUpdateGeofence,
  onCorrectAttendance,
}) => {
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'GEOFENCE' | 'CORRECTIONS'>('RECORDS');
  const [selectedDate, setSelectedDate] = useState('2026-09-05');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'present' | 'absent' | 'late'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Correction Modal state
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<'present' | 'absent' | 'late'>('present');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // Geofence editable state
  const [editableGeofence, setEditableGeofence] = useState<GeofenceSettings>(geofenceSettings);
  const [geofenceSaveSuccess, setGeofenceSaveSuccess] = useState(false);

  // Filter attendance records by date
  const recordsForDate = useMemo(() => {
    return attendanceRecords.filter((r) => r.date === selectedDate);
  }, [attendanceRecords, selectedDate]);

  // Derive all students for this date: if student has no record on this date, show as absent
  const fullAttendanceList = useMemo(() => {
    return students.map((stu) => {
      const found = recordsForDate.find(
        (r) => r.studentId === stu.studentId || r.studentId === stu.id
      );

      if (found) {
        return found;
      }

      // Default synthetic absent record for that date
      return {
        id: `att-absent-${stu.studentId}-${selectedDate}`,
        studentId: stu.studentId || 'DF-STU-TEMP',
        studentName: stu.name,
        studentPhotoUrl: stu.photoUrl,
        classLevel: stu.classLevel || stu.course,
        membershipType: stu.membershipType,
        date: selectedDate,
        checkIn: '--',
        status: 'absent' as const,
        locationVerified: false,
        faceVerified: false,
        verificationMethod: 'PENDING' as const,
        createdAt: `${selectedDate}T00:00:00Z`,
      };
    });
  }, [students, recordsForDate, selectedDate]);

  // Filtered by dropdowns and search
  const filteredList = useMemo(() => {
    return fullAttendanceList.filter((item) => {
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
      if (selectedClass !== 'ALL' && item.classLevel !== selectedClass) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.studentName.toLowerCase().includes(query);
        const matchesId = item.studentId.toLowerCase().includes(query);
        if (!matchesName && !matchesId) return false;
      }
      return true;
    });
  }, [fullAttendanceList, selectedStatus, selectedClass, searchQuery]);

  // Aggregate stats for this date
  const stats = useMemo(() => {
    const total = fullAttendanceList.length;
    const present = fullAttendanceList.filter((r) => r.status === 'present').length;
    const late = fullAttendanceList.filter((r) => r.status === 'late').length;
    const absent = fullAttendanceList.filter((r) => r.status === 'absent').length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, late, absent, rate };
  }, [fullAttendanceList]);

  // Handle Correction Submit
  const handleSaveCorrection = () => {
    if (!correctionTarget) return;
    if (!correctionReason || correctionReason.trim().length < 5) {
      setCorrectionError('Mandatory reason (at least 5 characters) must be entered for institutional audit.');
      return;
    }

    const updatedRecord: AttendanceRecord = {
      ...correctionTarget,
      status: newStatus,
      checkIn: correctionTarget.checkIn === '--' && newStatus !== 'absent' ? '08:30 AM (Admin Overridden)' : correctionTarget.checkIn,
      locationVerified: newStatus !== 'absent' ? true : correctionTarget.locationVerified,
      faceVerified: newStatus !== 'absent' ? true : correctionTarget.faceVerified,
      verificationMethod: 'MANUAL_ADMIN',
      correctedBy: adminName,
      correctionReason: correctionReason.trim(),
      updatedAt: new Date().toISOString(),
    };

    const newCorrection: AttendanceCorrection = {
      id: `cor-${Date.now()}`,
      attendanceId: correctionTarget.id,
      studentId: correctionTarget.studentId,
      studentName: correctionTarget.studentName,
      date: correctionTarget.date,
      previousStatus: correctionTarget.status,
      newStatus,
      reason: correctionReason.trim(),
      changedBy: adminId,
      changedByName: adminName,
      changedAt: new Date().toISOString(),
    };

    onCorrectAttendance(newCorrection, updatedRecord);
    setCorrectionTarget(null);
    setCorrectionReason('');
    setCorrectionError(null);
  };

  const handleSaveGeofence = () => {
    onUpdateGeofence(editableGeofence);
    setGeofenceSaveSuccess(true);
    setTimeout(() => setGeofenceSaveSuccess(false), 3000);
  };

  return (
    <div id="darulfaham-admin-attendance-dashboard" className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-950 border border-purple-200">
              Institutional Administration
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sanctum Attendance Operations Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor real-time biometric and geofenced student check-ins, configure premises boundaries, and execute audited attendance corrections.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('RECORDS')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'RECORDS'
                ? 'bg-purple-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Attendance Log</span>
          </button>
          <button
            onClick={() => setActiveTab('GEOFENCE')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'GEOFENCE'
                ? 'bg-purple-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Geofence Rules</span>
          </button>
          <button
            onClick={() => setActiveTab('CORRECTIONS')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'CORRECTIONS'
                ? 'bg-purple-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Corrections</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ATTENDANCE RECORDS */}
      {activeTab === 'RECORDS' && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500">Total Enrolled</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
              <span className="text-[11px] font-semibold text-emerald-700">Present</span>
              <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.present}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/20">
              <span className="text-[11px] font-semibold text-amber-700">Late Arrivals</span>
              <div className="text-2xl font-bold text-amber-800 mt-1">{stats.late}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50/20">
              <span className="text-[11px] font-semibold text-rose-700">Absent</span>
              <div className="text-2xl font-bold text-rose-800 mt-1">{stats.absent}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm bg-purple-50/30 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-purple-900">Attendance Rate</span>
              <div className="text-2xl font-bold text-purple-950 mt-1">{stats.rate}%</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-600 transition-colors"
                />
              </div>

              {/* Date selector */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-purple-600"
              />

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e: any) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-purple-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="present">Present Only</option>
                <option value="late">Late Only</option>
                <option value="absent">Absent Only</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredList.length}</strong> of {fullAttendanceList.length} students
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class / Course</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Verification Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((rec) => {
                    const isPresent = rec.status === 'present';
                    const isLate = rec.status === 'late';
                    const isAbsent = rec.status === 'absent';

                    return (
                      <tr key={rec.id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                rec.studentPhotoUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={rec.studentName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{rec.studentName}</div>
                              <div className="font-mono text-[11px] text-slate-500">{rec.studentId}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">
                          {rec.classLevel || 'UPSC Civil Services Foundation'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-800 font-semibold">{rec.checkIn}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {rec.locationVerified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                                <MapPin className="w-3 h-3 text-emerald-600" />
                                <span>GPS {rec.distanceMeters ? `(${rec.distanceMeters}m)` : 'OK'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                                No GPS
                              </span>
                            )}

                            {rec.faceVerified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-semibold">
                                <Camera className="w-3 h-3 text-purple-700" />
                                <span>Biometric Face</span>
                              </span>
                            ) : null}

                            {rec.verificationMethod === 'MANUAL_ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold">
                                <ShieldCheck className="w-3 h-3 text-amber-700" />
                                <span>Admin Override</span>
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-800'
                                : isLate
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rec.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setCorrectionTarget(rec);
                              setNewStatus(rec.status);
                              setCorrectionReason('');
                              setCorrectionError(null);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-950 border border-slate-200 hover:border-purple-300 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Correct</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: GEOFENCE CONFIGURATION */}
      {activeTab === 'GEOFENCE' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-3xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Study Sanctum Geofence Settings</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define the authorized GPS perimeter and verification prerequisites required for valid attendance logging.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>

          {geofenceSaveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Geofence parameters updated and synchronized to server.</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Premises Description / Campus Name</label>
              <input
                type="text"
                value={editableGeofence.premisesName}
                onChange={(e) => setEditableGeofence({ ...editableGeofence, premisesName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-600 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campus Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editableGeofence.latitude}
                  onChange={(e) => setEditableGeofence({ ...editableGeofence, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campus Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editableGeofence.longitude}
                  onChange={(e) => setEditableGeofence({ ...editableGeofence, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-600 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Allowed Geofence Radius: <strong className="text-purple-900 font-extrabold">{editableGeofence.allowedRadiusMeters} meters</strong>
              </label>
              <input
                type="range"
                min="20"
                max="500"
                step="10"
                value={editableGeofence.allowedRadiusMeters}
                onChange={(e) => setEditableGeofence({ ...editableGeofence, allowedRadiusMeters: parseInt(e.target.value, 10) })}
                className="w-full accent-purple-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>20m (Strict Entrance)</span>
                <span>100m (Standard Sanctum)</span>
                <span>500m (Campus Wide)</span>
              </div>
            </div>

            {/* Verification Switches */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">Enforce GPS Geofence Verification</div>
                  <div className="text-[11px] text-slate-500">
                    Students must be strictly within {editableGeofence.allowedRadiusMeters}m to submit check-in.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editableGeofence.requireLocation}
                  onChange={(e) => setEditableGeofence({ ...editableGeofence, requireLocation: e.target.checked })}
                  className="w-4 h-4 accent-purple-900 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">Require Biometric Face Verification Foundation</div>
                  <div className="text-[11px] text-slate-500">
                    Captures front camera snapshot for anti-proxy facial validation.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editableGeofence.requireFaceVerification}
                  onChange={(e) => setEditableGeofence({ ...editableGeofence, requireFaceVerification: e.target.checked })}
                  className="w-4 h-4 accent-purple-900 rounded cursor-pointer"
                />
              </label>
            </div>

            <button
              onClick={handleSaveGeofence}
              className="mt-4 px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Deploy Geofence Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: CORRECTIONS AUDIT LOG */}
      {activeTab === 'CORRECTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance Correction Audit Trail</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every administrative modification requires a mandatory justification and is permanently stamped.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-950">
              {corrections.length} Audit Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Attendance Date</th>
                  <th className="py-3 px-4">Status Shift</th>
                  <th className="py-3 px-4">Justification Reason</th>
                  <th className="py-3 px-4">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {corrections.map((cor) => (
                  <tr key={cor.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(cor.changedAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {cor.studentName}
                      <div className="font-mono text-[10px] text-slate-400 font-normal">{cor.studentId}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{cor.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-bold">
                        <span className="text-rose-600 line-through text-[10px]">{cor.previousStatus.toUpperCase()}</span>
                        <span>→</span>
                        <span className="text-emerald-700 text-[10px]">{cor.newStatus.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-sm">{cor.reason}</td>
                    <td className="py-3.5 px-4 font-semibold text-purple-900">{cor.changedByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CORRECTION MODAL */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-purple-950 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Administrative Attendance Correction</h3>
                <p className="text-xs text-purple-200 mt-0.5">Audited Override for {correctionTarget.studentName}</p>
              </div>
              <button
                onClick={() => setCorrectionTarget(null)}
                className="text-white/70 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID:</span>
                  <span className="font-mono font-bold text-slate-800">{correctionTarget.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Date:</span>
                  <span className="font-bold text-slate-800">{correctionTarget.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-bold uppercase text-purple-900">{correctionTarget.status}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">New Attendance Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['present', 'late', 'absent'] as const).map((statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() => setNewStatus(statusOption)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        newStatus === statusOption
                          ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {statusOption.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mandatory Correction Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Student present in Room 101, confirmed manually after biometric scanner issue."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-600"
                />
              </div>

              {correctionError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{correctionError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  className="flex-1 py-2.5 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold transition-colors shadow"
                >
                  Confirm & Audit Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
