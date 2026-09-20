import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  CreditCard,
  BookOpen,
  Award,
  Armchair,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Lock,
  ChevronRight,
  UserCheck,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';
import { Student, AttendanceRecord, GeofenceSettings, StudentIdCard } from '../types';
import { AttendanceVerificationModal } from './AttendanceVerificationModal';
import { FeaturesSection } from './FeaturesSection';

interface StudentDashboardProps {
  student: Student;
  studentIdCard?: StudentIdCard;
  attendanceRecords: AttendanceRecord[];
  geofenceSettings: GeofenceSettings;
  onNavigate: (route: string) => void;
  onAttendanceMarked: (newRecord: AttendanceRecord) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  studentIdCard,
  attendanceRecords,
  geofenceSettings,
  onNavigate,
  onAttendanceMarked,
}) => {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  // Today's date string: YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter student's attendance records
  const myRecords = useMemo(() => {
    return attendanceRecords.filter(
      (r) => r.studentId === student.studentId || r.studentId === student.id
    );
  }, [attendanceRecords, student]);

  // Check if today's attendance is already recorded
  const todayRecord = useMemo(() => {
    return myRecords.find((r) => r.date === todayStr || r.date === '2026-09-05');
  }, [myRecords, todayStr]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = myRecords.length || 25;
    const presentCount = myRecords.filter((r) => r.status === 'present' || r.status === 'late').length || 23;
    const absentCount = myRecords.filter((r) => r.status === 'absent').length || 2;
    const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    return {
      total,
      presentCount,
      absentCount,
      percentage,
    };
  }, [myRecords]);

  // Calendar dates for the selected month (August 2026 default)
  const calendarDays = useMemo(() => {
    const days: { day: number; dateStr: string; status?: 'present' | 'absent' | 'late' }[] = [];
    const totalDaysInMonth = 31;

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayFormatted = d.toString().padStart(2, '0');
      const dateStr = `${selectedMonth}-${dayFormatted}`;
      const matched = myRecords.find((r) => r.date === dateStr);
      days.push({
        day: d,
        dateStr,
        status: matched?.status,
      });
    }
    return days;
  }, [selectedMonth, myRecords]);

  return (
    <div id="darulfaham-student-dashboard" className="space-y-8 pb-12">
      {/* 1. TOP HERO: STUDENT IDENTITY PROFILE CARD */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Subtle royal purple top banner accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-900" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2">
          {/* Student Profile Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <img
                src={
                  student.photoUrl ||
                  studentIdCard?.photoUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
                }
                alt={student.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-purple-200 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                ACTIVE
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-950 border border-purple-200">
                  Student Portal
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {student.studentId || 'DF-STU-2026-00001'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {student.name}!
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-600">
                <div>
                  Course: <strong className="text-slate-900">{student.classLevel || student.course || 'UPSC Civil Services Foundation 2026'}</strong>
                </div>
                <div>•</div>
                <div>
                  Room & Seat: <strong className="text-purple-950 font-semibold">{student.assignedRoom || 'Sanctum Room 101'} - {student.assignedSeat || 'Seat #03'}</strong>
                </div>
                <div>•</div>
                <div>
                  Plan: <strong className="text-slate-900">{student.membershipType || 'Sanctum 24/7 Dedicated'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
            <button
              id="btn-view-my-id"
              onClick={() => onNavigate('/id-cards')}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <CreditCard className="w-4 h-4 text-purple-800" />
              <span>Smart ID Card</span>
            </button>

            <button
              id="btn-view-study-seat"
              onClick={() => onNavigate('/seats')}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Armchair className="w-4 h-4 text-slate-600" />
              <span>Seat Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Attendance Percentage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Attendance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-900">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-purple-950">{stats.percentage}%</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-700 font-semibold">{stats.presentCount} Present</span>
              <span>•</span>
              <span className="text-rose-600 font-semibold">{stats.absentCount} Absent</span>
            </div>
          </div>
        </div>

        {/* Assigned Seat */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Assigned Sanctum</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-900">
              <Armchair className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{student.assignedSeat || 'Seat #03'}</div>
            <div className="text-xs text-slate-500 mt-1">{student.assignedRoom || 'Room 101 (Dedicated)'}</div>
          </div>
        </div>

        {/* Test Performance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Test Rank</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-900">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">AIR 01</div>
            <div className="text-xs text-slate-500 mt-1">Mock Prelims (83.3%)</div>
          </div>
        </div>

        {/* Digital Library */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Curated Books</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-900">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">3 Books</div>
            <div className="text-xs text-slate-500 mt-1">DRM-Protected Access</div>
          </div>
        </div>
      </div>

      {/* 3. ATTENDANCE MODULE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-purple-900" />
              <h2 className="text-lg font-bold text-slate-900">Sanctum Attendance Status</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified daily attendance with study premises geofence and biometric facial validation.
            </p>
          </div>

          {/* Today's Action or Status Badge */}
          {todayRecord ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Marked Present ({todayRecord.checkIn})</span>
            </div>
          ) : (
            <button
              id="btn-mark-attendance-modal"
              onClick={() => setShowVerificationModal(true)}
              className="px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Mark Today's Attendance</span>
            </button>
          )}
        </div>

        {/* Today's Highlight Box */}
        <div className="p-6 bg-purple-50/30 border-b border-purple-100/60">
          {todayRecord ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Attendance Confirmed for {todayRecord.date}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-700" />
                        Check-in: <strong>{todayRecord.checkIn}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Sanctum Seat: <strong>#{todayRecord.seatNumber || 3}</strong>
                      </span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-semibold text-[11px]">
                        Geofence & Biometric Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Read-only notification badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Day Closed — Attendance is Read-Only</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 italic bg-white/70 p-2.5 rounded-lg border border-slate-200">
                Note: In accordance with DARULFAHAM academic integrity guidelines, attendance records freeze once marked. For corrections due to medical leave or system verification issues, contact the Branch Administrator.
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Attendance Not Yet Marked for Today</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Please ensure you are within 100m of DARULFAHAM study sanctum before launching verification.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVerificationModal(true)}
                className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verify & Check In</span>
              </button>
            </div>
          )}
        </div>

        {/* Attendance Calendar & History Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Calendar View (5 cols) */}
          <div className="lg:col-span-5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-purple-900" />
                <h3 className="text-sm font-bold text-slate-900">Monthly Calendar</h3>
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-purple-600"
              >
                <option value="2026-08">August 2026</option>
                <option value="2026-09">September 2026</option>
              </select>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="font-bold text-slate-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-xs">
              {calendarDays.map((item) => {
                const isPresent = item.status === 'present' || item.status === 'late';
                const isAbsent = item.status === 'absent';
                return (
                  <div
                    key={item.day}
                    className={`h-9 rounded-lg flex flex-col items-center justify-center relative border transition-all ${
                      isPresent
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold'
                        : isAbsent
                        ? 'bg-rose-50 border-rose-200 text-rose-950 font-bold'
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <span>{item.day}</span>
                    {isPresent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 absolute bottom-1" />
                    )}
                    {isAbsent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 absolute bottom-1" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span>No Session</span>
              </div>
            </div>
          </div>

          {/* History Table (7 cols) */}
          <div className="lg:col-span-7 p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Attendance Logs</h3>
              <span className="text-xs text-slate-500 font-medium">Total: {myRecords.length} recorded</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Check In</th>
                  <th className="py-2.5 px-3">Verification</th>
                  <th className="py-2.5 px-3">Seat</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRecords.slice(0, 7).map((rec) => {
                  const isPresent = rec.status === 'present' || rec.status === 'late';
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800">{rec.date}</td>
                      <td className="py-3 px-3 text-slate-600">{rec.checkIn}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-900 border border-purple-200">
                          <ShieldCheck className="w-3 h-3 text-purple-700" />
                          <span>{rec.verificationMethod || 'LOCATION_FACE'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">#{rec.seatNumber || 3}</td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rec.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. QUICK PORTAL SHORTCUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('/id-cards')}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center mb-3 group-hover:bg-purple-900 group-hover:text-white transition-colors">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Institutional ID Card</h3>
            <p className="text-xs text-slate-600">
              Access your digital QR-verifiable student ID card with valid membership credentials.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-800">
            <span>View Card</span>
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('/tests')}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center mb-3 group-hover:bg-purple-900 group-hover:text-white transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Competitive Test Series</h3>
            <p className="text-xs text-slate-600">
              Attempt mock tests, review answer keys, and track real-time All-India rank percentiles.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-800">
            <span>Start Test</span>
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('/books')}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center mb-3 group-hover:bg-purple-900 group-hover:text-white transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Digital Library</h3>
            <p className="text-xs text-slate-600">
              Read DRM-protected digital notes, constitutional case studies, and faculty summaries.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-800">
            <span>Open Library</span>
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('/results')}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center mb-3 group-hover:bg-purple-900 group-hover:text-white transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Institution Results</h3>
            <p className="text-xs text-slate-600">
              Review published merit lists, exam leaderboards, and institutional awards.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-800">
            <span>View Results</span>
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 5. RESPONSIVE FEATURES SECTION */}
      <FeaturesSection onNavigate={onNavigate} />

      {/* Verification Modal */}
      <AttendanceVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        studentId={student.studentId || 'DF-STU-2026-00001'}
        studentName={student.name}
        studentPhotoUrl={student.photoUrl}
        classLevel={student.classLevel || student.course}
        membershipType={student.membershipType}
        assignedSeat={student.assignedSeat}
        geofenceSettings={geofenceSettings}
        onSuccess={(record) => {
          onAttendanceMarked(record);
          setShowVerificationModal(false);
        }}
      />
    </div>
  );
};
