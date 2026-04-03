import { RollNumberRange } from '@/types';

/**
 * Validates a roll number against a list of allowed ranges.
 * Returns the matching role if valid, or null if invalid.
 */
export function validateRollNumber(
  rollNumber: string,
  ranges: Omit<RollNumberRange, 'id'>[] | RollNumberRange[]
): { valid: boolean; role: 'senior' | 'junior' } | null {
  const upperRoll = rollNumber.toUpperCase().trim();

  for (const range of ranges) {
    const prefix = range.prefix.toUpperCase();
    const suffix = range.suffix.toUpperCase();

    // Check if roll number starts with the prefix and ends with the suffix
    if (!upperRoll.startsWith(prefix)) continue;
    if (suffix && !upperRoll.endsWith(suffix)) continue;

    // Extract the numeric part
    let numericStr: string;
    if (suffix) {
      numericStr = upperRoll.slice(prefix.length, upperRoll.length - suffix.length);
    } else {
      numericStr = upperRoll.slice(prefix.length);
    }

    // Check numeric part is valid
    const num = parseInt(numericStr, 10);
    if (isNaN(num)) continue;

    // Check the numeric part has the right pad length
    if (numericStr.length !== range.padLength) continue;

    // Check if the number is in range
    if (num >= range.startNum && num <= range.endNum) {
      return { valid: true, role: range.role };
    }
  }

  return null;
}

/**
 * Default roll number ranges as specified in requirements.
 * These are seeded into Firestore and can be edited by admin.
 */
export const DEFAULT_ROLL_NUMBER_RANGES: Omit<RollNumberRange, 'id'>[] = [
  // Seniors
  { prefix: '22A91A44', startNum: 1,  endNum: 66, suffix: '', padLength: 2, role: 'senior', academicYear: '2024-25' },
  { prefix: '23A95A44', startNum: 1,  endNum: 6,  suffix: '', padLength: 2, role: 'senior', academicYear: '2024-25' },
  // Juniors
  { prefix: '23A91A44', startNum: 1,  endNum: 66, suffix: '', padLength: 2, role: 'junior', academicYear: '2024-25' },
  { prefix: '24A95A44', startNum: 1,  endNum: 6,  suffix: '', padLength: 2, role: 'junior', academicYear: '2024-25' },
  { prefix: '24B11DS',  startNum: 1,  endNum: 240, suffix: '_U', padLength: 3, role: 'junior', academicYear: '2024-25' },
  { prefix: '25B11DS',  startNum: 1,  endNum: 629, suffix: '_U', padLength: 3, role: 'junior', academicYear: '2024-25' },
];
