import React from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../firebase/mockData';
import { isFirebaseCloudEnabled } from '../firebase/config';
import { resetDatabaseToDefaults } from '../services/dataService';
import { ShieldCheck, User, Users, BookOpen, Armchair, ChevronDown, RotateCcw, Cloud, HardDrive, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  activeTab: 'dashboard' | 'studyspace' | 'testengine' | 'students' | 'auditlogs';
  onTabChange: (tab: 'dashboard' | 'studyspace' | 'testengine' | 'students' | 'auditlogs') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChange,
  activeTab,
  onTabChange,
}) => {
  const handleRoleSelect = (role: UserRole) => {
    const user = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    onUserChange(user);
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STAFF':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'STUDENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner with Platform Status */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white tracking-wide">DARULFAHAM OS v2.6</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">Production Architecture & Aadhaar Security Protocol</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {isFirebaseCloudEnabled ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                <Cloud className="h-3 w-3" />
                Firebase Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-blue-300 font-mono text-[11px]" title="Running with local Firestore simulation engine. Set VITE_FIREBASE_API_KEY in .env to connect live cloud project.">
                <HardDrive className="h-3 w-3" />
                Reactive Firestore Engine (Ready)
              </span>
            )}
          </div>

          <button
            onClick={() => {
              if (confirm('Reset seat allocations, students, and attempts to original seed state?')) {
                resetDatabaseToDefaults();
                window.location.reload();
              }
            }}
            className="hover:text-white text-slate-400 transition-colors flex items-center gap-1 text-[10px]"
            title="Reset Mock Database to Defaults"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Reset Data
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm border border-slate-700">
              DF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">DARULFAHAM</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-300 uppercase">
                  Academy & Study Space
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Civil Services Study Space • Exam Engine • Biometric Security
              </p>
            </div>
          </div>

          {/* Role Switcher Selector for Reviewing RBAC */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Simulated RBAC Persona
              </span>
              <span className="text-xs font-bold text-slate-900">
                {currentUser.displayName}
              </span>
            </div>

            <div className="relative">
              <select
                id="role-switcher-select"
                value={currentUser.role}
                onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                className={`text-xs font-bold rounded-xl border px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none ${getRoleBadgeStyle(
                  currentUser.role
                )}`}
              >
                <option value="SUPER_ADMIN">👑 SUPER_ADMIN (Director)</option>
                <option value="ADMIN">🛡️ ADMIN (Branch Admin)</option>
                <option value="STAFF">📋 STAFF (Study Warden)</option>
                <option value="STUDENT">🎓 STUDENT (Aspirant)</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 py-2 overflow-x-auto text-xs font-semibold">
          <button
            id="nav-tab-dashboard"
            onClick={() => onTabChange('dashboard')}
            className={`px-3.5 py-2 rounded-lg transition-colors shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Overview & Stats
          </button>

          <button
            id="nav-tab-studyspace"
            onClick={() => onTabChange('studyspace')}
            className={`px-3.5 py-2 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'studyspace'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Armchair className="h-3.5 w-3.5" />
            Study Space (Seat Map)
          </button>

          <button
            id="nav-tab-testengine"
            onClick={() => onTabChange('testengine')}
            className={`px-3.5 py-2 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'testengine'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Online Test Engine
          </button>

          <button
            id="nav-tab-students"
            onClick={() => onTabChange('students')}
            className={`px-3.5 py-2 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Student Directory (Aadhaar)
          </button>

          {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
            <button
              id="nav-tab-auditlogs"
              onClick={() => onTabChange('auditlogs')}
              className={`px-3.5 py-2 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 ${
                activeTab === 'auditlogs'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Security Audit Logs
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
