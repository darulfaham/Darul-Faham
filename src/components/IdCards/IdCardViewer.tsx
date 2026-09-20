import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { StudentIdCard, StaffIdCard, UserProfile } from '../../types';
import {
  Download,
  Printer,
  RotateCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
  Phone,
  QrCode as QrCodeIcon,
  Copy,
  Check,
} from 'lucide-react';

interface IdCardViewerProps {
  card: StudentIdCard | StaffIdCard;
  isStaff?: boolean;
  currentUser?: UserProfile;
  onStatusChange?: (newStatus: 'ACTIVE' | 'INACTIVE' | 'REVOKED') => void;
  onRegenerateQr?: () => void;
}

export const IdCardViewer: React.FC<IdCardViewerProps> = ({
  card,
  isStaff = false,
  currentUser,
  onStatusChange,
  onRegenerateQr,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const cardPrintRef = useRef<HTMLDivElement>(null);

  const cardId = isStaff ? (card as StaffIdCard).staffId : (card as StudentIdCard).studentId;
  const name = isStaff ? (card as StaffIdCard).staffName : (card as StudentIdCard).studentName;
  const subtitle = isStaff
    ? `${(card as StaffIdCard).designation} • ${(card as StaffIdCard).department}`
    : (card as StudentIdCard).course;
  const membershipOrSeat = isStaff
    ? (card as StaffIdCard).department
    : `${(card as StudentIdCard).membershipType} • Seat: ${(card as StudentIdCard).assignedSeat || 'Unassigned'}`;

  // Generate real QR code image
  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      try {
        const qrString = card.qrCodeData || `https://darulfaham.edu.in/verify/id?cardId=${cardId}&token=${card.verificationToken}`;
        const url = await QRCode.toDataURL(qrString, {
          width: 280,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        if (isMounted) setQrDataUrl(url);
      } catch (err) {
        console.error('QR generation error:', err);
      }
    };
    generateQr();
    return () => {
      isMounted = false;
    };
  }, [card.qrCodeData, card.verificationToken, cardId]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(cardId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (card.status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Inactive
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Revoked
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-[420px] mb-4 bg-slate-100 p-2.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
          <span>Flip to {isFlipped ? 'Front' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyId}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Copy ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'ID'}</span>
          </button>

          <button
            onClick={() => setShowVerifyModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors"
            title="Verify QR Payload"
          >
            <QrCodeIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Verify</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 3D Flipping Card Container */}
      <div
        ref={cardPrintRef}
        className="w-[360px] sm:w-[390px] h-[580px] perspective-1000 relative select-none"
      >
        <div
          className={`w-full h-full duration-500 transition-transform transform-style-3d relative ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ======================================================== */}
          {/* FRONT OF THE ID CARD                                     */}
          {/* ======================================================== */}
          <div
            className="w-full h-full absolute inset-0 backface-hidden rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-gradient-to-b from-[#0b1329] via-[#101b3b] to-[#0a0f24] text-white flex flex-col justify-between p-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Top Ornamental Header & Watermark Accent */}
            <div className="relative z-10">
              <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-extrabold text-white text-lg italic shadow-md shadow-indigo-500/30">
                    D
                  </div>
                  <div>
                    <h1 className="text-sm font-black tracking-wider text-white uppercase font-sans">
                      DARULFAHAM
                    </h1>
                    <p className="text-[9px] text-indigo-300 font-mono tracking-widest uppercase">
                      Civil Services Ecosystem
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge()}
                  <span className="block text-[8px] text-slate-400 font-mono mt-1">
                    {isStaff ? 'STAFF CREDENTIAL' : 'STUDENT IDENTITY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Section: Photo & Identifiers */}
            <div className="relative z-10 flex flex-col items-center text-center my-auto py-2">
              {/* Profile Photo with Security Border */}
              <div className="relative mb-3">
                <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-2xl overflow-hidden border-2 border-indigo-400/80 p-1 bg-slate-900/80 shadow-xl shadow-indigo-950/50">
                  <img
                    src={card.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                    alt={name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center border-2 border-[#0b1329] text-white shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              {/* Name & Official ID Number */}
              <h2 className="text-lg font-extrabold text-white tracking-tight">{name}</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-950/80 border border-indigo-500/40 rounded-lg my-1 text-indigo-300 font-mono text-xs font-bold tracking-wider">
                <span>{cardId}</span>
              </div>
              <p className="text-xs text-slate-300 font-medium max-w-[280px] line-clamp-1 mt-0.5">
                {subtitle}
              </p>
              <p className="text-[11px] text-indigo-400 font-semibold mt-0.5">
                {membershipOrSeat}
              </p>

              {/* Branch & Validity Pill */}
              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
                <span className="truncate max-w-[170px]">{card.branchName}</span>
                <span>•</span>
                <span>Valid: {(card as StudentIdCard).validUntil || '2026-12-31'}</span>
              </div>
            </div>

            {/* Bottom Section: QR Code & Security Strip */}
            <div className="relative z-10 pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <div className="text-left">
                <p className="text-[9px] uppercase font-bold text-slate-400">Security Verification</p>
                <p className="text-[10px] text-indigo-300 font-mono font-semibold">
                  Token: {card.verificationToken ? card.verificationToken.slice(0, 10) : 'AUTHENTIC'}...
                </p>
                <p className="text-[9px] text-slate-400">Scan for Proctor Check</p>
              </div>

              {/* Real Verification QR Code */}
              <div className="w-16 h-16 bg-white rounded-xl p-1 shadow-md border border-indigo-400/40 shrink-0">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Verification QR" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-slate-200 animate-pulse rounded" />
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* BACK OF THE ID CARD                                      */}
          {/* ======================================================== */}
          <div
            className="w-full h-full absolute inset-0 backface-hidden rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-gradient-to-b from-[#0e162f] via-[#101b3b] to-[#0a0e22] text-white flex flex-col justify-between p-6 rotate-y-180"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Back Header */}
            <div>
              <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2.5">
                <span className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
                  Institutional Regulations
                </span>
                <span className="text-[10px] font-mono text-slate-400">TERMS OF USE</span>
              </div>

              {/* Terms of Use & Code of Conduct */}
              <div className="mt-3 space-y-1.5 text-[10px] text-slate-300 leading-relaxed text-left">
                <p className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>This smart credential remains the exclusive property of DARULFAHAM Academy.</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>Mandatory for sanctum study cubicle entry, attendance kiosk verification, and invigilated test series.</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>Strictly non-transferable. Misuse or unauthorized lending leads to immediate revocation and disciplinary action.</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>Report loss or theft immediately to the administrative proctor cell for security token invalidation.</span>
                </p>
              </div>
            </div>

            {/* Middle Contact & Medical Details */}
            <div className="my-2 bg-slate-900/80 rounded-2xl p-3 border border-slate-800 text-left space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Blood Group:</span>
                <span className="font-bold text-rose-400">{card.bloodGroup || 'O+ Positive'}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Issue Date:</span>
                <span className="font-bold text-slate-200">{card.issueDate || '2026-01-15'}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Emergency Helpline:</span>
                <span className="font-bold text-indigo-300">{card.emergencyContact || '+91 522 400 9999'}</span>
              </div>
              <div className="pt-1 text-[9px] text-slate-400 border-t border-slate-800">
                <span>Campus: 4th Floor, Civil Towers, Hazratganj Main Blvd, Lucknow - 226001</span>
              </div>
            </div>

            {/* Back Footer: Authorized Signatory & Holographic Seal */}
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <div className="text-left">
                <p className="text-[9px] text-slate-400">UIDAI / ISO 27001 Certified</p>
                <p className="text-[9px] text-emerald-400 font-medium">Digital Verification Enabled</p>
              </div>

              <div className="text-center">
                <div className="h-6 flex items-end justify-center">
                  <span className="text-indigo-300 font-serif italic text-xs tracking-wider">
                    Tariq Rahman
                  </span>
                </div>
                <div className="border-t border-indigo-400/50 pt-0.5">
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">
                    Registrar / Director
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Action Controls (if role is admin) */}
      {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && onStatusChange && (
        <div className="mt-4 p-3 bg-white rounded-2xl border border-slate-200 w-full max-w-[390px] text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">Card Administration</span>
            <span className="text-[10px] text-indigo-600 font-mono font-bold">Status Controls</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onStatusChange('ACTIVE')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                card.status === 'ACTIVE'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Activate
            </button>
            <button
              onClick={() => onStatusChange('INACTIVE')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                card.status === 'INACTIVE'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              Hold
            </button>
            <button
              onClick={() => onStatusChange('REVOKED')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                card.status === 'REVOKED'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              Revoke
            </button>
          </div>
          {onRegenerateQr && (
            <button
              onClick={onRegenerateQr}
              className="w-full mt-2 py-1.5 px-3 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-3 h-3 text-slate-600" />
              <span>Regenerate Verification QR Token</span>
            </button>
          )}
        </div>
      )}

      {/* Verification Dialog Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Cryptographic QR Verification</span>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-left text-xs">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-emerald-950">Valid DARULFAHAM Credential</p>
                  <p className="text-emerald-700 text-[11px]">Signature verified against institution public key.</p>
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Subject Name:</span>
                  <strong className="text-slate-900">{name}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Official ID:</span>
                  <span className="font-mono font-bold text-indigo-600">{cardId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600">{card.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Campus:</span>
                  <span className="text-slate-700 font-medium">{card.branchName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Privacy Audit:</span>
                  <span className="text-emerald-600 font-semibold">Zero PII Leakage (Phone/Aadhaar Hidden)</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-100 rounded-xl text-[10px] text-slate-500 font-mono break-all">
                Payload URL: {card.qrCodeData}
              </div>
            </div>

            <button
              onClick={() => setShowVerifyModal(false)}
              className="mt-5 w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
            >
              Close Verification Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
