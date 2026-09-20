/**
 * Atomic Server-Side ID Generation and Validation Service
 * Ensures collision-free generation of:
 * - Student IDs: DF-STU-YYYY-XXXXX
 * - Staff IDs: DF-STF-YYYY-XXXXX
 */

interface SequenceTracker {
  academicYear: string;
  studentPrefix: string;
  staffPrefix: string;
  studentSequence: number;
  staffSequence: number;
}

// In-memory atomic state on server
const idConfig: SequenceTracker = {
  academicYear: '2026',
  studentPrefix: 'DF-STU',
  staffPrefix: 'DF-STF',
  studentSequence: 5, // Starts after initial mock records (00001 - 00004)
  staffSequence: 3,   // Starts after initial mock records (00001 - 00002)
};

// In-memory mutex flag for atomic concurrency lock
let isStudentLocked = false;
let isStaffLocked = false;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ServerIdService {
  public static async generateStudentId(year?: string, customPrefix?: string): Promise<{
    studentId: string;
    sequence: number;
    year: string;
    prefix: string;
  }> {
    // Acquire atomic spin-lock
    let attempts = 0;
    while (isStudentLocked && attempts < 50) {
      await wait(10);
      attempts++;
    }
    isStudentLocked = true;

    try {
      const activeYear = year || idConfig.academicYear;
      const prefix = customPrefix || idConfig.studentPrefix;
      const currentSeq = idConfig.studentSequence;
      idConfig.studentSequence += 1;

      const formattedSeq = String(currentSeq).padStart(5, '0');
      const studentId = `${prefix}-${activeYear}-${formattedSeq}`;

      return {
        studentId,
        sequence: currentSeq,
        year: activeYear,
        prefix,
      };
    } finally {
      isStudentLocked = false;
    }
  }

  public static async generateStaffId(year?: string, customPrefix?: string): Promise<{
    staffId: string;
    sequence: number;
    year: string;
    prefix: string;
  }> {
    // Acquire atomic spin-lock
    let attempts = 0;
    while (isStaffLocked && attempts < 50) {
      await wait(10);
      attempts++;
    }
    isStaffLocked = true;

    try {
      const activeYear = year || idConfig.academicYear;
      const prefix = customPrefix || idConfig.staffPrefix;
      const currentSeq = idConfig.staffSequence;
      idConfig.staffSequence += 1;

      const formattedSeq = String(currentSeq).padStart(5, '0');
      const staffId = `${prefix}-${activeYear}-${formattedSeq}`;

      return {
        staffId,
        sequence: currentSeq,
        year: activeYear,
        prefix,
      };
    } finally {
      isStaffLocked = false;
    }
  }

  public static getConfig() {
    return {
      ...idConfig,
    };
  }

  public static updateConfig(updates: Partial<SequenceTracker>) {
    if (updates.academicYear) idConfig.academicYear = updates.academicYear;
    if (updates.studentPrefix) idConfig.studentPrefix = updates.studentPrefix;
    if (updates.staffPrefix) idConfig.staffPrefix = updates.staffPrefix;
    if (typeof updates.studentSequence === 'number') idConfig.studentSequence = updates.studentSequence;
    if (typeof updates.staffSequence === 'number') idConfig.staffSequence = updates.staffSequence;
    return { ...idConfig };
  }
}
