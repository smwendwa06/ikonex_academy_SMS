export interface ClassStream {
  id: string;
  name: string;
  year: number;
  createdAt: string;
  updatedAt: string;
  _count?: { students: number; streamSubjects: number };
}

export interface ClassStreamDetail extends ClassStream {
  students: Student[];
  streamSubjects: { id: string; subject: Subject; streamSubjectId?: string }[];
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  gender: string;
  dob: string;
  streamId: string;
  stream?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  streamSubjectId?: string;
  _count?: { streamSubjects: number; scores: number };
}

export interface Score {
  id: string;
  studentId: string;
  subjectId: string;
  examScore: number;
  catScore: number;
  term: number;
  year: number;
  student?: { firstName: string; lastName: string; admissionNo: string };
  subject?: { name: string; code: string };
}

export interface GradingScale {
  id: string;
  minScore: number;
  maxScore: number;
  grade: string;
  points: number;
  remarks: string;
}

export interface SubjectScore {
  subject: Subject;
  examScore: number;
  catScore: number;
  total: number;
  grade: string;
  points: number;
  remarks: string;
  subjectPosition: number;
  outOf: number;
}

export interface StudentResult {
  student: Student & { stream: ClassStream };
  term: number;
  year: number;
  scores: SubjectScore[];
  totalMarks: number;
  average: number;
  grade: string;
  remarks: string;
  classPosition: number;
  totalStudents: number;
  totalSubjects: number;
  meanPoints: number;
}

export interface ClassStudentResult {
  student: Student;
  totalMarks: number;
  average: number;
  grade: string;
  remarks: string;
  totalSubjects: number;
  meanPoints: number;
  position: number;
}

export interface SubjectPerformance {
  subject: Subject;
  average: number;
  highest: number;
  lowest: number;
  candidatesCount: number;
}

export interface ClassResult {
  stream: ClassStream;
  term: number;
  year: number;
  totalStudents: number;
  results: ClassStudentResult[];
  subjectPerformance: SubjectPerformance[];
}

export interface DashboardStats {
  streams: number;
  students: number;
  subjects: number;
  scores: number;
}

export type GradeColor = 'green' | 'blue' | 'yellow' | 'red' | 'gray';
