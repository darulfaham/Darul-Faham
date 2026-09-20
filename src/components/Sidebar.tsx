import React from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../firebase/mockData';
import {
  LayoutDashboard,
  Armchair,
  BookOpen,
  Users,
  ShieldCheck,
  ChevronDown,
  X,
  CreditCard,
  BookMarked,
  Trophy,
  Tag,
  ShieldAlert,
  Sparkles,
  CalendarCheck,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'attendance'
  | 'studyspace'
  | 'testengine'
  | 'payments'
  | 'digitalbooks'
  | 'pastresults'
  | 'coupons'
  | 'idcards'
  | 'students'
  | 'privacytest'
  | 'auditlogs';

interface SidebarProps {
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onUserChange,
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
}) => {
  const handleUserSelect = (uid: string) => {
    const selected = INITIAL_USERS.find((u) => u.uid === uid) || INITIAL_USERS[0];
    onUserChange(selected);
  };

  const navItemClass = (tab: NavTab) =>
    activeTab === tab
      ? 'flex items-center gap-3 px-4 py-2.5 bg-purple-600/25 text-purple-200 border-l-2 border-purple-400 rounded-r-xl font-semibold transition-colors'
      : 'flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors';

  const isAuditPermitted = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sleek Interface Sidebar */}
      <aside
        className={`w-64 bg-[#1a0826] flex flex-col h-screen fixed top-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-purple-900/40">
          <div className="flex items-center gap-3 text-white">
            <div className="h-9 w-9 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center font-bold text-xl italic text-white shadow-lg shadow-purple-950/50">
              D
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight block leading-tight text-white">DARULFAHAM</span>
              <span className="text-[10px] text-purple-300 font-mono tracking-wider">STUDY SANCTUM</span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="text-slate-400 hover:text-white p-1 rounded-lg lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-2">
          {/* Section: Academic & Facilities */}
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-purple-300/60 uppercase tracking-wider">
            Academic & Spaces
          </div>

          <button
            id="nav-tab-dashboard"
            onClick={() => {
              onTabChange('dashboard');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full text-left ${navItemClass('dashboard')}`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-purple-300" />
            <span className="text-xs">
              {currentUser.role === 'STUDENT' ? 'Student Dashboard' : 'Dashboard'}
            </span>
          </button>

          <button
            id="nav-tab-attendance"
            onClick={() => {
              onTabChange('attendance');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full text-left ${navItemClass('attendance')}`}
          >
            <CalendarCheck className="w-4 h-4 shrink-0 text-purple-300" />
            <span className="text-xs">
              {currentUser.role === 'STUDENT' ? 'Sanctum Attendance' : 'Attendance Console'}
            </span>
          </button>

          <button
            id="nav-tab-studyspace"
            onClick={() => {
              onTabChange('studyspace');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full text-left ${navItemClass('studyspace')}`}
          >
            <Armchair className="w-4 h-4 shrink-0 text-purple-300" />
            <span className="text-xs">Sanctum Study Space</span>
          </button>

          <button
            id="nav-tab-testengine"
            onClick={() => {
              onTabChange('testengine');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full text-left ${navItemClass('testengine')}`}
          >
            <BookOpen className="w-4 h-4 shrink-0 text-purple-300" />
            <span className="text-xs">Online Test Series</span>
          </button>

          <button
            id="nav-tab-digitalbooks"
            onClick={() => {
              onTabChange('digitalbooks');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full text-left ${navItemClass('digitalbooks')}`}
          >
            <BookMarked className="w-4 h-4 shrink-0 text-purple-300" />
            <span className="text-xs">Digital Library</span>
          </button>

          {/* Section: Results & Finances */}
          <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-purple-300/60 uppercase tracking-wider">
            Achievements & Fees
          </div>

          <button
            id="nav-tab-pastresults"
            onClick={() => {
              onTabChange('pastresults');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full text-left ${navItemClass('pastresults')}`}
          >
            <Trophy className="w-4 h-4 shrink-0 text-amber-300" />
            <span className="text-xs">Past Results & Ranks</span>
          </button>

          <button
            id="nav-tab-payments"
            onClick={() => {
              onTabChange('payments');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full text-left ${navItemClass('payments')}`}
          >
            <CreditCard className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="text-xs">Payments & Receipts</span>
          </button>

          {isAuditPermitted && (
            <button
              id="nav-tab-coupons"
              onClick={() => {
                onTabChange('coupons');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full text-left ${navItemClass('coupons')}`}
            >
              <Tag className="w-4 h-4 shrink-0 text-pink-300" />
              <span className="text-xs">Coupon Codes</span>
            </button>
          )}

          {/* Section: Security & Verification */}
          <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-purple-300/60 uppercase tracking-wider">
            Security & Identity
          </div>

          <button
            id="nav-tab-idcards"
            onClick={() => {
              onTabChange('idcards');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full text-left ${navItemClass('idcards')}`}
          >
            <CreditCard className="w-4 h-4 shrink-0 text-purple-300" />
            <span className="text-xs">
              {currentUser.role === 'STUDENT'
                ? 'My Digital ID Card'
                : currentUser.role === 'STAFF'
                ? 'My Staff ID Card'
                : 'ID Cards & Badges'}
            </span>
          </button>

          {currentUser.role !== 'STUDENT' && (
            <button
              id="nav-tab-students"
              onClick={() => {
                onTabChange('students');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full text-left ${navItemClass('students')}`}
            >
              <Users className="w-4 h-4 shrink-0 text-purple-300" />
              <span className="text-xs">Student Directory</span>
            </button>
          )}

          {isAuditPermitted && (
            <button
              id="nav-tab-privacytest"
              onClick={() => {
                onTabChange('privacytest');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full text-left ${navItemClass('privacytest')}`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="text-xs">Privacy Audit Lab</span>
            </button>
          )}

          {isAuditPermitted && (
            <button
              id="nav-tab-auditlogs"
              onClick={() => {
                onTabChange('auditlogs');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full text-left ${navItemClass('auditlogs')}`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-purple-300" />
              <span className="text-xs">Audit Logs</span>
            </button>
          )}
        </nav>

        {/* Current User Card at bottom of sidebar */}
        <div className="p-4 mt-auto">
          <div className="p-3.5 bg-slate-800/50 rounded-2xl border border-slate-700/80 text-left">
            <p className="text-[11px] text-slate-400 font-semibold">Active Persona</p>
            <p className="text-xs font-bold text-white truncate mt-0.5">{currentUser.displayName}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-800/50">
                {currentUser.role.replace('_', ' ')}
              </span>
              {currentUser.studentId && (
                <span className="text-[10px] text-slate-400 font-mono">{currentUser.studentId}</span>
              )}
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="mt-3 pt-2.5 border-t border-slate-700/60 relative">
              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                Switch Identity
              </label>
              <div className="relative">
                <select
                  id="sidebar-user-select"
                  value={currentUser.uid}
                  onChange={(e) => handleUserSelect(e.target.value)}
                  className="w-full text-[11px] font-medium rounded-xl bg-slate-900 border border-slate-700 text-slate-200 px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
                >
                  <option value="usr-super-admin">👑 Dr. Tariq (Super Admin)</option>
                  <option value="usr-admin-01">🛡️ Rashid Qureshi (Admin)</option>
                  <option value="usr-staff-01">📋 Mohsin Khan (Staff)</option>
                  <option value="usr-student-01">🎓 Zeeshan Alam (Student 1)</option>
                  <option value="usr-student-02">🎓 Fatima Zahra (Student 2)</option>
                </select>
                <ChevronDown className="h-3 w-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
