import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// POST /api/scores  — upsert (prevents duplicates via unique constraint)
router.post('/', async (req, res, next) => {
  try {
    const { studentId, subjectId, examScore, catScore, term, year } = req.body;
    if (!studentId || !subjectId || term === undefined || year === undefined) {
      res.status(400).json({ message: 'studentId, subjectId, term, and year are required' });
      return;
    }

    const exam = parseFloat(examScore ?? 0);
    const cat = parseFloat(catScore ?? 0);

    if (exam < 0 || exam > 70) { res.status(400).json({ message: 'Exam score must be between 0 and 70' }); return; }
    if (cat < 0 || cat > 30) { res.status(400).json({ message: 'CAT score must be between 0 and 30' }); return; }

    const termInt = parseInt(term);
    const yearInt = parseInt(year);

    if (termInt < 1 || termInt > 3) { res.status(400).json({ message: 'Term must be 1, 2, or 3' }); return; }

    const score = await prisma.score.upsert({
      where: {
        studentId_subjectId_term_year: { studentId, subjectId, term: termInt, year: yearInt },
      },
      create: { studentId, subjectId, examScore: exam, catScore: cat, term: termInt, year: yearInt },
      update: { examScore: exam, catScore: cat },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNo: true } },
        subject: { select: { name: true, code: true } },
      },
    });
    res.status(201).json(score);
  } catch (err) { next(err); }
});

// PUT /api/scores/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { examScore, catScore } = req.body;
    const updates: { examScore?: number; catScore?: number } = {};

    if (examScore !== undefined) {
      const exam = parseFloat(examScore);
      if (exam < 0 || exam > 70) { res.status(400).json({ message: 'Exam score must be between 0 and 70' }); return; }
      updates.examScore = exam;
    }
    if (catScore !== undefined) {
      const cat = parseFloat(catScore);
      if (cat < 0 || cat > 30) { res.status(400).json({ message: 'CAT score must be between 0 and 30' }); return; }
      updates.catScore = cat;
    }

    const score = await prisma.score.update({ where: { id: req.params.id }, data: updates });
    res.json(score);
  } catch (err) { next(err); }
});

// GET /api/scores/student/:studentId?term=&year=
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const { term, year } = req.query;
    const scores = await prisma.score.findMany({
      where: {
        studentId: req.params.studentId,
        ...(term ? { term: parseInt(term as string) } : {}),
        ...(year ? { year: parseInt(year as string) } : {}),
      },
      include: { subject: true },
      orderBy: { subject: { name: 'asc' } },
    });
    res.json(scores);
  } catch (err) { next(err); }
});

// GET /api/scores?studentId=&subjectId=&term=&year=
router.get('/', async (req, res, next) => {
  try {
    const { studentId, subjectId, term, year } = req.query;
    const scores = await prisma.score.findMany({
      where: {
        ...(studentId ? { studentId: studentId as string } : {}),
        ...(subjectId ? { subjectId: subjectId as string } : {}),
        ...(term ? { term: parseInt(term as string) } : {}),
        ...(year ? { year: parseInt(year as string) } : {}),
      },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNo: true } },
        subject: { select: { name: true, code: true } },
      },
      orderBy: [{ student: { firstName: 'asc' } }, { subject: { name: 'asc' } }],
    });
    res.json(scores);
  } catch (err) { next(err); }
});

export { router as scoresRouter };
