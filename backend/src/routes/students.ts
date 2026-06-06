import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/students?stream_id=&search=
router.get('/', async (req, res, next) => {
  try {
    const { stream_id, search } = req.query;
    const students = await prisma.student.findMany({
      where: {
        ...(stream_id ? { streamId: stream_id as string } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search as string, mode: 'insensitive' } },
                { lastName: { contains: search as string, mode: 'insensitive' } },
                { admissionNo: { contains: search as string, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { stream: { select: { id: true, name: true } } },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    res.json(students);
  } catch (err) { next(err); }
});

// POST /api/students
router.post('/', async (req, res, next) => {
  try {
    const { firstName, lastName, admissionNo, gender, dob, streamId } = req.body;
    if (!firstName || !lastName || !admissionNo || !gender || !dob || !streamId) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }
    const student = await prisma.student.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        admissionNo: String(admissionNo).trim(),
        gender: String(gender),
        dob: new Date(dob),
        streamId,
      },
      include: { stream: { select: { id: true, name: true } } },
    });
    res.status(201).json(student);
  } catch (err) { next(err); }
});

// GET /api/students/:id
router.get('/:id', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { stream: true },
    });
    if (!student) { res.status(404).json({ message: 'Student not found' }); return; }
    res.json(student);
  } catch (err) { next(err); }
});

// PUT /api/students/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { firstName, lastName, admissionNo, gender, dob, streamId } = req.body;
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        ...(firstName && { firstName: String(firstName).trim() }),
        ...(lastName && { lastName: String(lastName).trim() }),
        ...(admissionNo && { admissionNo: String(admissionNo).trim() }),
        ...(gender && { gender }),
        ...(dob && { dob: new Date(dob) }),
        ...(streamId && { streamId }),
      },
      include: { stream: { select: { id: true, name: true } } },
    });
    res.json(student);
  } catch (err) { next(err); }
});

// DELETE /api/students/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.student.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export { router as studentsRouter };
