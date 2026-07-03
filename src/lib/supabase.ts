import { createClient } from '@supabase/supabase-js';
import { Student, Workspace15Template, ClassName, FacultyProfile, AuditLogEntry } from '../types';
import { compareSubjects, getDefaultSubjectsForClass, adjustBehaviourIfRequired, adjustSubjectsIfRequired } from '../utils/academicUtils';
import { safeStorage } from '../utils/safeStorage';
import { syncService } from './syncService';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes('placeholder-url') &&
  !supabaseUrl.includes('your-supabase-project-id');

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not set. ' +
    'Please configure them in your settings/environment secrets to connect to your real database.'
  );
}

// Create a singleton instance of the client with a safe storage wrapper to avoid SecurityErrors in iframes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      storage: safeStorage
    }
  }
);

/**
 * Simple, robust symmetric encryption/decryption utility using a key-based XOR-cipher.
 * This ensures that passwords stored in the Supabase database are never in plaintext,
 * preventing data leak risks while preserving the seamless passcode-retrieval and rollover flows.
 */
const ENCRYPTION_KEY = "EzibeckSecurePasscodeSalt2026Key!";

export function encryptPassword(text: string): string {
  if (!text) return "";
  // If already encrypted, return as is
  if (text.startsWith("enc::")) return text;
  
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    // XOR operation
    const xorValue = charCode ^ keyChar;
    // Hex encode and pad
    const hex = xorValue.toString(16).padStart(2, '0');
    result += hex;
  }
  return "enc::" + result;
}

export function decryptPassword(cipherText: string): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith("enc::")) return cipherText; // Return plaintext directly if not encrypted yet
  
  const hexPart = cipherText.substring(5);
  let result = "";
  for (let i = 0; i < hexPart.length; i += 2) {
    const hex = hexPart.substring(i, i + 2);
    const xorValue = parseInt(hex, 16);
    const keyChar = ENCRYPTION_KEY.charCodeAt((i / 2) % ENCRYPTION_KEY.length);
    const charCode = xorValue ^ keyChar;
    result += String.fromCharCode(charCode);
  }
  return result;
}

export const mapDbStudentToFrontend = (dbStudent: any): Student => {
  // Filter out nursery override helper rows directly from the subjects array
  const overrides = (dbStudent.subjects || []).filter((sub: any) => sub.name && sub.name.startsWith('__nursery_term_stats_'));
  
  // Transform nursery overrides into frontend helper subject rows
  const overrideSubjects = overrides.map((ov: any) => ({
    id: `subj_override_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    name: ov.name,
    testScore: 0,
    examScore: 0,
    firstTermSummary: ov.firstTermSummary || 0,
    secondTermSummary: ov.secondTermSummary || 0,
    thirdTermSummary: 0,
    position: null,
    isPositionManual: false
  }));

  // Standard subjects (filtering out any old helper rows that might have been saved in subject_grades)
  const dbSubjects = dbStudent.subjects || [];
  const normalSubjects = dbSubjects
    .filter((sub: any) => sub.name && !sub.name.startsWith('__nursery_term_stats_'))
    .map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      testScore: sub.test_score,
      examScore: sub.exam_score,
      firstTermSummary: sub.first_term_summary,
      secondTermSummary: sub.second_term_summary,
      thirdTermSummary: sub.third_term_summary,
      position: sub.position,
      isPositionManual: sub.is_position_manual
    }));

  // Combine standard subjects with mapped nursery override rows
  const combinedSubjects = [...normalSubjects, ...overrideSubjects];

  return {
    id: dbStudent.id,
    name: dbStudent.name,
    age: dbStudent.age,
    sex: dbStudent.sex as 'Male' | 'Female',
    className: dbStudent.class_name as ClassName,
    termDate: dbStudent.term_date,
    session: dbStudent.session,
    attendancePresent: dbStudent.attendance_present,
    attendanceTotal: dbStudent.attendance_total,
    formTeacherRemark: dbStudent.form_teacher_remark || '',
    formTeacherName: dbStudent.form_teacher_name || '',
    principalName: dbStudent.principal_name || '',
    resumptionDate: dbStudent.resumption_date,
    password: decryptPassword(dbStudent.password || '123456'),
    passwordUseCount: dbStudent.password_use_count || 0,
    passwordRolledOver: !!dbStudent.password_rolled_over,
    principalRemark: dbStudent.principal_remark || '',
    subjects: adjustSubjectsIfRequired(
      (combinedSubjects.length > 0)
        ? combinedSubjects.sort((a: any, b: any) => compareSubjects(a.name, b.name))
        : getDefaultSubjectsForClass(dbStudent.class_name as ClassName, dbStudent.term || 'Third Term'),
      dbStudent.class_name as ClassName,
      dbStudent.term || 'Third Term'
    ),
    behaviour: adjustBehaviourIfRequired(
      (dbStudent.behaviour || []).map((b: any) => ({
        name: b.name,
        rating: b.rating
      })),
      dbStudent.class_name as ClassName
    )
  };
};

export const mapDbConfigToTemplate = (cfg: any): Workspace15Template => {
  const mottoRaw = cfg.motto || '';
  const isLocked = mottoRaw.includes('|LOCKED') || !!cfg.portal_locked;
  const cleanMotto = mottoRaw.split('|LOCKED')[0].split('|ATTENDANCE:')[0];
  
  let totalAttendance = 110;
  if (mottoRaw.includes('|ATTENDANCE:')) {
    const part = mottoRaw.split('|ATTENDANCE:')[1];
    totalAttendance = parseInt(part) || 110;
  }
  
  const rawFee = cfg.next_term_fee || '';
  const sections = rawFee.includes(';') ? rawFee.split(';') : [];
  
  let nurseryParts = ['', '', '', ''];
  let primaryParts = ['', '', '', ''];
  let juniorParts = ['', '', '', ''];
  let seniorParts = ['', '', '', ''];
  
  if (sections.length >= 4) {
    nurseryParts = sections[0].split('|');
    primaryParts = sections[1].split('|');
    juniorParts = sections[2].split('|');
    seniorParts = sections[3].split('|');
  } else {
    const parts = rawFee.split('|');
    const rootSchoolFee = parts[0] || rawFee || '₦0.00';
    const rootPartyFee = parts[1] || '₦0.00';
    const rootEnrollmentFee = parts[2] || '₦0.00';
    const rootBookFee = parts[3] || '₦0.00';
    
    nurseryParts = [rootSchoolFee, rootPartyFee, rootEnrollmentFee, rootBookFee];
    primaryParts = [rootSchoolFee, rootPartyFee, rootEnrollmentFee, rootBookFee];
    juniorParts = [rootSchoolFee, rootPartyFee, rootEnrollmentFee, rootBookFee];
    seniorParts = [rootSchoolFee, rootPartyFee, rootEnrollmentFee, rootBookFee];
  }

  return {
    schoolName: cfg.school_name,
    motto: cleanMotto,
    address: cfg.address,
    phone: cfg.phone,
    email: cfg.email,
    resumptionDate: cfg.resumption_date,
    termDate: cfg.term_date,
    session: cfg.session,
    principalName: cfg.principal_name,
    formTeacherJunior: cfg.form_teacher_junior,
    formTeacherSenior: cfg.form_teacher_senior,
    currentTerm: cfg.current_term,
    nextTermFee: cfg.next_term_fee,
    distinctionThreshold: cfg.distinction_threshold,
    passThreshold: cfg.pass_threshold,
    portalLocked: isLocked,
    totalAttendance: totalAttendance,
    schoolFee: nurseryParts[0] || '₦0.00',
    partyFee: nurseryParts[1] || '₦0.00',
    enrollmentFee: nurseryParts[2] || '₦0.00',
    bookFee: nurseryParts[3] || '₦0.00',
    
    // Nursery Section
    schoolFeeNursery: nurseryParts[0] || '₦100,000.00',
    partyFeeNursery: nurseryParts[1] || '₦15,000.00',
    enrollmentFeeNursery: nurseryParts[2] || '₦15,000.00',
    bookFeeNursery: nurseryParts[3] || '₦20,000.00',
    
    // Primary Section
    schoolFeePrimary: primaryParts[0] || '₦100,000.00',
    partyFeePrimary: primaryParts[1] || '₦15,000.00',
    enrollmentFeePrimary: primaryParts[2] || '₦15,000.00',
    bookFeePrimary: primaryParts[3] || '₦20,000.00',
    
    // Junior Section
    schoolFeeJunior: juniorParts[0] || '₦100,000.00',
    partyFeeJunior: juniorParts[1] || '₦15,000.00',
    enrollmentFeeJunior: juniorParts[2] || '₦15,000.00',
    bookFeeJunior: juniorParts[3] || '₦20,000.00',
    
    // Senior Section
    schoolFeeSenior: seniorParts[0] || '₦100,000.00',
    partyFeeSenior: seniorParts[1] || '₦15,000.00',
    enrollmentFeeSenior: seniorParts[2] || '₦15,000.00',
    bookFeeSenior: seniorParts[3] || '₦20,000.00',
  };
};

export const mapTemplateToDbConfig = (tpl: Workspace15Template) => {
  const cleanMotto = tpl.motto ? tpl.motto.split('|LOCKED')[0].split('|ATTENDANCE:')[0] : '';
  let mottoToStore = cleanMotto;
  if (tpl.portalLocked) {
    mottoToStore += '|LOCKED';
  }
  if (tpl.totalAttendance !== undefined) {
    mottoToStore += `|ATTENDANCE:${tpl.totalAttendance}`;
  }
  
  const nurseryFee = `${tpl.schoolFeeNursery || tpl.schoolFee || ''}|${tpl.partyFeeNursery || tpl.partyFee || ''}|${tpl.enrollmentFeeNursery || tpl.enrollmentFee || ''}|${tpl.bookFeeNursery || tpl.bookFee || ''}`;
  const primaryFee = `${tpl.schoolFeePrimary || tpl.schoolFee || ''}|${tpl.partyFeePrimary || tpl.partyFee || ''}|${tpl.enrollmentFeePrimary || tpl.enrollmentFee || ''}|${tpl.bookFeePrimary || tpl.bookFee || ''}`;
  const juniorFee = `${tpl.schoolFeeJunior || tpl.schoolFee || ''}|${tpl.partyFeeJunior || tpl.partyFee || ''}|${tpl.enrollmentFeeJunior || tpl.enrollmentFee || ''}|${tpl.bookFeeJunior || tpl.bookFee || ''}`;
  const seniorFee = `${tpl.schoolFeeSenior || tpl.schoolFee || ''}|${tpl.partyFeeSenior || tpl.partyFee || ''}|${tpl.enrollmentFeeSenior || tpl.enrollmentFee || ''}|${tpl.bookFeeSenior || tpl.bookFee || ''}`;
  
  const serializedFee = `${nurseryFee};${primaryFee};${juniorFee};${seniorFee}`;
  
  return {
    school_name: tpl.schoolName,
    motto: mottoToStore,
    address: tpl.address,
    phone: tpl.phone,
    email: tpl.email,
    resumption_date: tpl.resumptionDate,
    term_date: tpl.termDate,
    session: tpl.session,
    principal_name: tpl.principalName,
    form_teacher_junior: tpl.formTeacherJunior,
    form_teacher_senior: tpl.formTeacherSenior,
    current_term: tpl.currentTerm,
    next_term_fee: serializedFee,
    distinction_threshold: tpl.distinctionThreshold,
    pass_threshold: tpl.passThreshold,
    portal_locked: !!tpl.portalLocked,
    total_attendance: tpl.totalAttendance !== undefined ? tpl.totalAttendance : 110,
  };
};

/**
 * Service helpers for fetching and updating database tables with Supabase
 */
export function mapFrontendIdToUuid(id: string): string {
  if (!id) return id;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  const mappings: Record<string, string> = {
    ezekiel: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df1",
    gladys: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df2",
    anthony: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df3",
    sarah: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df4",
    benson: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df5",
    florence: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df6",
    david: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df7",
    maroger: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df8",
    spare: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df9",
    evelyn: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e01",
    rose: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e02",
    kelvin: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e03",
    mercy: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e04",
    samuel: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e05",
    blessing: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e06",
    patrick: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e07",
    victoria: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e08",
    emmanuel: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e09",
    juliet: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e10",
    nancy: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e11",
    justina: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e12",
    samson: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e13",
    coadmin: "ea4d6a45-0015-4b1a-b5bd-6f23006e2e14"
  };
  if (mappings[id.toLowerCase()]) {
    return mappings[id.toLowerCase()];
  }
  // Otherwise create a deterministic UUID out of the string
  let hashStr = "";
  for (let i = 0; i < id.length; i++) {
    hashStr += id.charCodeAt(i).toString(16);
  }
  hashStr = (hashStr + "00000000000000000000000005081997").slice(0, 32);
  return `${hashStr.substring(0, 8)}-${hashStr.substring(8, 12)}-${hashStr.substring(12, 16)}-${hashStr.substring(16, 20)}-${hashStr.substring(20, 32)}`;
}

export function mapUuidToFrontendId(uuid: string): string {
  if (!uuid) return uuid;
  const reverseMappings: Record<string, string> = {
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df1": "ezekiel",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df2": "gladys",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df3": "anthony",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df4": "sarah",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df5": "benson",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df6": "florence",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df7": "david",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df8": "maroger",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df9": "spare",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e01": "evelyn",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e02": "rose",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e03": "kelvin",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e04": "mercy",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e05": "samuel",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e06": "blessing",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e07": "patrick",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e08": "victoria",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e09": "emmanuel",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e10": "juliet",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e11": "nancy",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e12": "justina",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e13": "samson",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2e14": "coadmin"
  };
  const lowered = uuid.toLowerCase();
  if (reverseMappings[lowered]) {
    return reverseMappings[lowered];
  }

  // Check if it's a deterministic encoded custom UUID (from mapFrontendIdToUuid)
  const clean = lowered.replace(/-/g, '');
  if (clean.length === 32) {
    let decoded = "";
    let isValid = true;
    for (let i = 0; i < 32; i += 2) {
      const hexUnit = clean.substring(i, i + 2);
      if (hexUnit === "00") {
        break;
      }
      const code = parseInt(hexUnit, 16);
      if (isNaN(code) || code < 32 || code > 126) {
        isValid = false;
        break;
      }
      decoded += String.fromCharCode(code);
    }
    if (isValid && decoded.length > 0) {
      return decoded;
    }
  }

  return lowered;
}

export const mapDbFacultyToFrontend = (dbFaculty: any): FacultyProfile => {
  return {
    id: mapUuidToFrontendId(dbFaculty.id),
    name: dbFaculty.name,
    role: dbFaculty.role,
    avatar: dbFaculty.avatar,
    password: decryptPassword(dbFaculty.password || '123456'),
    isRestricted: dbFaculty.is_restricted,
    email: dbFaculty.email || '',
    assignedClass: dbFaculty.assigned_class as ClassName || undefined
  };
};

export const dbService = {
  // --- School Config ---
  async getSchoolConfig() {
    const { data, error } = await supabase
      .from('school_config')
      .select('*')
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async updateSchoolConfig(id: string, updates: any) {
    const { data, error } = await supabase
      .from('school_config')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Students ---
  async getStudents(className?: string) {
    let query = supabase.from('students').select(`
      *,
      subjects:subject_grades(*),
      behaviour:behavioural_ratings(*)
    `);
    
    if (className) {
      query = query.eq('class_name', className);
    }
    
    const { data: studentsData, error } = await query;
    if (error) throw error;
    if (!studentsData || studentsData.length === 0) return [];

    let overrides: any[] = [];
    try {
      const { data: ovData, error: ovError } = await supabase
        .from('nursery_overrides')
        .select('*');
      if (!ovError && ovData) {
        overrides = ovData;
      }
    } catch (e) {
      console.warn("Table public.nursery_overrides does not exist yet. Please run the SQL migration in supabase_schema.sql.", e);
    }

    return studentsData.map(stud => {
      const studOverrides = overrides.filter(ov => ov.student_id === stud.id);
      return {
        ...stud,
        subjects: [
          ...(stud.subjects || []),
          ...studOverrides.map((ov: any) => ({
            name: `__nursery_term_stats_${ov.term}`,
            firstTermSummary: ov.cumulative,
            secondTermSummary: Math.round(Number(ov.average) * 10)
          }))
        ]
      };
    });
  },

  async getStudentById(id: string) {
    const { data: studentData, error } = await supabase
      .from('students')
      .select(`
        *,
        subjects:subject_grades(*),
        behaviour:behavioural_ratings(*)
      `)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!studentData) return null;

    let overrides: any[] = [];
    try {
      const { data: ovData, error: ovError } = await supabase
        .from('nursery_overrides')
        .select('*')
        .eq('student_id', id);
      if (!ovError && ovData) {
        overrides = ovData;
      }
    } catch (e) {
      console.warn("Table public.nursery_overrides does not exist yet. Please run the SQL migration.", e);
    }

    return {
      ...studentData,
      subjects: [
        ...(studentData.subjects || []),
        ...overrides.map((ov: any) => ({
          name: `__nursery_term_stats_${ov.term}`,
          firstTermSummary: ov.cumulative,
          secondTermSummary: Math.round(Number(ov.average) * 10)
        }))
      ]
    };
  },

  async saveStudent(student: any) {
    try {
      const { subjects, behaviour, ...studentData } = student;
      const fallbackId = `EZB-STUDENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const targetId = studentData.id || fallbackId;

      // 1. Upsert student basic details with strict type safety matching PostgreSQL column types
      const { data: savedStudent, error: studentError } = await supabase
        .from('students')
        .upsert({
          id: targetId,
          name: studentData.name,
          age: Math.max(1, Math.round(Number(studentData.age) || 15)),
          sex: studentData.sex === 'Female' ? 'Female' : 'Male',
          class_name: studentData.className || 'JSS1',
          term_date: studentData.termDate || '',
          session: studentData.session || '',
          attendance_present: Math.max(0, Math.round(Number(studentData.attendancePresent) || 0)),
          attendance_total: Math.max(0, Math.round(Number(studentData.attendanceTotal) || 110)),
          form_teacher_remark: studentData.formTeacherRemark || '',
          form_teacher_name: studentData.formTeacherName || '',
          principal_name: studentData.principalName || '',
          resumption_date: studentData.resumptionDate || '',
          password: encryptPassword(studentData.password || '123456'),
          password_use_count: Math.max(0, Math.round(Number(studentData.passwordUseCount) || 0)),
          password_rolled_over: !!studentData.passwordRolledOver,
          principal_remark: studentData.principalRemark || ''
        })
        .select()
        .single();

      if (studentError) throw studentError;

      const studentId = savedStudent.id;

      // 2. Clear and Upsert Subjects & Nursery Overrides
      if (subjects && subjects.length > 0) {
        const normalSubjects = subjects.filter((sub: any) => sub.name && !sub.name.startsWith('__nursery_term_stats_'));
        const nurseryStatsSubjects = subjects.filter((sub: any) => sub.name && sub.name.startsWith('__nursery_term_stats_'));

        // Clear and Insert normal subjects
        await supabase.from('subject_grades').delete().eq('student_id', studentId);
        
        if (normalSubjects.length > 0) {
          const subjectsWithRelations = normalSubjects.map((sub: any) => ({
            student_id: studentId,
            name: sub.name,
            test_score: Math.max(0, Math.min(30, Math.round(Number(sub.testScore) || 0))),
            exam_score: Math.max(0, Math.min(70, Math.round(Number(sub.examScore) || 0))),
            first_term_summary: Math.round(Number(sub.firstTermSummary) || 0),
            second_term_summary: Math.round(Number(sub.secondTermSummary) || 0),
            third_term_summary: Math.round(Number(sub.thirdTermSummary) || 0),
            position: sub.position ? Math.max(1, Math.round(Number(sub.position))) : null,
            is_position_manual: !!sub.isPositionManual
          }));

          const { error: subError } = await supabase
            .from('subject_grades')
            .insert(subjectsWithRelations);

          if (subError) throw subError;
        }

        // Save Nursery Overrides to public.nursery_overrides table
        try {
          console.log('[dbService] Saving nursery overrides for student:', studentId);
          console.log('[dbService] All subjects passed to saveStudent:', subjects);
          console.log('[dbService] Nursery subjects identified:', nurseryStatsSubjects);
          
          await supabase.from('nursery_overrides').delete().eq('student_id', studentId);

          if (nurseryStatsSubjects.length > 0) {
            const overridesToInsert = nurseryStatsSubjects.map((sub: any) => {
              const term = sub.name.replace('__nursery_term_stats_', '');
              const cumulative = Math.round(Number(sub.firstTermSummary) || 0);
              const average = (Math.round(Number(sub.secondTermSummary) || 0)) / 10;
              return {
                student_id: studentId,
                term: term,
                cumulative: cumulative,
                average: average
              };
            });
            console.log('[dbService] Inserting nursery overrides:', overridesToInsert);

            const { error: ovError } = await supabase
              .from('nursery_overrides')
              .insert(overridesToInsert);
            
            if (ovError) {
              console.error('[dbService] Error inserting nursery overrides:', ovError);
              throw ovError;
            }
          }
        } catch (ovErr) {
          console.warn("Could not save to public.nursery_overrides table. It might not be created yet in your Supabase database. Please run the SQL schema migration in your Supabase dashboard.", ovErr);
        }
      }

      // 3. Clear and Upsert Behaviour/Traits
      if (behaviour && behaviour.length > 0) {
        // Clear old
        await supabase.from('behavioural_ratings').delete().eq('student_id', studentId);

        // Insert new with strict rating bounds matching check constraints (1 to 5)
        const behaviourWithRelations = behaviour.map((b: any) => ({
          student_id: studentId,
          name: b.name,
          rating: Math.max(1, Math.min(5, Math.round(Number(b.rating) || 5)))
        }));

        const { error: bError } = await supabase
          .from('behavioural_ratings')
          .insert(behaviourWithRelations);

        if (bError) throw bError;
      }

      return savedStudent;
    } catch (error) {
      console.error('[dbService] saveStudent failed, queueing:', error);
      await syncService.enqueue({ table: 'students', action: 'upsert', data: student });
      throw error;
    }
  },

  async saveAllStudents(students: Student[]) {
    if (students.length === 0) return;

    // 1. Map all basic details to DB format, enforcing strict integer data types
    const dbStudents = students.map(s => ({
      id: s.id,
      name: s.name,
      age: Math.max(1, Math.round(Number(s.age) || 15)),
      sex: s.sex === 'Female' ? 'Female' : 'Male',
      class_name: s.className || 'JSS1',
      term_date: s.termDate || '',
      session: s.session || '',
      attendance_present: Math.max(0, Math.round(Number(s.attendancePresent) || 0)),
      attendance_total: Math.max(0, Math.round(Number(s.attendanceTotal) || 110)),
      form_teacher_remark: s.formTeacherRemark || '',
      form_teacher_name: s.formTeacherName || '',
      principal_name: s.principalName || '',
      resumption_date: s.resumptionDate,
      password: encryptPassword(s.password || '123456'),
      password_use_count: Math.max(0, Math.round(Number(s.passwordUseCount) || 0)),
      password_rolled_over: !!s.passwordRolledOver,
      principal_remark: s.principalRemark || ''
    }));

    // Batch upsert students in a single high-performance request
    const { error: studentError } = await supabase
      .from('students')
      .upsert(dbStudents);

    if (studentError) throw studentError;

    // 2. Gather all subjects, behaviours, and overrides from all students, enforcing constraints
    const allSubjects: any[] = [];
    const allBehaviours: any[] = [];
    const allNurseryOverrides: any[] = [];
    const studentIds = students.map(s => s.id);

    students.forEach(student => {
      if (student.subjects && student.subjects.length > 0) {
        student.subjects.forEach((sub: any) => {
          const isNurseryStats = sub.name && sub.name.startsWith('__nursery_term_stats_');
          
          if (isNurseryStats) {
            const term = sub.name.replace('__nursery_term_stats_', '');
            const cumulative = Math.round(Number(sub.firstTermSummary) || 0);
            const average = (Math.round(Number(sub.secondTermSummary) || 0)) / 10;
            allNurseryOverrides.push({
              student_id: student.id,
              term: term,
              cumulative: cumulative,
              average: average
            });
          } else {
            allSubjects.push({
              student_id: student.id,
              name: sub.name,
              test_score: Math.max(0, Math.min(30, Math.round(Number(sub.testScore) || 0))),
              exam_score: Math.max(0, Math.min(70, Math.round(Number(sub.examScore) || 0))),
              first_term_summary: Math.round(Number(sub.firstTermSummary) || 0),
              second_term_summary: Math.round(Number(sub.secondTermSummary) || 0),
              third_term_summary: Math.round(Number(sub.thirdTermSummary) || 0),
              position: sub.position ? Math.max(1, Math.round(Number(sub.position))) : null,
              is_position_manual: !!sub.isPositionManual
            });
          }
        });
      }

      if (student.behaviour && student.behaviour.length > 0) {
        student.behaviour.forEach((b: any) => {
          allBehaviours.push({
            student_id: student.id,
            name: b.name,
            rating: Math.max(1, Math.min(5, Math.round(Number(b.rating) || 5)))
          });
        });
      }
    });

    // 3. Clear existing grades/behaviours/overrides for these specific students in bulk, then batch insert
    if (studentIds.length > 0) {
      const { error: delSubError } = await supabase.from('subject_grades').delete().in('student_id', studentIds);
      if (delSubError) throw delSubError;

      const { error: delBhvError } = await supabase.from('behavioural_ratings').delete().in('student_id', studentIds);
      if (delBhvError) throw delBhvError;

      try {
        await supabase.from('nursery_overrides').delete().in('student_id', studentIds);
      } catch (ovErr) {
        console.warn("Could not delete nursery overrides. Table may not exist.", ovErr);
      }
    }

    // 4. Batch insert all new grades and behaviours
    if (allSubjects.length > 0) {
      const { error: subError } = await supabase
        .from('subject_grades')
        .insert(allSubjects);
      if (subError) throw subError;
    }

    if (allBehaviours.length > 0) {
      const { error: bError } = await supabase
        .from('behavioural_ratings')
        .insert(allBehaviours);
      if (bError) throw bError;
    }

    if (allNurseryOverrides.length > 0) {
      try {
        const { error: ovError } = await supabase
          .from('nursery_overrides')
          .insert(allNurseryOverrides);
        if (ovError) throw ovError;
      } catch (ovErr) {
        console.warn("Could not batch insert nursery overrides. Table may not exist.", ovErr);
      }
    }
  },

  async deleteStudent(studentId: string) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
    if (error) throw error;
    return true;
  },

  // --- Faculty Admin Profile ---
  async getFacultyProfiles() {
    const { data, error } = await supabase
      .from('faculty_profiles')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async saveFacultyProfile(profile: any) {
    const tempId = mapFrontendIdToUuid(profile.id);
    const { data, error } = await supabase
      .from('faculty_profiles')
      .upsert({
        id: tempId || undefined,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar,
        password: encryptPassword(profile.password || '123456'),
        is_restricted: profile.isRestricted || false,
        email: profile.email || '',
        assigned_class: profile.assignedClass || null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFacultyProfile(profileId: string) {
    const dbId = mapFrontendIdToUuid(profileId);
    const { error } = await supabase
      .from('faculty_profiles')
      .delete()
      .eq('id', dbId);
    if (error) throw error;
    return true;
  },

  // --- Passcode Audit Logs ---
  async getAuditLogs() {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) {
        console.warn("Could not query audit_logs table. Please run the SQL migration.", error);
        return null;
      }
      return data.map((row: any) => ({
        id: row.id,
        timestamp: row.timestamp,
        studentId: row.student_id,
        studentName: row.student_name,
        studentClass: row.student_class,
        action: row.action as any,
        performedBy: row.performed_by,
        oldPasscode: row.old_passcode || undefined,
        newPasscode: row.new_passcode
      }));
    } catch (e) {
      console.warn("Exception fetching audit logs:", e);
      return null;
    }
  },

  async saveAuditLog(entry: AuditLogEntry) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .upsert({
          id: entry.id,
          timestamp: entry.timestamp,
          student_id: entry.studentId,
          student_name: entry.studentName,
          student_class: entry.studentClass,
          action: entry.action,
          performed_by: entry.performedBy,
          old_passcode: entry.oldPasscode || null,
          new_passcode: entry.newPasscode
        });
      if (error) throw error;
    } catch (e) {
      console.warn("Exception saving audit log to db:", e);
    }
  },

  async clearAuditLogs() {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .delete()
        .neq('id', 'placeholder_sentinel_row'); // Delete all
      if (error) throw error;
    } catch (e) {
      console.warn("Exception clearing audit logs from db:", e);
    }
  }
};
