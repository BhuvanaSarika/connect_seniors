import { Timestamp } from 'firebase/firestore';

// ──────────────────────────── User ────────────────────────────
export type UserRole = 'junior' | 'senior' | 'admin';

export interface AppUser {
  uid: string;
  rollNumber: string;
  displayName: string;
  email: string;
  role: UserRole;
  profilePicUrl?: string;
  createdAt: Timestamp;
}

// ────────────────────── Roll Number Range ──────────────────────
export interface RollNumberRange {
  id: string;
  prefix: string;       // e.g. "22A91A44", "24B11DS"
  startNum: number;      // e.g. 1
  endNum: number;        // e.g. 66
  suffix: string;        // e.g. "" or "_U"
  padLength: number;     // e.g. 2 for "01"-"66", 3 for "001"-"240"
  role: 'senior' | 'junior';
  academicYear: string;  // "2024-25"
}

// ──────────────────────── Roadmap ──────────────────────────────
export interface RoadmapNode {
  id: string;
  type: 'milestone' | 'topic' | 'output';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    outputLabel?: string; // For 'output' nodes: "Basic Web Dev", etc.
  };
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdByName: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ──────────────────────── Project Idea ─────────────────────────
export type ProjectCategory = 'beginner' | 'intermediate' | 'advanced' | 'pro';

export interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  aiPrompt?: string;
  referenceUrl?: string;
  githubUrl?: string;
  youtubeUrl?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
}

// ──────────────────────── Mentorship ──────────────────────────
export interface TimeSlot {
  id: string;
  dayOfWeek: number;   // 0=Sun … 6=Sat
  startTime: string;   // "14:00"
  endTime: string;     // "15:00"
  isBooked: boolean;
  bookedBy?: string;
  bookedByName?: string;
}

export interface MentorProfile {
  uid: string;
  displayName: string;
  rollNumber: string;
  isApproved: boolean;
  bio: string;
  expertise: string[];
  availableSlots: TimeSlot[];
}

export interface MentorshipBooking {
  id: string;
  mentorUid: string;
  mentorName: string;
  juniorUid: string;
  juniorName: string;
  juniorEmail: string;
  juniorPhone: string;
  slotId: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}

// ──────────────────────── Resume ──────────────────────────────
export interface ResumeReview {
  seniorUid: string;
  seniorName: string;
  rating: number;       // 1-5
  feedback: string;
  createdAt: Timestamp;
}

export interface ResumeSubmission {
  id: string;
  juniorUid: string;
  juniorName: string;
  juniorRollNumber: string;
  fileUrls: string[];
  fileName: string;
  status: 'pending' | 'reviewed';
  reviews: ResumeReview[];
  createdAt: Timestamp;
}

// ──────────────────── Courses & Certifications ─────────────────
export interface RecommendedCourse {
  id: string;
  title: string;
  youtubeUrl: string;
  description?: string;
  addedBy: string;
  addedByName: string;
  createdAt: Timestamp;
}

export interface Certification {
  id: string;
  title: string;
  provider: string;
  url: string;
  description?: string;
  addedBy: string;
  addedByName: string;
  createdAt: Timestamp;
}

// ──────────────────────── Notification ─────────────────────────
export interface AppNotification {
  id: string;
  type: 'resume_uploaded' | 'booking_request' | 'booking_confirmed' | 'resume_reviewed';
  message: string;
  targetRole?: UserRole;
  targetUid?: string;
  read: boolean;
  createdAt: Timestamp;
}
