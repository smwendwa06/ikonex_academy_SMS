import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/grading
router.get('/', async (_req, res, next) => {
  try {
    const scales = await prisma.gradingScale.findMany({ orderBy: { minScore: 'desc' } });
    res.json(scales);
  } catch (err) { next(err); }
});

// POST /api/grading
router.post('/', async (req, res, next) => {
  try {
    const { minScore, maxScore, grade, points, remarks } = req.body;
    if (minScore === undefined || maxScore === undefined || !grade || points === undefined || !remarks) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }
    const scale = await prisma.gradingScale.create({
      data: {
        minScore: parseFloat(minScore),
        maxScore: parseFloat(maxScore),
        grade: String(grade).trim(),
        points: parseInt(points),
        remarks: String(remarks).trim(),
      },
    });
    res.status(201).json(scale);
  } catch (err) { next(err); }
});

// PUT /api/grading/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { minScore, maxScore, grade, points, remarks } = req.body;
    const scale = await prisma.gradingScale.update({
      where: { id: req.params.id },
      data: {
        ...(minScore !== undefined && { minScore: parseFloat(minScore) }),
        ...(maxScore !== undefined && { maxScore: parseFloat(maxScore) }),
        ...(grade && { grade: String(grade).trim() }),
        ...(points !== undefined && { points: parseInt(points) }),
        ...(remarks && { remarks: String(remarks).trim() }),
      },
    });
    res.json(scale);
  } catch (err) { next(err); }
});

// DELETE /api/grading/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.gradingScale.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export { router as gradingRouter };
