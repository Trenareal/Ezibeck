/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ClassName = 'JSS1' | 'JSS2' | 'JSS3' | 'SS1' | 'SS2' | 'SS3';

export interface SubjectGrade {
  id: string;
  name: string;
  testScore: number; // Max 30
  examScore: number; // Max 70
  firstTermSummary?: number; // Max 20, alternative summary for annual sheets
  secondTermSummary?: number; // Max 20, alternative summary for annual sheets
  thirdTermSummary?: number; // Max 60, alternative summary for annual sheets
  position?: number;
  isPositionManual?: boolean;
}

export interface BehaviourRating {
  name: string;
  rating: number; // 1 to 5
}

export interface Student {
  id: string;
  name: string;
  age: number;
  sex: 'Male' | 'Female';
  className: ClassName;
  termDate: string;
  session: string;
  attendancePresent: number;
  attendanceTotal: number;
  subjects: SubjectGrade[];
  behaviour: BehaviourRating[];
  formTeacherRemark: string;
  formTeacherName: string;
  principalName: string;
  resumptionDate: string;
  password?: string; // Password field for Student Authentication
  passwordUseCount?: number; // Tracks number of successful password verification uses (up to 3)
  passwordRolledOver?: boolean; // Tracks if the passcode has rolled over (to hide/reveal accordingly)
  principalRemark?: string;
}

export interface FacultyProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  password?: string; // Password field for Teacher Authentication
  isRestricted?: boolean; // Restrict access toggle for admin
  email?: string; // Email for OTP resets
  assignedClass?: ClassName; // Class restriction
}

export interface Workspace15Template {
  schoolName: string;            // 1
  motto: string;                 // 2
  address: string;               // 3
  phone: string;                 // 4
  email: string;                 // 5
  resumptionDate: string;        // 6
  termDate: string;              // 7
  session: string;               // 8
  principalName: string;         // 9
  formTeacherJunior: string;     // 10
  formTeacherSenior: string;     // 11
  currentTerm: string;           // 12
  nextTermFee: string;           // 13
  distinctionThreshold: number;  // 14
  passThreshold: number;         // 15
}

export interface SchoolInfo {
  name: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
}

export interface DbStatus {
  configured: boolean;
  connected: boolean;
  checking: boolean;
  error: string | null;
  supabaseUrl?: string;
}

