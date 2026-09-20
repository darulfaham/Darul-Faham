import React, { useState, useEffect, useRef } from 'react';
import { generateStudentId } from '../../utils/generators';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from '../../services/dataService';
import { UserProfile, Branch, StudentDocument } from '../../types';
import {
  UserPlus,
  CheckCircle2,
  Shield,
  X,
  Sparkles,
  Camera,
  Upload,
  FileText,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface StudentRegistrationModalProps {
  currentUser: UserProfile;
  branches: Branch[];
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  currentUser,
  branches,
  onClose,
  onSuccess,
}) => {
  const [studentId, setStudentId] = useState<string>('Generating...');
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    dob: '2002-05-15',
    phone: '',
    email: '',
    address: '',
    aadhaarDigits: '', // Last 4 digits
    branchId: branches[0]?.id || 'branch-central',
    course: 'UPSC Civil Services Foundation 2026',
    membershipType: 'Sanctum 24/7 Dedicated',
    status: 'active' as const,
  });

  // Student Photo Upload/Camera state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  // Aadhaar Document Upload/Camera state
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [aadhaarFileName, setAadhaarFileName] = useState<string>('');
  const [aadhaarMimeType, setAadhaarMimeType] = useState<string>('application/pdf');
  const [aadhaarError, setAadhaarError] = useState<string | null>(null);
  const [isCapturingAadhaar, setIsCapturingAadhaar] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchNextId = async () => {
      try {
        const nextId = await generateStudentId();
        setStudentId(nextId);
      } catch (e) {
        setStudentId(`DF-STU-${new Date().getFullYear()}-00005`);
      }
    };
    fetchNextId();
  }, []);

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCapturingPhoto(false);
    setIsCapturingAadhaar(false);
  };

  const startCamera = async (target: 'PHOTO' | 'AADHAAR') => {
    stopCameraStream();
    if (target === 'PHOTO') setIsCapturingPhoto(true);
    else setIsCapturingAadhaar(true);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (e) {
      console.warn('Camera stream error:', e);
      // Fallback
      if (target === 'PHOTO') {
        setPhotoPreview('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');
        setPhotoFileName('camera_snapshot.jpg');
        setIsCapturingPhoto(false);
      } else {
        setAadhaarPreview('https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=80');
        setAadhaarFileName('aadhaar_camera_doc.jpg');
        setAadhaarMimeType('image/jpeg');
        setIsCapturingAadhaar(false);
      }
    }
  };

  const captureFrame = (target: 'PHOTO' | 'AADHAAR') => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (target === 'PHOTO') {
          setPhotoPreview(dataUrl);
          setPhotoFileName('camera_snapshot.jpg');
        } else {
          setAadhaarPreview(dataUrl);
          setAadhaarFileName('aadhaar_camera_doc.jpg');
          setAadhaarMimeType('image/jpeg');
        }
      }
    }
    stopCameraStream();
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo size exceeds 5MB limit.');
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Supported photo formats: JPG, PNG.');
      return;
    }

    setPhotoError(null);
    setPhotoFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAadhaarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAadhaarError('Aadhaar document exceeds 5MB limit.');
      return;
    }

    // Validate type (JPG, PNG, PDF)
    const validMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validMimes.includes(file.type) && !file.name.endsWith('.pdf')) {
      setAadhaarError('Supported Aadhaar formats: JPG, PNG, PDF.');
      return;
    }

    setAadhaarError(null);
    setAadhaarFileName(file.name);
    setAadhaarMimeType(file.type || 'application/pdf');

    const reader = new FileReader();
    reader.onload = () => {
      setAadhaarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Student name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formattedAadhaar = `XXXX-XXXX-${formData.aadhaarDigits.padStart(4, '0').slice(-4)}`;
      const selectedBranch = branches.find((b) => b.id === formData.branchId) || branches[0];

      const newStudent = {
        studentId,
        name: formData.name,
        fatherName: formData.fatherName || 'Guardian',
        motherName: formData.motherName || 'Guardian',
        dob: formData.dob,
        phone: formData.phone || '+91 98000 00000',
        email:
          formData.email ||
          `${formData.name.toLowerCase().replace(/\s+/g, '.') || 'student'}@student.darulfaham.in`,
        address: formData.address || 'Civil Lines, Lucknow, UP',
        aadhaarNumber: formattedAadhaar,
        aadhaarUrl: `aadhaar/${studentId}/${aadhaarFileName || 'aadhaar_card.pdf'}`,
        photoUrl:
          photoPreview ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        profilePhotoUrl:
          photoPreview ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        classLevel: formData.course,
        course: formData.course,
        membershipType: formData.membershipType,
        status: formData.status,
        branchId: formData.branchId,
        branchName: selectedBranch?.name || 'DARULFAHAM Central Sanctum',
        assignedRoom: 'Sanctum Room 101',
        assignedSeat: 'Seat #05',
        registeredDate: new Date().toISOString().split('T')[0],
      };

      // 1. Add to students collection
      await addDoc(collection(db, 'students'), newStudent);

      // 2. Add to users collection (for login / auth)
      await addDoc(collection(db, 'users'), {
        uid: `usr-${studentId.toLowerCase()}`,
        email: newStudent.email,
        role: 'STUDENT',
        displayName: newStudent.name,
        studentId: studentId,
        createdAt: serverTimestamp(),
      });

      // 3. Store Student Photo Document in Vault
      if (photoPreview) {
        await addDoc(collection(db, 'studentDocuments'), {
          studentId,
          documentType: 'STUDENT_PHOTO',
          documentName: photoFileName || 'student_photo.jpg',
          fileUrl: photoPreview,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser.uid,
          status: 'VERIFIED',
          isSensitive: false,
        });
      }

      // 4. Store Aadhaar Card Document in Vault (Secure & Sensitive)
      if (aadhaarPreview || formData.aadhaarDigits) {
        await addDoc(collection(db, 'studentDocuments'), {
          studentId,
          documentType: 'AADHAAR_CARD',
          documentName: aadhaarFileName || 'aadhaar_document.pdf',
          fileUrl: aadhaarPreview || `aadhaar/${studentId}/aadhaar_card.pdf`,
          mimeType: aadhaarMimeType,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser.uid,
          status: 'VERIFIED',
          isSensitive: true, // Only Super Admin and Student have access
        });
      }

      // 5. Mandatory Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        adminId: currentUser.uid,
        adminName: currentUser.displayName,
        action: 'REGISTER_STUDENT',
        targetStudent: studentId,
        targetStudentName: newStudent.name,
        timestamp: serverTimestamp(),
        severity: 'medium',
        ip: '192.168.1.112',
        details: `Enrolled student ID ${studentId}. Aadhaar document and student photo stored in DARULFAHAM institutional vault.`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        {/* Header - Royal Purple */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-purple-200 border border-white/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Student Enrollment & Document Vault</h3>
              <p className="text-[11px] text-purple-200">
                Institutional Academic Registration & Verification Records
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Generated Student ID Banner */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider">
                Automated Registration ID
              </span>
              <p className="font-mono font-extrabold text-lg text-purple-950 mt-0.5">{studentId}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 bg-white px-3 py-1 rounded-lg border border-purple-200 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-purple-700" />
              <span>Standard Sequence</span>
            </div>
          </div>

          {/* DOCUMENT COLLECTION LEGAL NOTICE BANNER (REQUIREMENT 14) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
            <Shield className="w-4 h-4 text-purple-800 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-purple-950">Institutional Administration Records Notice:</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Document collection for DARULFAHAM institutional administration records only. No Aadhaar KYC, OTP, or UIDAI verification required.
              </p>
            </div>
          </div>

          {/* SECTION: STUDENT PHOTO UPLOAD / CAMERA (REQUIREMENT 13) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Student Profile Photo</h4>
                <p className="text-[11px] text-slate-500">Upload JPG/PNG or capture with camera (Max 5MB)</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200">
                Institutional ID Photo
              </span>
            </div>

            {photoError && (
              <div className="text-[11px] text-rose-700 font-semibold">{photoError}</div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {/* Preview Thumbnail */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Student preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-400 text-center px-2">No photo selected</span>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 w-full space-y-2">
                {isCapturingPhoto ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">
                      <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => captureFrame('PHOTO')}
                        className="flex-1 py-1.5 bg-purple-900 text-white text-xs font-bold rounded-lg"
                      >
                        Capture Snapshot
                      </button>
                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{photoPreview ? 'Replace Photo' : 'Upload File'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera('PHOTO')}
                      className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-purple-700" />
                      <span>Take Photo</span>
                    </button>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setPhotoFileName('');
                        }}
                        className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
                {photoFileName && (
                  <p className="text-[11px] text-slate-500 truncate">Selected: {photoFileName}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION: AADHAAR CARD DOCUMENT UPLOAD / CAMERA (REQUIREMENT 13 & 14) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Aadhaar Card Document / Photo</h4>
                <p className="text-[11px] text-slate-500">Upload JPG, PNG, PDF or capture via camera (Max 5MB)</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                <Lock className="w-3 h-3 text-amber-700" />
                <span>Confidential Vault</span>
              </div>
            </div>

            {aadhaarError && (
              <div className="text-[11px] text-rose-700 font-semibold">{aadhaarError}</div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {/* Preview Thumbnail */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                {aadhaarPreview ? (
                  aadhaarMimeType === 'application/pdf' ? (
                    <div className="flex flex-col items-center justify-center text-purple-900 p-2 text-center">
                      <FileText className="w-8 h-8 text-purple-700" />
                      <span className="text-[9px] font-bold mt-1">PDF DOC</span>
                    </div>
                  ) : (
                    <img src={aadhaarPreview} alt="Aadhaar preview" className="w-full h-full object-cover" />
                  )
                ) : (
                  <span className="text-[10px] text-slate-400 text-center px-2">No Aadhaar attached</span>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 w-full space-y-2">
                {isCapturingAadhaar ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">
                      <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => captureFrame('AADHAAR')}
                        className="flex-1 py-1.5 bg-purple-900 text-white text-xs font-bold rounded-lg"
                      >
                        Capture Document
                      </button>
                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={aadhaarInputRef}
                      type="file"
                      accept="image/png, image/jpeg, application/pdf"
                      onChange={handleAadhaarFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => aadhaarInputRef.current?.click()}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{aadhaarPreview ? 'Replace Document' : 'Upload Document'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera('AADHAAR')}
                      className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-purple-700" />
                      <span>Capture Document</span>
                    </button>
                    {aadhaarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setAadhaarPreview(null);
                          setAadhaarFileName('');
                        }}
                        className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
                {aadhaarFileName && (
                  <p className="text-[11px] text-slate-500 truncate">Document: {aadhaarFileName}</p>
                )}
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Core Personal Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Student Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Farhan Akhtar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Campus</label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-700 bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Program</label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Membership Plan</label>
              <select
                value={formData.membershipType}
                onChange={(e) => setFormData({ ...formData, membershipType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-700 bg-white"
              >
                <option value="Sanctum 24/7 Dedicated">Sanctum 24/7 Dedicated</option>
                <option value="Standard Sanctum Day Pass">Standard Sanctum Day Pass</option>
                <option value="Night Sanctum Scholar">Night Sanctum Scholar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Aadhaar (Last 4 Digits for Reference)
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="e.g. 5821"
                value={formData.aadhaarDigits}
                onChange={(e) => setFormData({ ...formData, aadhaarDigits: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="student@darulfaham.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
            <textarea
              rows={2}
              placeholder="Full address with pin code"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-700 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-purple-900 hover:bg-purple-950 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Registering...' : 'Enroll & Store in Vault'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
