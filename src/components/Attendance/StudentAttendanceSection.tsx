import React, { useState } from 'react';
import {
  CalendarCheck,
  MapPin,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Calendar as CalendarIcon,
  HelpCircle
} from 'lucide-react';
import { AttendanceRecord, GeofenceSettings, Student, UserProfile } from '../../types';
import { AttendanceVerificationModal } from '../AttendanceVerificationModal';

interface StudentAttendanceSectionProps {
  currentUser: UserProfile;
  student: Student | undefined;
  attendanceRecords: AttendanceRecord[];
  geofenceSettings: GeofenceSettings;
  onAttendanceRecorded: (record: AttendanceRecord) => void;
}

export const StudentAttendanceSection: React.FC<StudentAttendanceSectionProps> = ({
  currentUser,
  student,
  attendanceRecords,
  geofenceSettings,
  onAttendanceRecorded,
}) => {
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');

  // Filter records strictly belonging to the logged-in student
  const studentId = currentUser.studentId || student?.studentId || 'DF-STU-2026-00001';
  const myRecords = attendanceRecords.filter((r) => r.studentId === studentId);

  // Compute metrics
  const totalDays = myRecords.length || 25;
  const presentDays = myRecords.filter((r) => r.status === 'present').length;
  const absentDays = myRecords.filter((r) => r.status === 'absent').length;
  const lateDays = myRecords.filter((r) => r.status === 'late').length;
  const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

  // Today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = myRecords.find((r) => r.date === todayStr);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-900 font-bold mb-1">
            <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
              <CalendarCheck className="w-5 h-5 text-purple-800" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              My Attendance & Sanctum Check-In
            </h2>
          </div>
          <p className="text-xs text-slate-600">
            Automated location geofencing & biometric face recognition for DARULFAHAM study space.
          </p>
        </div>

        {/* Read-Only Notice */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 self-start md:self-auto">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Attendance records are permanent and read-only for students.</span>
        </div>
      </div>

      {/* Attendance Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Total Logged</span>
            <CalendarIcon className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalDays}</div>
          <div className="text-[11px] text-slate-500 mt-1">Official working sessions</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1">
            <span>Present Days</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{presentDays}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Within perimeter & verified</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-700 font-semibold mb-1">
            <span>Absent Days</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700">{absentDays}</div>
          <div className="text-[11px] text-rose-500 mt-1">Missed study hall sessions</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-purple-900 font-semibold mb-1">
            <span>Attendance Rate</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
              {attendanceRate >= 85 ? 'Excellent' : 'Needs Focus'}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-purple-900">{attendanceRate}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-purple-800 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's Live Attendance Box */}
      <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-800" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200">
              <Clock className="w-3.5 h-3.5 text-purple-800" />
              <span>Today's Study Session • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {todayRecord ? "Today's Attendance Recorded" : "Sanctum Attendance Check-In"}
            </h3>

            {todayRecord ? (
              <p className="text-xs text-slate-600 max-w-xl">
                You checked in at <strong className="text-slate-900">{todayRecord.checkIn}</strong>. 
                Your session is verified and saved to the institutional attendance ledger.
              </p>
            ) : (
              <p className="text-xs text-slate-600 max-w-xl">
                Please ensure you are within <strong>{geofenceSettings.allowedRadiusMeters} meters</strong> of {geofenceSettings.premisesName}. 
                Camera snapshot is required for biometric authentication.
              </p>
            )}

            {todayRecord && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Status: {todayRecord.status.toUpperCase()}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-purple-700" />
                  <span>Location Verified ({todayRecord.distanceMeters ?? 32}m)</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                  <span>Face Verified</span>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
            {todayRecord ? (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                  <Lock className="w-4 h-4 text-purple-700" />
                  <span>Day Closed & Locked</span>
                </div>
                <span className="text-[10px] text-purple-700 block mt-0.5">Read-only protection active</span>
              </div>
            ) : (
              <button
                id="btn-mark-today-attendance"
                type="button"
                onClick={() => setIsVerificationModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Camera className="w-4 h-4" />
                <span>Mark Today's Attendance</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Attendance Log History</h4>
            <p className="text-xs text-slate-500">Official log of check-in times and verification badges.</p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Displaying all {myRecords.length} recorded sessions
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Location Verification</th>
                <th className="py-3 px-4">Biometric Verification</th>
                <th className="py-3 px-4 text-right">Protection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {myRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    {rec.date}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {rec.checkIn || '--'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {rec.checkOut || '--'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        rec.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rec.status === 'late'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-semibold">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Verified ({rec.distanceMeters ?? 32}m)</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">--</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {rec.faceVerified ? (
                      <span className="inline-flex items-center gap-1 text-purple-900 text-[11px] font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                        <span>Face Snapshot OK</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Pending</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-slate-400 text-[10px]">
                      <Lock className="w-3 h-3" />
                      <span>Read-Only</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Verification Modal */}
      {isVerificationModalOpen && (
        <AttendanceVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          studentId={studentId}
          studentName={student?.name || currentUser.displayName}
          studentPhotoUrl={student?.profilePhotoUrl}
          classLevel={student?.course || 'UPSC Civil Services Foundation 2026'}
          membershipType={student?.membershipType || 'Sanctum 24/7 Dedicated'}
          assignedSeat={student?.seatNumber ? `Seat #${student.seatNumber}` : undefined}
          geofenceSettings={geofenceSettings}
          onSuccess={(newRec) => {
            onAttendanceRecorded(newRec);
            setIsVerificationModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
