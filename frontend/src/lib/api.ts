import {
  ClassStream, ClassStreamDetail, Student, Subject,
  Score, GradingScale, StudentResult, ClassResult,
} from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message: string }).message ?? 'API error');
  }
  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Streams ──────────────────────────────────────────────────────────────────
export const api = {
  streams: {
    list: () => req<ClassStream[]>('/api/streams'),
    get: (id: string) => req<ClassStreamDetail>(`/api/streams/${id}`),
    create: (data: { name: string; year: number }) =>
      req<ClassStream>('/api/streams', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; year: number }>) =>
      req<ClassStream>(`/api/streams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/api/streams/${id}`, { method: 'DELETE' }),
    subjects: (id: string) => req<Subject[]>(`/api/streams/${id}/subjects`),
    assignSubject: (streamId: string, subjectId: string) =>
      req<unknown>(`/api/streams/${streamId}/subjects`, { method: 'POST', body: JSON.stringify({ subjectId }) }),
    removeSubject: (streamId: string, subjectId: string) =>
      req<void>(`/api/streams/${streamId}/subjects/${subjectId}`, { method: 'DELETE' }),
  },

  // ── Students ──────────────────────────────────────────────────────────────
students: {
    list: (params?: { stream_id?: string; search?: string }) => {
      const cleaned = Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== '')
      );
      const qs = new URLSearchParams(cleaned).toString();
      return req<Student[]>(`/api/students${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => req<Student>(`/api/students/${id}`),
    create: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'stream'>) =>
      req<Student>('/api/students', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'stream'>>) =>
      req<Student>(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/api/students/${id}`, { method: 'DELETE' }),
    scores: (id: string, term?: number, year?: number) => {
      const qs = new URLSearchParams({ ...(term ? { term: String(term) } : {}), ...(year ? { year: String(year) } : {}) }).toString();
      return req<Score[]>(`/api/scores/student/${id}${qs ? `?${qs}` : ''}`);
    },
  },

  // ── Subjects ──────────────────────────────────────────────────────────────
  subjects: {
    list: () => req<Subject[]>('/api/subjects'),
    get: (id: string) => req<Subject>(`/api/subjects/${id}`),
    create: (data: { name: string; code: string }) =>
      req<Subject>('/api/subjects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; code: string }>) =>
      req<Subject>(`/api/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/api/subjects/${id}`, { method: 'DELETE' }),
  },

  // ── Scores ────────────────────────────────────────────────────────────────
  scores: {
    list: (params?: { studentId?: string; subjectId?: string; term?: number; year?: number }) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
      ).toString();
      return req<Score[]>(`/api/scores${qs ? `?${qs}` : ''}`);
    },
    upsert: (data: { studentId: string; subjectId: string; examScore: number; catScore: number; term: number; year: number }) =>
      req<Score>('/api/scores', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { examScore?: number; catScore?: number }) =>
      req<Score>(`/api/scores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // ── Results ───────────────────────────────────────────────────────────────
  results: {
    student: (studentId: string, term: number, year: number) =>
      req<StudentResult>(`/api/results/student/${studentId}?term=${term}&year=${year}`),
    stream: (streamId: string, term: number, year: number) =>
      req<ClassResult>(`/api/results/stream/${streamId}?term=${term}&year=${year}`),
  },

  // ── Reports (PDF download) ────────────────────────────────────────────────
  reports: {
    studentPdf: (studentId: string, term: number, year: number) =>
      `${BASE}/api/reports/student/${studentId}?term=${term}&year=${year}`,
    streamPdf: (streamId: string, term: number, year: number) =>
      `${BASE}/api/reports/stream/${streamId}?term=${term}&year=${year}`,
  },

  // ── Grading ───────────────────────────────────────────────────────────────
  grading: {
    list: () => req<GradingScale[]>('/api/grading'),
    update: (id: string, data: Partial<GradingScale>) =>
      req<GradingScale>(`/api/grading/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
};
