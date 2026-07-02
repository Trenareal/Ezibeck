import { Student, SubjectGrade, BehaviourRating, ClassName, SchoolInfo } from '../types';
import { safeStorage } from './safeStorage';

export const SCHOOL_INFO: SchoolInfo = {
  name: "Ezibeck Core International College",
  motto: "Knowledge, discipline and outstanding character excellence",
  address: "120, Broadway Lane, New York, NY 10025",
  phone: "+1 (555) 489-0128",
  email: "admissions@ezibeckcollege.edu"
};

export const JSS_SUBJECTS = [
  "Mathematics",
  "English Studies",
  "Basic Science and Technology",
  "Pre-vocational Studies",
  "National Value",
  "Business Studies",
  "Cultural and Creative Art",
  "Speech Development",
  "Local Language",
  "C.R.S",
  "History"
];

export const SS1_SUBJECTS = [
  "Mathematics",
  "Further Mathematics",
  "English Studies",
  "Literature In English",
  "Biology",
  "Physics",
  "Chemistry",
  "Geography",
  "Agricultural Science",
  "Christian religious studies",
  "Commerce",
  "Marketing",
  "Civic Education",
  "Economics",
  "Government",
  "Speech Development",
  "Financial Accounting",
  "Data Processing"
];

export const SS_SCIENCE_SUBJECTS = [
  "Mathematics",
  "Further Mathematics",
  "English Studies",
  "Biology",
  "Physics",
  "Chemistry",
  "Geography",
  "Agricultural Science",
  "Marketing",
  "Civic Education",
  "Economics",
  "Data Processing",
  "Speech Development"
];

export const SS_ART_SUBJECTS = [
  "Mathematics",
  "English Studies",
  "Literature in English",
  "Biology",
  "Agricultural Science",
  "C.R.S.",
  "Commerce",
  "Marketing",
  "Civic Education",
  "Economics",
  "Government",
  "Financial Accounting",
  "Data Processing",
  "Speech Development"
];

export const SS_SUBJECTS = SS1_SUBJECTS;

export const NURSERY_SUBJECTS = [
  "Numeracy",
  "Literacy",
  "Health Science",
  "Social Habit",
  "C.R.S",
  "Natural Science",
  "Creative Art",
  "Computer Science",
  "Hand Writing",
  "Quantitative Reasoning",
  "Verbal Reasoning",
  "Rhymes",
  "Spelling Drill",
  "Speech Development",
  "Current Affair"
];

export const PRE_NURSERY_SUBJECTS = [
  "Numeracy",
  "Literacy",
  "Colouring",
  "Writing Skill",
  "Social Habit",
  "Nature Science",
  "C.R.S",
  "Rhyme"
];

export const PRIMARY_SUBJECTS = [
  "Mathematics",
  "English Studies",
  "Basic Science and Technology",
  "Quantitative Reasoning",
  "Verbal Reasoning",
  "Cultural and Creative Art",
  "Current Affair",
  "Local Language",
  "Speech Development",
  "National Value",
  "Religion Value",
  "History",
  "Prevocational studies"
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

export const SECONDARY_BEHAVIOUR_TRAITS = [
  "Punctuality",
  "Class Attendance",
  "Attentiveness",
  "Working Habit",
  "Sense of Responsibility",
  "Initiative",
  "Reliability",
  "Organisational Ability",
  "Neatness",
  "Respect for Authority"
];

export const KG_BEHAVIOUR_TRAITS = [
  "Punctuality",
  "Neatness",
  "Assignment",
  "Concentration"
];

export const KG_SKILL_TRAITS = [
  "Hand-writing",
  "Fluency",
  "Attitude to Property"
];

export function compareSubjects(aName: string, bName: string): number {
  if (aName === bName) return 0;
  const aLower = aName.toLowerCase();
  const bLower = bName.toLowerCase();
  
  // Standard non-alphabetical curriculum subject order
  const refOrder = [
    "mathematics",
    "english language",
    "english studies",
    "english",
    "basic science",
    "basic science and technology",
    "social studies",
    "business studies",
    "civic education",
    "computer studies (ict)",
    "computer studies",
    "computer science",
    "agricultural science",
    "home economics",
    "creative arts & crafts",
    "biology",
    "chemistry",
    "physics",
    "economics",
    "geography",
    "information technology",
    "numeracy",
    "literacy",
    "health science",
    "social habit",
    "c.r.s",
    "natural science",
    "creative art",
    "hand writing",
    "quantitative reasoning",
    "verbal reasoning",
    "rhymes",
    "spelling drill",
    "cultural and creative art",
    "current affair",
    "local language",
    "speech development",
    "national value",
    "religion value",
    "history",
    "prevocational studies",
    "pre-vocational studies"
  ];

  const aIndex = refOrder.indexOf(aLower);
  const bIndex = refOrder.indexOf(bLower);

  if (aIndex !== -1 && bIndex !== -1) {
    return aIndex - bIndex;
  }
  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;

  // Fallback to alphabetical only for completely custom subjects not in the reference list
  return aName.localeCompare(bName);
}

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
  if (!s) {
    return {
      gpa: "0.00",
      avgScore: 0,
      totalScore: 0,
      maxPossibleScore: 0,
      creditsAndAbove: 0,
      passes: 0,
      failures: 0
    };
  }
  let subjects = Array.isArray(s.subjects) ? s.subjects : [];
  subjects = subjects.filter(g => !g.name.startsWith('__'));
  const totalScore = subjects.reduce((sum, g) => sum + calculateSubjectTotal(g), 0);
  const subjectCount = subjects.length || 1;
  const avgScore = totalScore / subjectCount;
  const maxPossibleScore = subjects.length * 100;
  
  let creditsAndAbove = 0;
  let passes = 0;
  let failures = 0;
  
  subjects.forEach(g => {
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
  const totalGpaPoints = subjects.reduce((sum, g) => {
    const tot = calculateSubjectTotal(g);
    if (tot >= 80) return sum + 5;
    if (tot >= 70) return sum + 4;
    if (tot >= 60) return sum + 3;
    if (tot >= 50) return sum + 2;
    return sum;
  }, 0);
  
  const gpa = subjects.length > 0 ? (totalGpaPoints / subjects.length).toFixed(2) : "0.00";

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

export function calculateStudentStatsForTerm(s: Student, term: string): StudentStats {
  if (!s) {
    return {
      gpa: "0.00",
      avgScore: 0,
      totalScore: 0,
      maxPossibleScore: 0,
      creditsAndAbove: 0,
      passes: 0,
      failures: 0
    };
  }
  let subjects = Array.isArray(s.subjects) ? s.subjects : [];
  subjects = subjects.filter(g => !g.name.startsWith('__'));
  const isThirdTerm = term === 'Third Term';
  const totalScore = subjects.reduce((sum, g) => {
    if (isThirdTerm) {
      const tot = (g.testScore || 0) + (g.examScore || 0);
      const first = g.firstTermSummary !== undefined && g.firstTermSummary !== 0 ? g.firstTermSummary : Math.round(tot * 0.2);
      const second = g.secondTermSummary !== undefined && g.secondTermSummary !== 0 ? g.secondTermSummary : Math.round(tot * 0.2);
      const third = g.thirdTermSummary !== undefined && g.thirdTermSummary !== 0 ? g.thirdTermSummary : Math.round(tot * 0.6);
      return sum + (first + second + third);
    } else {
      return sum + ((g.testScore || 0) + (g.examScore || 0));
    }
  }, 0);

  const subjectCount = subjects.length || 1;
  const avgScore = totalScore / subjectCount;
  const maxPossibleScore = subjects.length * 100;
  
  let creditsAndAbove = 0;
  let passes = 0;
  let failures = 0;
  
  subjects.forEach(g => {
    let tot = 0;
    if (isThirdTerm) {
      const subjTot = (g.testScore || 0) + (g.examScore || 0);
      const first = g.firstTermSummary !== undefined && g.firstTermSummary !== 0 ? g.firstTermSummary : Math.round(subjTot * 0.2);
      const second = g.secondTermSummary !== undefined && g.secondTermSummary !== 0 ? g.secondTermSummary : Math.round(subjTot * 0.2);
      const third = g.thirdTermSummary !== undefined && g.thirdTermSummary !== 0 ? g.thirdTermSummary : Math.round(subjTot * 0.6);
      tot = first + second + third;
    } else {
      tot = (g.testScore || 0) + (g.examScore || 0);
    }

    if (tot >= 60) {
      creditsAndAbove++;
    } else if (tot >= 50) {
      passes++;
    } else {
      failures++;
    }
  });

  const totalGpaPoints = subjects.reduce((sum, g) => {
    let tot = 0;
    if (isThirdTerm) {
      const subjTot = (g.testScore || 0) + (g.examScore || 0);
      const first = g.firstTermSummary !== undefined && g.firstTermSummary !== 0 ? g.firstTermSummary : Math.round(subjTot * 0.2);
      const second = g.secondTermSummary !== undefined && g.secondTermSummary !== 0 ? g.secondTermSummary : Math.round(subjTot * 0.2);
      const third = g.thirdTermSummary !== undefined && g.thirdTermSummary !== 0 ? g.thirdTermSummary : Math.round(subjTot * 0.6);
      tot = first + second + third;
    } else {
      tot = (g.testScore || 0) + (g.examScore || 0);
    }

    if (tot >= 80) return sum + 5;
    if (tot >= 70) return sum + 4;
    if (tot >= 60) return sum + 3;
    if (tot >= 50) return sum + 2;
    return sum;
  }, 0);
  
  const gpa = subjects.length > 0 ? (totalGpaPoints / subjects.length).toFixed(2) : "0.00";

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

export function calculateClassPositions(students: Student[], className?: ClassName, term?: string): Student[] {
  if (!Array.isArray(students)) return [];
  const activeTerm = term || 'Third Term';
  // Group students by class if className not specified (or filter first)
  const groupedList = className 
    ? students.filter(s => s && s.className === className)
    : students.filter(s => !!s);

  // Calculate average scores and sort using the term-specific stats helper
  const scoredStudents = groupedList.map(s => {
    const { totalScore } = calculateStudentStatsForTerm(s, activeTerm);
    return { student: s, totalScore };
  });

  scoredStudents.sort((a, b) => b.totalScore - a.totalScore);

  // Set position inside subjects or class positioning
  const positioned = scoredStudents.map((item, idx) => {
    const sSubjects = Array.isArray(item.student?.subjects) ? item.student.subjects : [];
    const updatedStudent = {
      ...item.student,
      subjects: sSubjects.map(subj => {
        // Find subject rank across matching class students using term-specific subject score
        const allScoresForSubj = groupedList.map(otherStud => {
          const oSubjects = Array.isArray(otherStud?.subjects) ? otherStud.subjects : [];
          const matchSubj = oSubjects.find(os => os && os.name === subj.name);
          let matchTotal = 0;
          if (matchSubj) {
            if (activeTerm === 'Third Term') {
              const subjTot = (matchSubj.testScore || 0) + (matchSubj.examScore || 0);
              const first = matchSubj.firstTermSummary !== undefined && matchSubj.firstTermSummary !== 0 ? matchSubj.firstTermSummary : Math.round(subjTot * 0.2);
              const second = matchSubj.secondTermSummary !== undefined && matchSubj.secondTermSummary !== 0 ? matchSubj.secondTermSummary : Math.round(subjTot * 0.2);
              const third = matchSubj.thirdTermSummary !== undefined && matchSubj.thirdTermSummary !== 0 ? matchSubj.thirdTermSummary : Math.round(subjTot * 0.6);
              matchTotal = first + second + third;
            } else {
              matchTotal = (matchSubj.testScore || 0) + (matchSubj.examScore || 0);
            }
          }
          return {
            id: otherStud.id,
            total: matchTotal
          };
        }).sort((x, y) => y.total - x.total);
        
        const subjPos = allScoresForSubj.findIndex(scoreObj => scoreObj.id === item.student.id) + 1;
        return {
          ...subj,
          position: subjPos,
          isPositionManual: false
        };
      })
    };
    return updatedStudent;
  });

  // If we filtered a specific class, merge them back with other classes in main list
  if (className) {
    const untouched = students.filter(s => s && s.className !== className);
    return [...positioned, ...untouched];
  }

  return positioned;
}

// Generate zero-initialized grades for a student until edited
export function generateRandomGrades(subjects: string[], term?: string, studentIdx?: number): SubjectGrade[] {
  const activeTerm = term || 'Third Term';
  const sIdx = studentIdx !== undefined ? studentIdx : 0;

  return subjects.map((sub, idx) => {
    return {
      id: `${idx}-${activeTerm.toLowerCase().replace(/\s+/g, '_')}-${sIdx}-${idx}`,
      name: sub,
      testScore: 0,
      examScore: 0,
      firstTermSummary: 0,
      secondTermSummary: 0,
      thirdTermSummary: 0
    };
  });
}

// Generate default behavior ratings depending on class name
export function generateDefaultBehaviour(className?: ClassName): BehaviourRating[] {
  const isKg = className === 'Pre-Nursery' || (className && className.startsWith('Nursery'));
  if (isKg) {
    const list = [...KG_BEHAVIOUR_TRAITS, ...KG_SKILL_TRAITS];
    return list.map(trait => {
      const score = Math.floor(Math.random() * 3) + 3;
      return {
        name: trait,
        rating: Math.min(5, score)
      };
    });
  }
  const isSecondary = className && (className.startsWith('JSS') || className.startsWith('SS'));
  const listToUse = isSecondary ? SECONDARY_BEHAVIOUR_TRAITS : BEHAVIOUR_TRAITS;
  return listToUse.map(trait => {
    // Most get 3-5
    const score = Math.floor(Math.random() * 3) + 3;
    return {
      name: trait,
      rating: Math.min(5, score)
    };
  });
}

// Adjust behaviour array for older/legacy student models or wrong class formats dynamically
export function adjustBehaviourIfRequired(behaviour: BehaviourRating[], className: ClassName): BehaviourRating[] {
  const isKg = className === 'Pre-Nursery' || className.startsWith('Nursery');
  if (isKg) {
    const requiredBehaviour = ["Punctuality", "Neatness", "Assignment", "Concentration"];
    const requiredSkills = ["Hand-writing", "Fluency", "Attitude to Property"];
    const allRequired = [...requiredBehaviour, ...requiredSkills];
    
    // Create map of existing
    const existingMap = new Map<string, number>();
    (behaviour || []).forEach(b => {
      existingMap.set(b.name.toLowerCase().trim(), b.rating);
    });
    
    return allRequired.map(name => {
      const existingRating = existingMap.get(name.toLowerCase().trim());
      if (existingRating !== undefined) {
        return { name, rating: existingRating };
      }
      return { name, rating: Math.floor(Math.random() * 3) + 3 };
    });
  } else {
    const isSecondary = className && (className.startsWith('JSS') || className.startsWith('SS'));
    const requiredTraits = isSecondary ? SECONDARY_BEHAVIOUR_TRAITS : BEHAVIOUR_TRAITS;

    // Create map of existing
    const existingMap = new Map<string, number>();
    (behaviour || []).forEach(b => {
      existingMap.set(b.name.toLowerCase().trim(), b.rating);
    });

    const getExisting = (aliases: string[]): number | undefined => {
      for (const alias of aliases) {
        const rating = existingMap.get(alias.toLowerCase().trim());
        if (rating !== undefined) return rating;
      }
      return undefined;
    };
    
    return requiredTraits.map(name => {
      let existingRating: number | undefined = undefined;
      if (name === "Punctuality") existingRating = getExisting(["punctuality"]);
      else if (name === "Class Attendance") existingRating = getExisting(["class attendance", "attendance", "punctuality & attendance"]);
      else if (name === "Attentiveness") existingRating = getExisting(["attentiveness", "attention", "concentration", "attentiveness in class"]);
      else if (name === "Working Habit") existingRating = getExisting(["working habit", "working habits", "industry & hard work", "industry", "assignment"]);
      else if (name === "Sense of Responsibility") existingRating = getExisting(["sense of responsibility", "responsibility", "leadership qualities", "self-reliance"]);
      else if (name === "Initiative") existingRating = getExisting(["initiative", "self-reliance", "leadership qualities"]);
      else if (name === "Reliability") existingRating = getExisting(["reliability", "honesty & reliability", "honesty"]);
      else if (name === "Organisational Ability") existingRating = getExisting(["organisational ability", "organizational ability", "cooperation & teamwork"]);
      else if (name === "Neatness") existingRating = getExisting(["neatness", "neatness & grooming", "grooming"]);
      else if (name === "Respect for Authority") existingRating = getExisting(["respect for authority", "obedience & compliance", "obedience", "cooperation & teamwork"]);
      
      if (existingRating === undefined) {
        existingRating = existingMap.get(name.toLowerCase().trim());
      }
      
      if (existingRating !== undefined) {
        return { name, rating: existingRating };
      }
      return { name, rating: Math.floor(Math.random() * 3) + 3 };
    });
  }
}

// Adjust subjects array dynamically for Pre-Nursery or wrong class formats to match custom syllabus requirements
export function adjustSubjectsIfRequired(subjects: SubjectGrade[], className: ClassName, term?: string, studentIdx?: number): SubjectGrade[] {
  const activeTerm = term || 'Third Term';
  const sIdx = studentIdx !== undefined ? studentIdx : 0;
  const usedIds = new Set<string>();

  // Preserve helper/override rows (e.g. __nursery_term_stats_*) — they aren't
  // part of the standard curriculum and must survive this reconciliation step.
  const overrideRows = (subjects || []).filter(s => s.name && s.name.startsWith('__'));

  if (className === 'Pre-Nursery') {
    const required = PRE_NURSERY_SUBJECTS;
    
    const existingMap = new Map<string, SubjectGrade>();
    (subjects || []).forEach(s => {
      existingMap.set(s.name.toLowerCase().trim(), s);
    });
    
    const getExisting = (aliases: string[]): SubjectGrade | undefined => {
      for (const alias of aliases) {
        const found = existingMap.get(alias.toLowerCase().trim());
        if (found) return found;
      }
      return undefined;
    };
    
    return [...required.map((name, index) => {
      let matched: SubjectGrade | undefined = undefined;
      if (name === "Numeracy") matched = getExisting(["numeracy", "number work", "mathematics"]);
      else if (name === "Literacy") matched = getExisting(["literacy", "letter work", "english studies", "english"]);
      else if (name === "Colouring") matched = getExisting(["colouring", "creative art", "creative arts", "fine art", "handwriting"]);
      else if (name === "Writing Skill") matched = getExisting(["writing skill", "writing skills", "writing", "hand-writing", "handwriting", "health science"]);
      else if (name === "Social Habit") matched = getExisting(["social habit", "social habits", "social norms", "social habit/health", "civic education"]);
      else if (name === "Nature Science") matched = getExisting(["nature science", "natural science", "science", "nature study", "health science"]);
      else if (name === "C.R.S") matched = getExisting(["c.r.s", "crs", "christian religious studies", "c.r.k", "crk"]);
      else if (name === "Rhyme") matched = getExisting(["rhyme", "rhymes", "rhyme/poem"]);
      
      if (!matched && subjects && subjects[index]) {
        matched = subjects[index];
      }
      
      let finalId = `${name.toLowerCase().replace(/\s+/g, '_')}_${index}`;
      if (matched && matched.id && !usedIds.has(matched.id)) {
        finalId = matched.id;
      }
      usedIds.add(finalId);
      
      if (matched) {
        return {
          id: finalId,
          name: name,
          testScore: matched.testScore,
          examScore: matched.examScore,
          firstTermSummary: matched.firstTermSummary,
          secondTermSummary: matched.secondTermSummary,
          thirdTermSummary: matched.thirdTermSummary,
          position: matched.position,
          isPositionManual: matched.isPositionManual
        };
      } else {
        const mockSubjectList = [name];
        const generated = generateRandomGrades(mockSubjectList, activeTerm, sIdx);
        return {
          ...generated[0],
          id: finalId,
          name: name
        };
      }
    }), ...overrideRows];
  } else if (className.startsWith('Nursery')) {
    const required = NURSERY_SUBJECTS;
    const existingMap = new Map<string, SubjectGrade>();
    (subjects || []).forEach(s => {
      existingMap.set(s.name.toLowerCase().trim(), s);
    });
    return [...required.map((name, index) => {
      const matched = existingMap.get(name.toLowerCase().trim()) || subjects[index];
      
      let finalId = `${name.toLowerCase().replace(/\s+/g, '_')}_${index}`;
      if (matched && matched.id && !usedIds.has(matched.id)) {
        finalId = matched.id;
      }
      usedIds.add(finalId);
      
      if (matched) {
        return {
          id: finalId,
          name: name,
          testScore: matched.testScore,
          examScore: matched.examScore,
          firstTermSummary: matched.firstTermSummary,
          secondTermSummary: matched.secondTermSummary,
          thirdTermSummary: matched.thirdTermSummary,
          position: matched.position,
          isPositionManual: matched.isPositionManual
        };
      } else {
        const mockMockList = [name];
        const generated = generateRandomGrades(mockMockList, activeTerm, sIdx);
        return {
          ...generated[0],
          id: finalId,
          name: name
        };
      }
    }), ...overrideRows];
  } else if (className.startsWith('Basic')) {
    const required = PRIMARY_SUBJECTS;
    const existingMap = new Map<string, SubjectGrade>();
    (subjects || []).forEach(s => {
      existingMap.set(s.name.toLowerCase().trim(), s);
    });
    
    return [...required.map((name, index) => {
      const matched = existingMap.get(name.toLowerCase().trim()) || subjects[index];
      
      let finalId = `${name.toLowerCase().replace(/\s+/g, '_')}_${index}`;
      if (matched && matched.id && !usedIds.has(matched.id)) {
        finalId = matched.id;
      }
      usedIds.add(finalId);
      
      if (matched) {
        return {
          id: finalId,
          name: name,
          testScore: matched.testScore,
          examScore: matched.examScore,
          firstTermSummary: matched.firstTermSummary,
          secondTermSummary: matched.secondTermSummary,
          thirdTermSummary: matched.thirdTermSummary,
          position: matched.position,
          isPositionManual: matched.isPositionManual
        };
      } else {
        const mockMockList = [name];
        const generated = generateRandomGrades(mockMockList, activeTerm, sIdx);
        return {
          ...generated[0],
          id: finalId,
          name: name
        };
      }
    }), ...overrideRows];
  } else if (className.startsWith('JSS')) {
    const required = JSS_SUBJECTS;
    const existingMap = new Map<string, SubjectGrade>();
    (subjects || []).forEach(s => {
      existingMap.set(s.name.toLowerCase().trim(), s);
    });

    const getExisting = (aliases: string[]): SubjectGrade | undefined => {
      for (const alias of aliases) {
        const found = existingMap.get(alias.toLowerCase().trim());
        if (found) return found;
      }
      return undefined;
    };

    return [...required.map((name, index) => {
      let matched: SubjectGrade | undefined = undefined;
      if (name === "Mathematics") matched = getExisting(["mathematics", "maths"]);
      else if (name === "English Studies") matched = getExisting(["english studies", "english language", "english"]);
      else if (name === "Basic Science and Technology") matched = getExisting(["basic science and technology", "basic science", "computer studies", "computer science", "computer studies (ict)"]);
      else if (name === "Pre-vocational Studies") matched = getExisting(["pre-vocational studies", "prevocational studies", "agricultural science", "home economics"]);
      else if (name === "National Value") matched = getExisting(["national value", "civic education", "social studies"]);
      else if (name === "Business Studies") matched = getExisting(["business studies"]);
      else if (name === "Cultural and Creative Art") matched = getExisting(["cultural and creative art", "creative art", "creative arts", "creative arts & crafts"]);
      else if (name === "Speech Development") matched = getExisting(["speech development"]);
      else if (name === "Local Language") matched = getExisting(["local language"]);
      else if (name === "C.R.S") matched = getExisting(["c.r.s", "crs", "christian religious studies", "christian religious knowledge"]);
      else if (name === "History") matched = getExisting(["history"]);

      if (!matched) {
        matched = existingMap.get(name.toLowerCase().trim()) || subjects[index];
      }

      let finalId = `${name.toLowerCase().replace(/\s+/g, '_')}_${index}`;
      if (matched && matched.id && !usedIds.has(matched.id)) {
        finalId = matched.id;
      }
      usedIds.add(finalId);

      if (matched) {
        return {
          id: finalId,
          name: name,
          testScore: matched.testScore,
          examScore: matched.examScore,
          firstTermSummary: matched.firstTermSummary,
          secondTermSummary: matched.secondTermSummary,
          thirdTermSummary: matched.thirdTermSummary,
          position: matched.position,
          isPositionManual: matched.isPositionManual
        };
      } else {
        const mockMockList = [name];
        const generated = generateRandomGrades(mockMockList, activeTerm, sIdx);
        return {
          ...generated[0],
          id: finalId,
          name: name
        };
      }
    }), ...overrideRows];
  } else if (className.startsWith('SS')) {
    let required = SS1_SUBJECTS;
    if (className === 'SS2A' || className === 'SS3A') {
      required = SS_SCIENCE_SUBJECTS;
    } else if (className === 'SS2B' || className === 'SS3B') {
      required = SS_ART_SUBJECTS;
    }

    const existingMap = new Map<string, SubjectGrade>();
    (subjects || []).forEach(s => {
      existingMap.set(s.name.toLowerCase().trim(), s);
    });

    const getExisting = (aliases: string[]): SubjectGrade | undefined => {
      for (const alias of aliases) {
        const found = existingMap.get(alias.toLowerCase().trim());
        if (found) return found;
      }
      return undefined;
    };

    return [...required.map((name, index) => {
      let matched: SubjectGrade | undefined = undefined;
      if (name === "Mathematics") matched = getExisting(["mathematics", "maths"]);
      else if (name === "Further Mathematics") matched = getExisting(["further mathematics", "further maths", "further mathematics/mathematics"]);
      else if (name === "English Studies") matched = getExisting(["english studies", "english language", "english"]);
      else if (name === "Literature In English" || name === "Literature in English") matched = getExisting(["literature in english", "literature", "lit in eng", "lit in english"]);
      else if (name === "Biology") matched = getExisting(["biology"]);
      else if (name === "Physics") matched = getExisting(["physics"]);
      else if (name === "Chemistry") matched = getExisting(["chemistry"]);
      else if (name === "Geography") matched = getExisting(["geography"]);
      else if (name === "Agriculture Science" || name === "Agricultural Science") matched = getExisting(["agriculture science", "agricultural science", "agriculture", "agric"]);
      else if (name === "Christian religious studies" || name === "C.R.S." || name === "C.R.S") matched = getExisting(["christian religious studies", "christian religious knowledge", "c.r.s", "crs", "crk", "religion value", "c.r.s."]);
      else if (name === "Commerce") matched = getExisting(["commerce"]);
      else if (name === "Marketing") matched = getExisting(["marketing"]);
      else if (name === "Civic Education") matched = getExisting(["civic education", "civic"]);
      else if (name === "Economics") matched = getExisting(["economics"]);
      else if (name === "Government") matched = getExisting(["government", "govt"]);
      else if (name === "Speech Development") matched = getExisting(["speech development", "speech"]);
      else if (name === "Financial Accounting") matched = getExisting(["financial accounting", "accounting", "accounts"]);
      else if (name === "Data Processing") matched = getExisting(["data processing", "computer science", "computer studies", "ict", "information technology"]);

      if (!matched) {
        matched = existingMap.get(name.toLowerCase().trim()) || subjects[index];
      }

      let finalId = `${name.toLowerCase().replace(/\s+/g, '_')}_${index}`;
      if (matched && matched.id && !usedIds.has(matched.id)) {
        finalId = matched.id;
      }
      usedIds.add(finalId);

      if (matched) {
        return {
          id: finalId,
          name: name,
          testScore: matched.testScore,
          examScore: matched.examScore,
          firstTermSummary: matched.firstTermSummary,
          secondTermSummary: matched.secondTermSummary,
          thirdTermSummary: matched.thirdTermSummary,
          position: matched.position,
          isPositionManual: matched.isPositionManual
        };
      } else {
        const mockMockList = [name];
        const generated = generateRandomGrades(mockMockList, activeTerm, sIdx);
        return {
          ...generated[0],
          id: finalId,
          name: name
        };
      }
    }), ...overrideRows];
  }
  
  return [...subjects.filter(s => s.name && s.name.startsWith('__')), ...subjects.filter(s => !(s.name && s.name.startsWith('__')))];
}

const FIRST_NAMES = ["Tobi", "Chinedu", "Amina", "Divine", "Emeka", "Zainab", "Olumide", "Favor", "Bassey", "Somtochukwu", "Eseoghene", "Fatima", "Chibuike", "Tega", "Kelechi", "Olamide", "Ejiro", "Blessing", "Samuel", "Tunde", "Uche", "Nkechi", "Seyi", "Funke", "Chidi", "Yinka", "Ifeoma", "Yusuf", "Ozo", "Efe"];
const LAST_NAMES = ["Alao", "Okafor", "Yusuf", "Nwosu", "Abubakar", "Johnson", "Okoye", "Ekong", "Ani", "Oghenekevwe", "Bello", "Obi", "Akpobome", "Nwachukwu", "Bakare", "Onome", "Sunday", "Kalu", "Ojo", "Balogun", "Ogah", "Ibrahim", "Adeyemi", "Uzoh", "Okonkwo", "Suleiman", "Igwe", "Olawale", "Okoronkwo", "Dada"];

export function getDeterministicPasscode(name: string, className: string, idx: number, term: string): string {
  const str = `${name}_${className}_${idx}_${term}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const num = 100000 + (Math.abs(hash) % 900000);
  return num.toString();
}

export function getStudentPasscodesFromOtherTerms(studentNameOrId: string): string[] {
  if (typeof window === 'undefined') return [];
  const terms = ['first_term', 'second_term', 'third_term'];
  const passcodes: string[] = [];
  const cleanId = studentNameOrId.split('_')[0].toLowerCase().trim();

  terms.forEach(t => {
    try {
      const val = safeStorage.getItem(`ezibeck_students_${t}`);
      if (val) {
        const studentsList: Student[] = JSON.parse(val);
        studentsList.forEach(s => {
          const sCleanId = s.id.split('_')[0].toLowerCase().trim();
          if (s.name.toLowerCase().trim() === cleanId || sCleanId === cleanId) {
            if (s.password) {
              passcodes.push(s.password);
            }
          }
        });
      }
    } catch (e) {
      // ignore
    }
  });
  return passcodes;
}

export function generateUnique6DigitPassword(studentName: string, baseIdOrName: string): string {
  const otherPasscodes = getStudentPasscodesFromOtherTerms(studentName);
  if (baseIdOrName) {
    otherPasscodes.push(...getStudentPasscodesFromOtherTerms(baseIdOrName));
  }
  let attempts = 0;
  while (attempts < 100) {
    const candidate = Math.floor(100000 + Math.random() * 900000).toString();
    if (!otherPasscodes.includes(candidate)) {
      return candidate;
    }
    attempts++;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getDefaultSubjectsForClass(className: ClassName, term?: string, studentIdx?: number): SubjectGrade[] {
  let subjectsList = JSS_SUBJECTS;
  if (className === 'Pre-Nursery') {
    subjectsList = PRE_NURSERY_SUBJECTS;
  } else if (className.startsWith('Nursery')) {
    subjectsList = NURSERY_SUBJECTS;
  } else if (className.startsWith('Basic')) {
    subjectsList = PRIMARY_SUBJECTS;
  } else if (className === 'SS1') {
    subjectsList = SS1_SUBJECTS;
  } else if (className === 'SS2A' || className === 'SS3A') {
    subjectsList = SS_SCIENCE_SUBJECTS;
  } else if (className === 'SS2B' || className === 'SS3B') {
    subjectsList = SS_ART_SUBJECTS;
  } else if (className.startsWith('SS')) {
    subjectsList = SS_SUBJECTS;
  }
  return generateRandomGrades(subjectsList, term, studentIdx);
}

export function createStudent(name: string, className: ClassName, idx: number, term?: string): Student {
  const activeTerm = term || 'Third Term';
  
  let age = 15;
  if (className === 'Pre-Nursery') {
    age = 2;
  } else if (className.startsWith('Nursery')) {
    if (className === 'Nursery 1') age = 3;
    else if (className === 'Nursery 2') age = 4;
    else age = 5;
  } else if (className.startsWith('Basic')) {
    const num = parseInt(className.replace('Basic ', ''));
    age = 5 + (isNaN(num) ? 1 : num);
  } else if (className.startsWith('JSS')) {
    age = className === 'JSS1' ? 11 : className === 'JSS2' ? 12 : 13;
  } else {
    age = className === 'SS1' ? 14 : (className === 'SS2A' || className === 'SS2B') ? 15 : 16;
  }
    
  const sex = idx % 2 === 0 ? 'Male' : 'Female';
  
  // Custom teacher comments based on term
  let remarks: string[];
  let principalComments: string[];
  let termDateStr = "2026-07-24";
  let attendancePresentVal = 100 - (idx % 5);
  let attendanceTotalVal = 105;

  if (activeTerm === 'First Term') {
    termDateStr = "2025-12-18";
    attendancePresentVal = 85 - (idx % 6);
    attendanceTotalVal = 90;
    remarks = [
      "A magnificent start to the academic session. Exceptional work!",
      "A highly encouraging first term performance. Continue with this vigor.",
      "Good progress made, though double effort is recommended in core topics.",
      "Satisfactory outcome, though a better focus will yield greater heights.",
      "A fair attempt. More individual study is expected in the coming term."
    ];
    principalComments = [
      "Excellent conduct. Warmest Christmas holiday wishes.",
      "Promising student with good scholastic growth capabilities.",
      "Satisfactory result. Happy holidays to you.",
      "A pass. Requires dedicated preparation before resumption.",
      "Needs comprehensive academic guidance and monitoring."
    ];
  } else if (activeTerm === 'Second Term') {
    termDateStr = "2026-03-27";
    attendancePresentVal = 92 - (idx % 8);
    attendanceTotalVal = 96;
    remarks = [
      "An outstanding second-term run. Truly impressive depth!",
      "Very good academic performance. Keep leading standard marks.",
      "Strong performance in most modules. Improve on science assignments.",
      "Acceptable performance, but you must strive for standard excellence.",
      "Moderate marks. Consistent revision is critical to prevent slips."
    ];
    principalComments = [
      "Scholarly work. Exceptional leadership in class.",
      "Wonderful behavioral qualities. Continue to shine.",
      "Good progress. Keep the focus clear for the final lap.",
      "A modest grade sheet. Study hours must be strictly quadrupled.",
      "Academic supervision must be prioritized this break."
    ];
  } else { // Third Term
    termDateStr = "2026-07-24";
    attendancePresentVal = 104 - (idx % 5);
    attendanceTotalVal = 110;
    remarks = [
      "A stellar completion of the academic year. Superb class standard!",
      "Highly commendable year-end results. Promoted in style.",
      "Good terminal performance. Ready for the advanced syllabus challenges.",
      "Satisfactory outcomes. Ensure holiday tasks are perfectly finished.",
      "A simple pass grade. General academic effort required across subjects."
    ];
    principalComments = [
      "Outstanding champion. Promoted to next class with high distinction!",
      "Very polite and diligent student. Promoted.",
      "Solid standard work. Promoted.",
      "Fair grade total. Promoted to next class level on trial.",
      "Promoted with close academic warning. Please monitor closely."
    ];
  }

  const remarkIdx = idx % remarks.length;
  const termSlug = activeTerm.toLowerCase().replace(/\s+/g, '_');

  let formTeacherName = "Mrs. Gladys Alabi";
  if (className === 'Pre-Nursery') formTeacherName = "Mrs. Evelyn Ndu";
  else if (className === 'Nursery 1') formTeacherName = "Mrs. Rose Mary";
  else if (className === 'Nursery 2') formTeacherName = "Mr. Kelvin Joe";
  else if (className === 'Nursery 3') formTeacherName = "Mrs. Mercy Joy";
  else if (className === 'Basic 1') formTeacherName = "Mr. Samuel Adele";
  else if (className === 'Basic 2') formTeacherName = "Mrs. Blessing Praise";
  else if (className === 'Basic 3') formTeacherName = "Mr. Patrick Obi";
  else if (className === 'Basic 4') formTeacherName = "Mrs. Victoria Oge";
  else if (className === 'Basic 5') formTeacherName = "Mr. Emmanuel Eze";
  else if (className === 'Basic 6') formTeacherName = "Mrs. Juliet Ngozi";
  else if (className === 'JSS1') formTeacherName = "Mrs. Gladys Alabi";
  else if (className === 'JSS2') formTeacherName = "Mr. Anthony Okon";
  else if (className === 'JSS3') formTeacherName = "Mrs. Sarah John";
  else if (className === 'SS1') formTeacherName = "Mr. Benson Chidi";
  else if (className === 'SS2A') formTeacherName = "Mrs. Florence Musa";
  else if (className === 'SS2B') formTeacherName = "Mrs. Mabel Rogers";
  else if (className === 'SS3A') formTeacherName = "Mr. David Ibrahim";
  else if (className === 'SS3B') formTeacherName = "Mr. Julius Spare";

  return {
    id: `EZB-${className}-${101 + idx}_${termSlug}`,
    name,
    age,
    sex,
    className,
    termDate: termDateStr,
    session: "2025/2026",
    attendancePresent: attendancePresentVal,
    attendanceTotal: attendanceTotalVal,
    subjects: getDefaultSubjectsForClass(className, activeTerm, idx),
    behaviour: generateDefaultBehaviour(className),
    formTeacherRemark: remarks[remarkIdx],
    formTeacherName,
    principalName: "Dr. Ezekiel Beck",
    resumptionDate: activeTerm === 'First Term' ? "2026-01-08" : activeTerm === 'Second Term' ? "2026-04-20" : "2026-09-14",
    password: getDeterministicPasscode(name, className, idx, activeTerm),
    passwordUseCount: 0,
    principalRemark: principalComments[remarkIdx]
  };
}

export function isStudentInTerm(studentId: string, termName: string): boolean {
  const termSlug = termName.toLowerCase().replace(/\s+/g, '_');
  if (studentId.includes('_first_term') || studentId.includes('_second_term') || studentId.includes('_third_term')) {
    return studentId.endsWith(`_${termSlug}`);
  }
  // Default legacy / no-suffix students belong to Third Term
  return termSlug === 'third_term';
}

export function getInitialStudents(term?: string): Student[] {
  const activeTerm = term || 'Third Term';
  const classes: ClassName[] = ['Pre-Nursery', 'Nursery 1', 'Nursery 2', 'Nursery 3', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2A', 'SS2B', 'SS3A', 'SS3B'];
  let students: Student[] = [];

  // Generate 4 students per class
  classes.forEach(cls => {
    for (let i = 0; i < 4; i++) {
      const nameIndex = (classes.indexOf(cls) * 4 + i) % FIRST_NAMES.length;
      const name = `${FIRST_NAMES[nameIndex]} ${LAST_NAMES[(nameIndex + i) % LAST_NAMES.length]}`;
      students.push(createStudent(name, cls, i, activeTerm));
    }
  });

  // Calculate ranks across each class
  classes.forEach(cls => {
    students = calculateClassPositions(students, cls, activeTerm);
  });

  return students;
}

export function loadStoredStudents(term?: string): Student[] {
  const activeTerm = term || 'Third Term';
  if (typeof window === 'undefined') return getInitialStudents(activeTerm);
  const termKey = `ezibeck_students_${activeTerm.toLowerCase().replace(/\s+/g, '_')}`;
  try {
    const val = safeStorage.getItem(termKey);
    if (val) {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        const migrated = parsed.map((std, idx) => {
          let subjects = std.subjects || [];
          if (subjects.length === 0) {
            subjects = getDefaultSubjectsForClass(std.className, activeTerm, idx);
          }
          return {
            ...std,
            subjects: adjustSubjectsIfRequired(subjects, std.className, activeTerm, idx),
            behaviour: adjustBehaviourIfRequired(std.behaviour, std.className)
          };
        });
        saveStudents(migrated, activeTerm);
        return migrated;
      }
    }
    // Fallback: migrate from legacy key if available, so they don't lose progress
    const legacyVal = safeStorage.getItem('ezibeck_students');
    if (legacyVal && activeTerm === 'Third Term') {
      const parsed = JSON.parse(legacyVal);
      if (Array.isArray(parsed)) {
        const migrated = parsed.map((std, idx) => {
          let subjects = std.subjects || [];
          if (subjects.length === 0) {
            subjects = getDefaultSubjectsForClass(std.className, activeTerm, idx);
          }
          return {
            ...std,
            subjects: adjustSubjectsIfRequired(subjects, std.className, activeTerm, idx),
            behaviour: adjustBehaviourIfRequired(std.behaviour, std.className)
          };
        });
        saveStudents(migrated, activeTerm);
        return migrated;
      }
    }
  } catch (e) {
    console.error(`Error loading students for ${activeTerm} from localStorage`, e);
  }
  const students = getInitialStudents(activeTerm);
  saveStudents(students, activeTerm);
  return students;
}

export function saveStudents(students: Student[], term?: string) {
  if (typeof window === 'undefined') return;
  const activeTerm = term || 'Third Term';
  const termKey = `ezibeck_students_${activeTerm.toLowerCase().replace(/\s+/g, '_')}`;
  try {
    safeStorage.setItem(termKey, JSON.stringify(students));
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
