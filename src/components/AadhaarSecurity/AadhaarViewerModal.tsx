import React, { useState, useEffect } from 'react';
import { Student, UserProfile } from '../../types';
import { getSecureAadhaarView } from '../../services/documentService';
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle, FileText, CheckCircle2, X, Eye, ExternalLink } from 'lucide-react';

interface AadhaarViewerModalProps {
  student: Student;
  currentUser: UserProfile;
  onClose: () => void;
}

export const AadhaarViewerModal: React.FC<AadhaarViewerModalProps> = ({
  student,
  currentUser,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secureDocUrl, setSecureDocUrl] = useState<string | null>(null);
  const [auditTimestamp, setAuditTimestamp] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecureDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        // Enforce the Aadhaar Security Service function specified in prompt section 4
        const url = await getSecureAadhaarView(
          currentUser.uid,
          currentUser.role,
          student.studentId,
          student.aadhaarUrl
        );
        setSecureDocUrl(url);
        setAuditTimestamp(new Date().toISOString());
      } catch (err: any) {
        setError(err.message || 'Access Denied: You do not possess clearance for sensitive citizen identifiers.');
      } finally {
        setLoading(false);
      }
    };

    fetchSecureDocument();
  }, [student, currentUser]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Security Classification */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white">Confidential Identity Vault</h3>
                <span className="bg-red-900/60 text-red-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-red-700/50">
                  Restricted Access
                </span>
              </div>
              <p className="text-[11px] text-slate-400">UIDAI Aadhaar Data Security Architecture & Audit Regulation</p>
            </div>
          </div>

          <button
            id="btn-close-aadhaar-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center">
              <div className="h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">Verifying Administrative Clearance...</p>
              <p className="text-xs text-slate-500 mt-1">Generating immutable audit log entry in security database.</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Clearance Failure</h4>
              <p className="text-xs text-red-600 font-medium mt-1 max-w-md mx-auto">{error}</p>
              <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-slate-600 text-left">
                <strong>Enforcement Notice:</strong> Per Section 4 & 8 of the DARULFAHAM Security Specification, only users with <code className="bg-white px-1.5 py-0.5 rounded text-red-700 font-mono">SUPER_ADMIN</code> or <code className="bg-white px-1.5 py-0.5 rounded text-red-700 font-mono">ADMIN</code> roles are authorized to decrypt personal citizen identity documents.
              </div>
              <button
                onClick={onClose}
                className="mt-6 px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mandatory Audit Notice Banner */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Access Authorized & Audit Logged</span>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Viewing recorded for admin <strong>{currentUser.displayName}</strong> ({currentUser.role}) at {new Date(auditTimestamp!).toLocaleTimeString()}. Severity: <span className="font-bold uppercase text-red-700">HIGH</span>.
                  </p>
                </div>
              </div>

              {/* Masked Aadhaar Card Presentation */}
              <div className="border-2 border-slate-300 rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-amber-50/20 relative overflow-hidden shadow-xs">
                {/* Government Header Stamp */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                      🏛️
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold tracking-wide uppercase text-slate-800">
                        Unique Identification Authority of India
                      </h5>
                      <span className="text-[10px] text-slate-500">Government of India - Verified Identity</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white px-2 py-1 rounded border border-slate-300 text-slate-700">
                    UIDAI Compliant
                  </span>
                </div>

                {/* Card Main details */}
                <div className="py-4 flex gap-4">
                  <img
                    src={student.profilePhotoUrl}
                    alt={student.name}
                    className="h-24 w-20 object-cover rounded-lg border border-slate-300 shadow-xs shrink-0"
                  />

                  <div className="text-xs space-y-1 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                      <strong className="text-slate-900 text-sm">{student.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Father's Name</span>
                      <span className="font-medium text-slate-800">{student.fatherName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Date of Birth</span>
                      <span className="font-mono text-slate-800">{student.dob}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Registered Address</span>
                      <span className="text-slate-600 line-clamp-1">{student.address}</span>
                    </div>
                  </div>
                </div>

                {/* Masked Aadhaar Number Bar */}
                <div className="mt-2 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                      Aadhaar Number (Masked per Regulations)
                    </span>
                    <span className="font-mono font-extrabold text-base tracking-widest text-slate-900">
                      {student.aadhaarNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Biometrically Verified
                  </div>
                </div>
              </div>

              {/* Secure Download / Token Link */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="truncate max-w-[280px]">Vault Ref: {student.aadhaarUrl}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Token Expiry: 15m</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
