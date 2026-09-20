import { db } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs } from '../services/dataService';

export const generateStudentId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  
  // Check users collection
  const studentsRef = collection(db, 'users');
  const q = query(studentsRef, orderBy('studentId', 'desc'), limit(1));
  const querySnapshot = await getDocs(q);
  
  // Also check students collection for highest ID
  const studentMasterRef = collection(db, 'students');
  const q2 = query(studentMasterRef, orderBy('studentId', 'desc'), limit(1));
  const q2Snapshot = await getDocs(q2);

  let highestNum = 0;

  if (!querySnapshot.empty && querySnapshot.docs[0].data().studentId) {
    try {
      const lastId = querySnapshot.docs[0].data().studentId;
      const parts = lastId.split('-');
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    } catch (e) {
      // ignore
    }
  }

  if (!q2Snapshot.empty && q2Snapshot.docs[0].data().studentId) {
    try {
      const lastId = q2Snapshot.docs[0].data().studentId;
      const parts = lastId.split('-');
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    } catch (e) {
      // ignore
    }
  }

  const nextNumber = highestNum > 0 ? highestNum + 1 : 1;
  return `DF-${year}-${nextNumber.toString().padStart(5, '0')}`;
};
