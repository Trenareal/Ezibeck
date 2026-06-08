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
}

export interface SchoolInfo {
  name: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
}
