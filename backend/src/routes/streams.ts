import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/streams
router.get('/', async (_req, res, next) => {
  try {
    const streams = await prisma.classStream.findMany({
      include: {
        _count: { select: { students: true, streamSubjects: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(streams);
  } catch (err) { next(err); }
});

// POST /api/streams
router.post('/', async (req, res, next) => {
  try {
    const { name, year } = req.body;
    if (!name || !year) {
      res.status(400).json({ message: 'name and year are required' });
      return;
    }
    const stream = await prisma.classStream.create({
      data: { name: String(name).trim(), year: parseInt(year) },
    });
    res.status(201).json(stream);
  } catch (err) { next(err); }
});

// GET /api/streams/:id
router.get('/:id', async (req, res, next) => {
  try {
    const stream = await prisma.classStream.findUnique({
      where: { id: req.params.id },
      include: {
        students: { orderBy: { firstName: 'asc' } },
        streamSubjects: { include: { subject: true } },
        _count: { select: { students: true } },
      },
    });
    if (!stream) { res.status(404).json({ message: 'Stream not found' }); return; }
    res.json(stream);
  } catch (err) { next(err); }
});

// PUT /api/streams/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, year } = req.body;
    const stream = await prisma.classStream.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(year && { year: parseInt(year) }),
      },
    });
    res.json(stream);
  } catch (err) { next(err); }
});

// DELETE /api/streams/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.classStream.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /api/streams/:id/students
router.get('/:id/students', async (req, res, next) => {
  try {
    const students = await prisma.student.findMany({
      where: { streamId: req.params.id },
      orderBy: { firstName: 'asc' },
    });
    res.json(students);
  } catch (err) { next(err); }
});

// GET /api/streams/:id/subjects
router.get('/:id/subjects', async (req, res, next) => {
  try {
    const streamSubjects = await prisma.streamSubject.findMany({
      where: { streamId: req.params.id },
      include: { subject: true },
    });
    res.json(streamSubjects.map((ss) => ({ ...ss.subject, streamSubjectId: ss.id })));
  } catch (err) { next(err); }
});

// POST /api/streams/:id/subjects  — assign a subject
router.post('/:id/subjects', async (req, res, next) => {
  try {
    const { subjectId } = req.body;
    if (!subjectId) { res.status(400).json({ message: 'subjectId required' }); return; }
    const ss = await prisma.streamSubject.create({
      data: { streamId: req.params.id, subjectId },
      include: { subject: true },
    });
    res.status(201).json(ss);
  } catch (err) { next(err); }
});

// DELETE /api/streams/:id/subjects/:subjectId
router.delete('/:id/subjects/:subjectId', async (req, res, next) => {
  try {
    await prisma.streamSubject.deleteMany({
      where: { streamId: req.params.id, subjectId: req.params.subjectId },
    });
    res.status(204).end();
  } catch (err) { next(err); }
});

export { router as streamsRouter };
