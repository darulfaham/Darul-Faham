import React, { useState } from 'react';
import { Student, UserProfile, Branch } from '../../types';
import { AadhaarViewerModal } from './AadhaarViewerModal';
import { AdminStudentProfileModal } from './AdminStudentProfileModal';
import { StudentRegistrationModal } from '../Registration/StudentRegistrationModal';
import { Users, UserPlus, ShieldCheck, Eye, Search, Filter, ShieldAlert, CheckCircle, Clock, UserCheck } from 'lucide-react';

interface StudentDirectoryProps {
  students: Student[];
  currentUser: UserProfile;
  branches: Branch[];
  onUpdateStudent?: (updated: Student) => void;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({
  students,
  currentUser,
  branches,
  onUpdateStudent,
}) => {
  const [selectedStudentForAadhaar, setSelectedStudentForAadhaar] = useState<Student | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const canViewAadhaar = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const canRegister = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'STAFF';

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.fatherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return matchesSearch;
  });

  const handleOpenAadhaar = (student: Student) => {
    setSelectedStudentForAadhaar(student);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-100">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Student Governance & Identity Directory</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official student registry linked with cryptographically protected Aadhaar document vault.
          </p>
        </div>

        {canRegister && (
          <button
            id="btn-open-register-student"
            onClick={() => setShowRegistrationModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            Enroll New Student
          </button>
        )}
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          {notification}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-students-input"
            type="text"
            placeholder="Search by student name, DF-ID, father's name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Active ({students.filter((s) => s.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Pending ({students.filter((s) => s.status === 'pending').length})
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Parentage</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Aadhaar Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => (
                <tr key={s.studentId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-900">
                    {s.studentId}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForProfile(s)}
                      className="flex items-center gap-2.5 text-left hover:text-purple-900 group"
                    >
                      <img
                        src={s.profilePhotoUrl}
                        alt={s.name}
                        className="h-7 w-7 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 group-hover:text-purple-900 transition-colors block">
                          {s.name}
                        </span>
                        <span className="text-[10px] text-slate-400">DOB: {s.dob}</span>
                      </div>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="block text-slate-900 font-medium">{s.fatherName}</span>
                    <span className="text-[10px] text-slate-400">Mother: {s.motherName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span>{s.phone}</span>
                    <span className="block text-[10px] text-slate-400">{s.email}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded text-[11px] font-medium inline-block">
                      {s.aadhaarNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize inline-flex items-center gap-1 ${
                      s.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {s.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForProfile(s)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      title="View & Edit Student Dossier"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>

                    <button
                      id={`btn-view-aadhaar-${s.studentId}`}
                      onClick={() => handleOpenAadhaar(s)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        canViewAadhaar
                          ? 'bg-purple-900 hover:bg-purple-950 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      title={canViewAadhaar ? 'View encrypted document with audit trail' : 'Clearance restricted to Admins'}
                    >
                      {canViewAadhaar ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Aadhaar</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                          <span>Restricted</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Student Profile Modal */}
      {selectedStudentForProfile && (
        <AdminStudentProfileModal
          isOpen={Boolean(selectedStudentForProfile)}
          onClose={() => setSelectedStudentForProfile(null)}
          student={selectedStudentForProfile}
          currentUser={currentUser}
          onUpdateStudent={(updated) => {
            if (onUpdateStudent) onUpdateStudent(updated);
            setSelectedStudentForProfile(null);
            setNotification(`Record for ${updated.name} updated successfully.`);
            setTimeout(() => setNotification(null), 3500);
          }}
          onOpenAadhaarVault={(stu) => {
            setSelectedStudentForProfile(null);
            setSelectedStudentForAadhaar(stu);
          }}
        />
      )}

      {/* Aadhaar Viewer Modal */}
      {selectedStudentForAadhaar && (
        <AadhaarViewerModal
          student={selectedStudentForAadhaar}
          currentUser={currentUser}
          onClose={() => setSelectedStudentForAadhaar(null)}
        />
      )}

      {/* Registration Modal */}
      {showRegistrationModal && (
        <StudentRegistrationModal
          currentUser={currentUser}
          branches={branches}
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={() => {
            setNotification('Student enrolled successfully and assigned next sequential ID.');
            setTimeout(() => setNotification(null), 4000);
          }}
        />
      )}
    </div>
  );
};
