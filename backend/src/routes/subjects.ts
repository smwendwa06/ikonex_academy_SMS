import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/subjects
router.get('/', async (_req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        _count: { select: { streamSubjects: true, scores: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(subjects);
  } catch (err) { next(err); }
});

// POST /api/subjects
router.post('/', async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      res.status(400).json({ message: 'name and code are required' });
      return;
    }
    const subject = await prisma.subject.create({
      data: { name: String(name).trim(), code: String(code).trim().toUpperCase() },
    });
    res.status(201).json(subject);
  } catch (err) { next(err); }
});

// GET /api/subjects/:id
router.get('/:id', async (req, res, next) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: req.params.id },
      include: {
        streamSubjects: { include: { stream: true } },
        _count: { select: { scores: true } },
      },
    });
    if (!subject) { res.status(404).json({ message: 'Subject not found' }); return; }
    res.json(subject);
  } catch (err) { next(err); }
});

// PUT /api/subjects/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(code && { code: String(code).trim().toUpperCase() }),
      },
    });
    res.json(subject);
  } catch (err) { next(err); }
});

// DELETE /api/subjects/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export { router as subjectsRouter };
