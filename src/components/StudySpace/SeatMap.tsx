import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, serverTimestamp } from '../../services/dataService';
import { UserProfile, Student, Seat } from '../../types';
import { Armchair, CheckCircle2, UserCheck, XCircle, AlertCircle, RefreshCw, Sparkles, Filter } from 'lucide-react';

interface SeatMapProps {
  roomId: string;
  roomName?: string;
  currentUser: UserProfile;
  studentsList: Student[];
}

export const SeatMap: React.FC<SeatMapProps> = ({
  roomId,
  roomName = 'Reading Sanctum',
  currentUser,
  studentsList,
}) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [assignStudentId, setAssignStudentId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'occupied'>('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'seats'), where('roomId', '==', roomId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const seatData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSeats(seatData.sort((a, b) => a.seatNumber - b.seatNumber));
    });
    return () => unsubscribe();
  }, [roomId]);

  const canManageSeats = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'STAFF';

  const handleSeatClick = (seat: Seat) => {
    setSelectedSeat(seat);
    setAssignStudentId(seat.assignedTo || (studentsList.length > 0 ? studentsList[0].studentId : ''));
    setActionSuccessMessage(null);
  };

  const handleAssignSeat = async () => {
    if (!selectedSeat) return;
    setIsUpdating(true);

    try {
      const targetStudent = studentsList.find((s) => s.studentId === assignStudentId);
      const studentName = targetStudent ? targetStudent.name : currentUser.displayName;
      const assignedToId = targetStudent ? targetStudent.studentId : currentUser.studentId || currentUser.uid;

      const seatRef = doc(db, 'seats', selectedSeat.id);
      await updateDoc(seatRef, {
        status: 'occupied',
        assignedTo: assignedToId,
        studentName,
        assignedAt: new Date().toISOString(),
      });

      // Audit log
      await addDoc(collection(db, 'audit_logs'), {
        adminId: currentUser.uid,
        adminName: currentUser.displayName,
        action: 'ASSIGN_SEAT',
        targetStudent: assignedToId,
        targetStudentName: studentName,
        timestamp: serverTimestamp(),
        severity: 'medium',
        details: `Assigned Seat #${selectedSeat.seatNumber} in ${roomName} to ${studentName}.`,
      });

      setActionSuccessMessage(`Seat #${selectedSeat.seatNumber} allocated to ${studentName}`);
      setSelectedSeat((prev) => (prev ? { ...prev, status: 'occupied', studentName, assignedTo: assignedToId } : null));
    } catch (err: any) {
      console.error('Seat assignment error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReleaseSeat = async () => {
    if (!selectedSeat) return;
    setIsUpdating(true);

    try {
      const previousStudent = selectedSeat.studentName || 'Student';
      const previousId = selectedSeat.assignedTo;

      const seatRef = doc(db, 'seats', selectedSeat.id);
      await updateDoc(seatRef, {
        status: 'available',
        assignedTo: null,
        studentName: null,
        assignedAt: null,
      });

      // Audit log
      await addDoc(collection(db, 'audit_logs'), {
        adminId: currentUser.uid,
        adminName: currentUser.displayName,
        action: 'RELEASE_SEAT',
        targetStudent: previousId,
        targetStudentName: previousStudent,
        timestamp: serverTimestamp(),
        severity: 'low',
        details: `Released Seat #${selectedSeat.seatNumber} in ${roomName}.`,
      });

      setActionSuccessMessage(`Seat #${selectedSeat.seatNumber} is now marked Available.`);
      setSelectedSeat((prev) => (prev ? { ...prev, status: 'available', studentName: undefined, assignedTo: undefined } : null));
    } catch (err: any) {
      console.error('Seat release error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredSeats = seats.filter((s) => {
    if (filterStatus === 'available') return s.status === 'available';
    if (filterStatus === 'occupied') return s.status === 'occupied';
    return true;
  });

  const totalSeats = seats.length;
  const occupiedSeats = seats.filter((s) => s.status === 'occupied').length;
  const availableSeats = seats.filter((s) => s.status === 'available').length;
  const occupancyPercentage = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header with Stats & Filter */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">Real-time Study Space Map ({roomName})</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Biometric & occupancy mapping for silent study sanctums.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Legend */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 mr-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-500 rounded-full inline-block" />
              Occupied
            </span>
          </div>

          <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs font-medium text-slate-600">
            <button
              id="filter-all-seats"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'}`}
            >
              All ({totalSeats})
            </button>
            <button
              id="filter-available-seats"
              onClick={() => setFilterStatus('available')}
              className={`px-3 py-1.5 rounded-md transition-colors ${filterStatus === 'available' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'hover:text-slate-900'}`}
            >
              Available ({availableSeats})
            </button>
            <button
              id="filter-occupied-seats"
              onClick={() => setFilterStatus('occupied')}
              className={`px-3 py-1.5 rounded-md transition-colors ${filterStatus === 'occupied' ? 'bg-white text-rose-700 shadow-xs font-semibold' : 'hover:text-slate-900'}`}
            >
              Occupied ({occupiedSeats})
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Seat Map (Sleek Interface) */}
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            North Facing Reading Sanctum • Hall A
          </span>
          <div className="text-xs font-semibold text-slate-600">
            Occupancy Rate: <span className="font-mono text-indigo-600">{occupancyPercentage}%</span>
          </div>
        </div>

        {/* 5-Column Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 p-6 bg-slate-50 rounded-xl border border-slate-200">
          {filteredSeats.map((seat) => {
            const isSelected = selectedSeat?.id === seat.id;
            const isUserCurrentSeat = currentUser.studentId && seat.assignedTo === currentUser.studentId;

            return (
              <div
                key={seat.id}
                id={`seat-card-${seat.seatNumber}`}
                onClick={() => handleSeatClick(seat)}
                className={`h-20 w-full flex flex-col items-center justify-center rounded-lg border-2 cursor-pointer transition-all duration-150 relative select-none
                  ${seat.status === 'available' ? 'border-emerald-500 bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80' : 
                    seat.status === 'occupied' ? 'border-rose-500 bg-rose-100 text-rose-800 hover:bg-rose-200/80' : 'border-slate-300 bg-slate-200 text-slate-700'}
                  ${isSelected ? 'ring-3 ring-indigo-500 ring-offset-2 scale-[1.03] shadow-md z-10' : 'hover:scale-[1.02]'}`}
                title={seat.status === 'occupied' ? `Assigned to: ${seat.studentName || 'Student'}` : 'Available for Booking'}
              >
                <div className="flex items-center gap-1">
                  <Armchair className={`h-4 w-4 ${seat.status === 'available' ? 'text-emerald-700' : 'text-rose-700'}`} />
                  <span className="font-bold text-base font-mono">{seat.seatNumber}</span>
                </div>

                <div className="text-[11px] font-semibold truncate max-w-[90%] mt-0.5">
                  {seat.status === 'occupied' ? (
                    <span className="text-rose-700">{seat.studentName?.split(' ')[0] || 'Occupied'}</span>
                  ) : (
                    <span className="text-emerald-700">Free</span>
                  )}
                </div>

                {isUserCurrentSeat && (
                  <span className="absolute -top-2 -right-1 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                    YOU
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Seat Details / Assignment Action Panel */}
      {selectedSeat && (
        <div className="mx-6 mb-6 p-5 rounded-xl border border-indigo-200 bg-indigo-50/40 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${selectedSeat.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                <Armchair className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-base">Seat #{selectedSeat.seatNumber}</h4>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                    selectedSeat.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedSeat.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {selectedSeat.status === 'occupied' ? (
                    <>Allocated to: <strong className="text-slate-900">{selectedSeat.studentName}</strong> (ID: {selectedSeat.assignedTo || 'N/A'})</>
                  ) : (
                    'Ready for student reservation or immediate staff assignment.'
                  )}
                </p>
              </div>
            </div>

            {/* Actions for Admins / Staff / Students */}
            <div className="flex flex-wrap items-center gap-2.5">
              {selectedSeat.status === 'available' && (
                <>
                  {canManageSeats ? (
                    <div className="flex items-center gap-2">
                      <select
                        id="assign-student-select"
                        value={assignStudentId}
                        onChange={(e) => setAssignStudentId(e.target.value)}
                        className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {studentsList.map((s) => (
                          <option key={s.studentId} value={s.studentId}>
                            {s.studentId} - {s.name}
                          </option>
                        ))}
                      </select>
                      <button
                        id="btn-assign-seat"
                        disabled={isUpdating}
                        onClick={handleAssignSeat}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-200 transition-colors disabled:opacity-50"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Assign Student
                      </button>
                    </div>
                  ) : (
                    <button
                      id="btn-reserve-seat-student"
                      disabled={isUpdating}
                      onClick={handleAssignSeat}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-200 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Reserve This Seat
                    </button>
                  )}
                </>
              )}

              {selectedSeat.status === 'occupied' && (canManageSeats || selectedSeat.assignedTo === currentUser.studentId) && (
                <button
                  id="btn-release-seat"
                  disabled={isUpdating}
                  onClick={handleReleaseSeat}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Release Seat
                </button>
              )}

              <button
                id="btn-close-seat-modal"
                onClick={() => setSelectedSeat(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>

          {actionSuccessMessage && (
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-100/80 px-3 py-2 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              {actionSuccessMessage}
            </div>
          )}
        </div>
      )}

      {/* Sleek Interface Footer Bar */}
      <div className="p-5 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-3">
          {canManageSeats && (
            <button
              onClick={() => {
                const firstFree = seats.find((s) => s.status === 'available');
                if (firstFree) handleSeatClick(firstFree);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors"
            >
              Book New Seat
            </button>
          )}
          <button
            onClick={() => {
              setFilterStatus((prev) => (prev === 'all' ? 'available' : prev === 'available' ? 'occupied' : 'all'));
            }}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Switch View
          </button>
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Auto-refreshing live via Firestore
        </span>
      </div>
    </div>
  );
};
