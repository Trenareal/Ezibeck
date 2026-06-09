import { Student, SubjectGrade, BehaviourRating, ClassName, SchoolInfo } from '../types';

export const SCHOOL_INFO: SchoolInfo = {
  name: "EZIBECK’S ACADEMY",
  motto: "Knowledge is Power",
  address: "No, 5 Ezibeck’s Crescent, Behind Udu Motor Park Ovwian, Delta State",
  phone: "+234 803 123 4567",
  email: "info@ezibeckacademy.edu.ng"
};

export const JSS_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Basic Science",
  "Social Studies",
  "Business Studies",
  "Civic Education",
  "Computer Studies (ICT)",
  "Agricultural Science",
  "Home Economics",
  "Creative Arts & Crafts"
];

export const SS_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Biology",
  "Chemistry",
  "Physics",
  "Economics",
  "Civic Education",
  "Geography",
  "Agricultural Science",
  "Information Technology"
];

export const BEHAVIOUR_TRAITS = [
  "Punctuality",
  "Neatness & Grooming",
  "Politeness & Courtesy",
  "Honesty & Reliability",
  "Industry & Hard Work",
  "Leadership Qualities",
  "Obedience & Compliance",
  "Cooperation & Teamwork",
  "Self-reliance"
];

export function getLetterAndRemark(score: number | undefined | null): { letter: string; remark: string; ratingClass: string } {
  if (score === undefined || score === null || isNaN(score)) {
    return { letter: "No Score", remark: "No Score", ratingClass: "text-slate-500 bg-slate-50 border-slate-200" };
  }
  if (score === 0) {
    return { letter: "-", remark: "No Score/Pending", ratingClass: "text-slate-400 bg-slate-50/50 border-slate-200" };
  }
  if (score < 0 || score > 100) {
    return { letter: "Invalid Score", remark: "Invalid Score", ratingClass: "text-red-500 bg-red-50 border-red-200" };
  }
  if (score >= 90) return { letter: "A+", remark: "Distinction", ratingClass: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (score >= 80) return { letter: "A", remark: "Excellent", ratingClass: "text-green-600 bg-green-50 border-green-200" };
  if (score >= 70) return { letter: "B", remark: "Very Good", ratingClass: "text-sky-600 bg-sky-50 border-sky-200" };
  if (score >= 60) return { letter: "C", remark: "Good", ratingClass: "text-amber-600 bg-amber-50 border-amber-200" };
  if (score >= 50) return { letter: "D", remark: "Fair", ratingClass: "text-orange-600 bg-orange-50 border-orange-200" };
  return { letter: "F", remark: "Fail", ratingClass: "text-red-600 bg-red-50 border-red-200" };
}

export function calculateSubjectTotal(g: SubjectGrade): number {
  return (g.testScore || 0) + (g.examScore || 0);
}

export interface StudentStats {
  gpa: string;
  avgScore: number;
  totalScore: number;
  maxPossibleScore: number;
  creditsAndAbove: number; // C grade or better (score >= 60)
  passes: number;         // D grade (score >= 50 && score < 60)
  failures: number;       // F grade (score < 50)
}

export function calculateStudentStats(s: Student): StudentStats {
  const totalScore = s.subjects.reduce((sum, g) => sum + calculateSubjectTotal(g), 0);
  const subjectCount = s.subjects.length || 1;
  const avgScore = totalScore / subjectCount;
  const maxPossibleScore = s.subjects.length * 100;
  
  let creditsAndAbove = 0;
  let passes = 0;
  let failures = 0;
  
  s.subjects.forEach(g => {
    const tot = calculateSubjectTotal(g);
    if (tot >= 60) {
      creditsAndAbove++;
    } else if (tot >= 50) {
      passes++;
    } else {
      failures++;
    }
  });

  // Simple GPA representation out of 5.0
  // A+/A = 5, B = 4, C = 3, D = 2, F = 0
  const totalGpaPoints = s.subjects.reduce((sum, g) => {
    const tot = calculateSubjectTotal(g);
    if (tot >= 80) return sum + 5;
    if (tot >= 70) return sum + 4;
    if (tot >= 60) return sum + 3;
    if (tot >= 50) return sum + 2;
    return sum;
  }, 0);
  
  const gpa = s.subjects.length > 0 ? (totalGpaPoints / s.subjects.length).toFixed(2) : "0.00";

  return {
    gpa,
    avgScore,
    totalScore,
    maxPossibleScore,
    creditsAndAbove,
    passes,
    failures
  };
}

export function calculateClassPositions(students: Student[], className?: ClassName): Student[] {
  // Group students by class if className not specified (or filter first)
  const groupedList = className 
    ? students.filter(s => s.className === className)
    : students;

  // Calculate average scores and sort
  const scoredStudents = groupedList.map(s => {
    const { totalScore } = calculateStudentStats(s);
    return { student: s, totalScore };
  });

  scoredStudents.sort((a, b) => b.totalScore - a.totalScore);

  // Set position inside subjects or class positioning
  const positioned = scoredStudents.map((item, idx) => {
    const position = idx + 1;
    // We update each subject position if wanted, or just keep class rank
    const updatedStudent = {
      ...item.student,
      subjects: item.student.subjects.map(subj => {
        // Find subject rank across matching class students
        const allScoresForSubj = groupedList.map(otherStud => {
          const matchSubj = otherStud.subjects.find(os => os.name === subj.name);
          return {
            id: otherStud.id,
            total: matchSubj ? calculateSubjectTotal(matchSubj) : 0
          };
        }).sort((x, y) => y.total - x.total);
        
        const subjPos = subj.isPositionManual && subj.position !== undefined
          ? subj.position
          : allScoresForSubj.findIndex(scoreObj => scoreObj.id === item.student.id) + 1;
        return {
          ...subj,
          position: subjPos,
          isPositionManual: subj.isPositionManual
        };
      })
    };
    return updatedStudent;
  });

  // If we filtered a specific class, merge them back with other classes in main list
  if (className) {
    const untouched = students.filter(s => s.className !== className);
    return [...positioned, ...untouched];
  }

  return positioned;
}

// Generate realistic grades for a student - modified to default to 0 so everything is 0 until scores are inputed
export function generateRandomGrades(subjects: string[]): SubjectGrade[] {
  return subjects.map((sub, idx) => {
    return {
      id: `${idx}-${Date.now()}-${Math.random()}`,
      name: sub,
      testScore: 0,
      examScore: 0,
      firstTermSummary: 0,
      secondTermSummary: 0,
      thirdTermSummary: 0
    };
  });
}

// Generate default behavior ratings
export function generateDefaultBehaviour(): BehaviourRating[] {
  return BEHAVIOUR_TRAITS.map(trait => {
    // Most get 3-5
    const score = Math.floor(Math.random() * 3) + 3;
    return {
      name: trait,
      rating: Math.min(5, score)
    };
  });
}

const FIRST_NAMES = ["Tobi", "Chinedu", "Amina", "Divine", "Emeka", "Zainab", "Olumide", "Favor", "Bassey", "Somtochukwu", "Eseoghene", "Fatima", "Chibuike", "Tega", "Kelechi", "Olamide", "Ejiro", "Blessing", "Samuel", "Tunde", "Uche", "Nkechi", "Seyi", "Funke", "Chidi", "Yinka", "Ifeoma", "Yusuf", "Ozo", "Efe"];
const LAST_NAMES = ["Alao", "Okafor", "Yusuf", "Nwosu", "Abubakar", "Johnson", "Okoye", "Ekong", "Ani", "Oghenekevwe", "Bello", "Obi", "Akpobome", "Nwachukwu", "Bakare", "Onome", "Sunday", "Kalu", "Ojo", "Balogun", "Ogah", "Ibrahim", "Adeyemi", "Uzoh", "Okonkwo", "Suleiman", "Igwe", "Olawale", "Okoronkwo", "Dada"];

export function createStudent(name: string, className: ClassName, idx: number): Student {
  const isJSS = className.startsWith('JSS');
  const subjectsList = isJSS ? JSS_SUBJECTS : SS_SUBJECTS;
  const age = isJSS 
    ? (className === 'JSS1' ? 11 : className === 'JSS2' ? 12 : 13)
    : (className === 'SS1' ? 14 : className === 'SS2' ? 15 : 16);
    
  const sex = idx % 2 === 0 ? 'Male' : 'Female';
  
  // Custom teacher comments based on grade caliber
  const remarks = [
    "An outstanding academic result. Keep leading your peers!",
    "A very good result. Continue with this level of focus and hard work.",
    "A solid outcome, though there is room for improvement in science subjects.",
    "A satisfactory outcome. Please encourage active study habits at home.",
    "Academic results are fair. More dedication is needed next term."
  ];

  const principalComments = [
    "Excellent behavior and scholarly diligence. Promoted with honor.",
    "Very commendable results. Keep up the high standards.",
    "Satisfactory progress. Focused effort in math will yield higher levels next term.",
    "A pass, but needs serious study focus in core subjects.",
    "Close guidance is required. Dedicate more study time."
  ];

  const remarkIdx = idx % remarks.length;

  return {
    id: `EZB-${className}-${101 + idx}`,
    name,
    age,
    sex,
    className,
    termDate: "2026-04-10",
    session: "2025/2026",
    attendancePresent: 104 - (idx % 8),
    attendanceTotal: 110,
    subjects: generateRandomGrades(subjectsList),
    behaviour: generateDefaultBehaviour(),
    formTeacherRemark: remarks[remarkIdx],
    formTeacherName: isJSS ? "Mrs. Gladys Alabi" : "Mr. Anthony Okon",
    principalName: "Dr. Ezekiel Beck",
    resumptionDate: "2026-09-14",
    password: "123456"
  };
}

export function getInitialStudents(): Student[] {
  const classes: ClassName[] = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
  let students: Student[] = [];

  // Generate 4 students per class
  classes.forEach(cls => {
    for (let i = 0; i < 4; i++) {
      const nameIndex = (classes.indexOf(cls) * 4 + i) % FIRST_NAMES.length;
      const name = `${FIRST_NAMES[nameIndex]} ${LAST_NAMES[(nameIndex + i) % LAST_NAMES.length]}`;
      students.push(createStudent(name, cls, i));
    }
  });

  // Calculate ranks across each class
  classes.forEach(cls => {
    students = calculateClassPositions(students, cls);
  });

  return students;
}

export function loadStoredStudents(term?: string): Student[] {
  if (typeof window === 'undefined') return getInitialStudents();
  const activeTerm = term || 'Second Term';
  const termKey = `ezibeck_students_${activeTerm.toLowerCase().replace(/\s+/g, '_')}`;
  try {
    const val = localStorage.getItem(termKey);
    if (val) {
      return JSON.parse(val);
    }
    // Fallback: migrate from legacy key if available, so they don't lose progress
    const legacyVal = localStorage.getItem('ezibeck_students');
    if (legacyVal) {
      const parsed = JSON.parse(legacyVal);
      saveStudents(parsed, activeTerm);
      return parsed;
    }
  } catch (e) {
    console.error(`Error loading students for ${activeTerm} from localStorage`, e);
  }
  const students = getInitialStudents();
  saveStudents(students, activeTerm);
  return students;
}

export function saveStudents(students: Student[], term?: string) {
  if (typeof window === 'undefined') return;
  const activeTerm = term || 'Second Term';
  const termKey = `ezibeck_students_${activeTerm.toLowerCase().replace(/\s+/g, '_')}`;
  try {
    localStorage.setItem(termKey, JSON.stringify(students));
  } catch (e) {
    console.error(`Failed to save students for ${activeTerm} to localStorage`, e);
  }
}

export function formatOrdinal(n: number | undefined): string {
  if (n === undefined || isNaN(n) || n <= 0) return '-';
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
