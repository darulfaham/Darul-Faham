import React from 'react';
import { UserProfile } from '../types';
import { isFirebaseCloudEnabled } from '../firebase/config';
import { resetDatabaseToDefaults } from '../services/dataService';
import { Bell, Menu, RotateCcw, Cloud, HardDrive, ShieldCheck, Download } from 'lucide-react';

interface HeaderProps {
  title: string;
  currentUser: UserProfile;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  currentUser,
  onOpenMobileMenu,
}) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Live sync badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          {isFirebaseCloudEnabled ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
              <Cloud className="h-3 w-3" />
              Live Cloud
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200 font-sans text-xs">
              <HardDrive className="h-3 w-3" />
              Reactive Engine
            </span>
          )}
        </div>

        {/* Security Status as in Sleek Interface Design */}
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium text-slate-500">Security Status</span>
          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            All Nodes Secure
          </span>
        </div>

        {/* Download Codebase (.ZIP) button */}
        <a
          href="/darulfaham-codebase.zip"
          download="darulfaham-codebase.zip"
          id="btn-download-codebase-zip"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          title="Download Complete Codebase Folder (.ZIP)"
        >
          <Download className="w-4 h-4 text-purple-200" />
          <span className="hidden sm:inline">Download Codebase (.ZIP)</span>
          <span className="sm:hidden">ZIP</span>
        </a>

        {/* Quick Reset action */}
        <button
          onClick={() => {
            if (confirm('Reset seat allocations, students, and test attempts to initial mock state?')) {
              resetDatabaseToDefaults();
              window.location.reload();
            }
          }}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors hidden md:block"
          title="Reset database to defaults"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Circular Indigo Bell Icon Container as in Sleek Interface Design */}
        <div
          className="h-10 w-10 bg-indigo-50 rounded-full border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs hover:bg-indigo-100 transition-colors cursor-pointer"
          title="Notification Center: All services normal"
        >
          <Bell className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
};
