import React, { useState } from 'react';
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
  ShieldCheck,
  Edit3,
  Sliders,
  AlertCircle,
  FileSpreadsheet,
  PlusCircle,
  History,
  Save,
  Check,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceCorrection,
  GeofenceSettings,
  Student,
  UserProfile,
  Branch,
} from '../../types';

interface AdminAttendanceSectionProps {
  currentUser: UserProfile;
  students: Student[];
  branches: Branch[];
  attendanceRecords: AttendanceRecord[];
  corrections: AttendanceCorrection[];
  geofenceSettings: GeofenceSettings;
  onCorrectAttendance: (correction: AttendanceCorrection, updatedRecord: AttendanceRecord) => void;
  onUpdateGeofence: (newSettings: GeofenceSettings) => void;
}

export const AdminAttendanceSection: React.FC<AdminAttendanceSectionProps> = ({
  currentUser,
  students,
  branches,
  attendanceRecords,
  corrections,
  geofenceSettings,
  onCorrectAttendance,
  onUpdateGeofence,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'LEDGER' | 'CORRECTIONS' | 'GEOFENCE'>('LEDGER');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'pending'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Correction Modal State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<'present' | 'absent' | 'late' | 'pending'>('present');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // Manual Mark Modal State
  const [isManualMarkOpen, setIsManualMarkOpen] = useState(false);
  const [manualStudentId, setManualStudentId] = useState(students[0]?.studentId || '');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualStatus, setManualStatus] = useState<'present' | 'absent' | 'late'>('present');
  const [manualReason, setManualReason] = useState('');

  // Geofence form state
  const [geoForm, setGeoForm] = useState<GeofenceSettings>({ ...geofenceSettings });
  const [geoSavedNotification, setGeoSavedNotification] = useState(false);

  const canEdit = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  // Metrics computation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);
  const presentToday = todayRecords.filter((r) => r.status === 'present').length;
  const lateToday = todayRecords.filter((r) => r.status === 'late').length;
  const absentToday = todayRecords.filter((r) => r.status === 'absent').length;
  const totalEnrolled = students.length || 4;
  const overallRate = totalEnrolled > 0 ? Math.round(((presentToday + lateToday) / totalEnrolled) * 100) : 0;

  // Filtered ledger records
  const filteredRecords = attendanceRecords.filter((rec) => {
    const matchesSearch =
      rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    const matchesDate = !dateFilter || rec.date === dateFilter;
    const matchesBranch = branchFilter === 'all' || rec.branchId === branchFilter;

    return matchesSearch && matchesStatus && matchesDate && matchesBranch;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenCorrection = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setNewStatus(record.status);
    setCorrectionReason('');
    setCorrectionError(null);
  };

  const handleSaveCorrection = () => {
    if (!editingRecord) return;
    if (!correctionReason.trim() || correctionReason.trim().length < 6) {
      setCorrectionError('Mandatory reason (at least 6 characters) must be documented for institutional audit trail.');
      return;
    }

    const correction: AttendanceCorrection = {
      id: `cor-${Date.now()}`,
      attendanceId: editingRecord.id,
      studentId: editingRecord.studentId,
      studentName: editingRecord.studentName,
      date: editingRecord.date,
      previousStatus: editingRecord.status,
      newStatus,
      reason: correctionReason.trim(),
      changedBy: currentUser.uid,
      changedByName: `${currentUser.displayName} (${currentUser.role})`,
      changedAt: new Date().toISOString(),
    };

    const updatedRecord: AttendanceRecord = {
      ...editingRecord,
      status: newStatus,
      verificationMethod: 'MANUAL_ADMIN',
      updatedAt: new Date().toISOString(),
    };

    onCorrectAttendance(correction, updatedRecord);
    setEditingRecord(null);
  };

  const handleManualMarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReason.trim()) {
      setCorrectionError('Please specify authorization reason.');
      return;
    }

    const student = students.find((s) => s.studentId === manualStudentId);
    if (!student) return;

    const newRecordId = `att-${student.studentId.toLowerCase()}-${manualDate}`;
    const newRecord: AttendanceRecord = {
      id: newRecordId,
      studentId: student.studentId,
      studentName: student.name,
      studentPhotoUrl: student.profilePhotoUrl,
      classLevel: student.course || 'UPSC Civil Services Foundation 2026',
      membershipType: student.membershipType || 'Sanctum 24/7 Dedicated',
      branchId: student.branchId || 'branch-central',
      date: manualDate,
      checkIn: manualStatus === 'absent' ? '--' : '08:30 AM',
      checkOut: manualStatus === 'absent' ? '--' : '06:00 PM',
      status: manualStatus,
      seatNumber: student.seatNumber,
      locationVerified: manualStatus !== 'absent',
      faceVerified: manualStatus !== 'absent',
      verificationMethod: 'MANUAL_ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const correction: AttendanceCorrection = {
      id: `cor-${Date.now()}`,
      attendanceId: newRecordId,
      studentId: student.studentId,
      studentName: student.name,
      date: manualDate,
      previousStatus: 'pending',
      newStatus: manualStatus,
      reason: manualReason,
      changedBy: currentUser.uid,
      changedByName: `${currentUser.displayName} (${currentUser.role})`,
      changedAt: new Date().toISOString(),
    };

    onCorrectAttendance(correction, newRecord);
    setIsManualMarkOpen(false);
    setManualReason('');
  };

  const handleSaveGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGeofence(geoForm);
    setGeoSavedNotification(true);
    setTimeout(() => setGeoSavedNotification(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-100">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Attendance Governance & Geofence Console</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time biometric validation, perimeter verification, administrative corrections, and audit-logged overrides.
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              id="btn-manual-mark-attendance"
              onClick={() => setIsManualMarkOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Manual Mark / Override</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 mb-1">Total Enrolled</div>
          <div className="text-2xl font-extrabold text-slate-900">{totalEnrolled}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active sanctum scholars</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 mb-1">Present Today</div>
          <div className="text-2xl font-extrabold text-emerald-700">{presentToday}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Location & selfie verified</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 mb-1">Late Today</div>
          <div className="text-2xl font-extrabold text-amber-700">{lateToday}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">After 09:00 AM</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 mb-1">Absent Today</div>
          <div className="text-2xl font-extrabold text-rose-700">{absentToday}</div>
          <div className="text-[10px] text-rose-500 mt-0.5">Unchecked scholars</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-purple-900 mb-1">Sanctum Attendance Rate</div>
          <div className="text-2xl font-extrabold text-purple-900">{overallRate}%</div>
          <div className="text-[10px] text-purple-700 mt-0.5">Perimeter utilization</div>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('LEDGER')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'LEDGER'
              ? 'border-purple-900 text-purple-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Attendance Ledger ({attendanceRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CORRECTIONS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'CORRECTIONS'
              ? 'border-purple-900 text-purple-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Correction & Audit Trail ({corrections.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('GEOFENCE')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'GEOFENCE'
              ? 'border-purple-900 text-purple-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Campus Geofence Settings</span>
        </button>
      </div>

      {/* SUB-TAB 1: ATTENDANCE LEDGER */}
      {activeSubTab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search student name or DF-STU ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={(e: any) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-xs text-purple-700 hover:text-purple-900 font-semibold underline"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class / Course</th>
                    <th className="py-3 px-4">Membership</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Face Biometrics</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        No attendance records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-900">
                          {rec.studentId}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={rec.studentPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                              alt={rec.studentName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <span className="font-semibold text-slate-900">{rec.studentName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {rec.classLevel || 'Civil Services 2026'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                            {rec.membershipType || 'Sanctum 24/7'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">{rec.date}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                          {rec.checkIn || '--'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              rec.status === 'present'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : rec.status === 'late'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : rec.status === 'absent'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {rec.status === 'present' && <CheckCircle2 className="w-3 h-3" />}
                            {rec.status === 'late' && <Clock className="w-3 h-3" />}
                            {rec.status === 'absent' && <XCircle className="w-3 h-3" />}
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {rec.locationVerified ? (
                            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1 text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{rec.distanceMeters ?? 32}m</span>
                            </span>
                          ) : (
                            <span className="text-rose-600 inline-flex items-center gap-1 text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Outside</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {rec.faceVerified ? (
                            <span className="text-purple-900 font-semibold inline-flex items-center gap-1 text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Pending</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {canEdit && (
                            <button
                              id={`btn-correct-attendance-${rec.id}`}
                              onClick={() => handleOpenCorrection(rec)}
                              className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Correct</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="font-bold text-slate-800">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CORRECTIONS & AUDIT TRAIL */}
      {activeSubTab === 'CORRECTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-900">Attendance Modification Audit Trail</h4>
            <p className="text-xs text-slate-500">
              Mandatory documented log of all administrative corrections, status modifications, and justification reasons.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Correction ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Previous Status</th>
                  <th className="py-3 px-4">New Status</th>
                  <th className="py-3 px-4">Authorized Reason</th>
                  <th className="py-3 px-4">Modified By</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {corrections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No administrative attendance corrections recorded yet.
                    </td>
                  </tr>
                ) : (
                  corrections.map((cor) => (
                    <tr key={cor.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-900">{cor.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{cor.studentName}</span>
                        <span className="font-mono text-[10px] text-slate-400">{cor.studentId}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{cor.date}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                          {cor.previousStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          {cor.newStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-sm">
                        <span className="italic font-medium">"{cor.reason}"</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-purple-900">
                        {cor.changedByName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {new Date(cor.changedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CAMPUS GEOFENCE SETTINGS */}
      {activeSubTab === 'GEOFENCE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
            <div>
              <h4 className="text-base font-bold text-slate-900">Configurable Premises Geofence</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Set coordinates and allowed radius. Values are dynamic and stored securely without hardcoding.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-100">
              <MapPin className="w-5 h-5" />
            </div>
          </div>

          {geoSavedNotification && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Geofence parameters updated successfully! Future check-ins will adhere to the new coordinates.</span>
            </div>
          )}

          <form onSubmit={handleSaveGeofence} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Study Sanctum Campus Name
              </label>
              <input
                type="text"
                value={geoForm.premisesName}
                onChange={(e) => setGeoForm({ ...geoForm, premisesName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={geoForm.latitude}
                  onChange={(e) => setGeoForm({ ...geoForm, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={geoForm.longitude}
                  onChange={(e) => setGeoForm({ ...geoForm, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Allowed Attendance Radius (Meters)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={geoForm.allowedRadiusMeters}
                  onChange={(e) => setGeoForm({ ...geoForm, allowedRadiusMeters: parseInt(e.target.value, 10) })}
                  className="flex-1 accent-purple-800"
                />
                <span className="font-mono font-bold text-purple-900 text-sm w-16 text-right">
                  {geoForm.allowedRadiusMeters}m
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                A student attempting check-in beyond {geoForm.allowedRadiusMeters} meters will be rejected by the backend.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={geoForm.isActive}
                  onChange={(e) => setGeoForm({ ...geoForm, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-purple-800 focus:ring-purple-500"
                />
                <span>Active Geofence Enforcement</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={geoForm.requireFaceVerification}
                  onChange={(e) => setGeoForm({ ...geoForm, requireFaceVerification: e.target.checked })}
                  className="rounded border-slate-300 text-purple-800 focus:ring-purple-500"
                />
                <span>Require Camera Face Verification Foundation</span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Geofence Parameters</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ATTENDANCE CORRECTION */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-purple-900">
                <Edit3 className="w-5 h-5" />
                <h4 className="font-bold text-slate-900 text-base">Administrative Attendance Correction</h4>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-950">
              <div><strong className="text-purple-900">Student:</strong> {editingRecord.studentName} ({editingRecord.studentId})</div>
              <div><strong className="text-purple-900">Session Date:</strong> {editingRecord.date}</div>
              <div><strong className="text-purple-900">Current Status:</strong> <span className="uppercase font-bold">{editingRecord.status}</span></div>
            </div>

            {correctionError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{correctionError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Attendance Status
              </label>
              <select
                value={newStatus}
                onChange={(e: any) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
              >
                <option value="present">PRESENT</option>
                <option value="late">LATE</option>
                <option value="absent">ABSENT</option>
                <option value="pending">PENDING</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Correction Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Student was present in Room 101 but biometric verification failed due to network glitch."
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                This explanation is immutably linked to this record in institutional audit logs.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Confirm & Log Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL MARK */}
      {isManualMarkOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-purple-900">
                <PlusCircle className="w-5 h-5" />
                <h4 className="font-bold text-slate-900 text-base">Manually Mark Attendance</h4>
              </div>
              <button
                onClick={() => setIsManualMarkOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualMarkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Student
                </label>
                <select
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                >
                  {students.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.name} ({s.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={manualStatus}
                    onChange={(e: any) => setManualStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="present">PRESENT</option>
                    <option value="late">LATE</option>
                    <option value="absent">ABSENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Manual Entry <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Student physical identity verified at reception."
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualMarkOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
