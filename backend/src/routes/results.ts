import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { GradingScale } from '@prisma/client';

const router = Router();

function getGradeInfo(total: number, scales: GradingScale[]) {
  const scale = scales.find((s) => total >= s.minScore && total <= s.maxScore);
  return scale ?? { grade: 'E', points: 1, remarks: 'Fail' };
}

async function fetchScales() {
  return prisma.gradingScale.findMany({ orderBy: { minScore: 'desc' } });
}

// GET /api/results/student/:studentId?term=&year=
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const { term, year } = req.query;
    if (!term || !year) { res.status(400).json({ message: 'term and year query params required' }); return; }

    const termInt = parseInt(term as string);
    const yearInt = parseInt(year as string);

    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      include: { stream: true },
    });
    if (!student) { res.status(404).json({ message: 'Student not found' }); return; }

    const scales = await fetchScales();

    // This student's scores
    const scores = await prisma.score.findMany({
      where: { studentId: req.params.studentId, term: termInt, year: yearInt },
      include: { subject: true },
    });

    // All students in same stream for position ranking
    const streamStudents = await prisma.student.findMany({ where: { streamId: student.streamId } });
    const streamStudentIds = streamStudents.map((s) => s.id);

    // All scores in the stream for this term/year
    const allStreamScores = await prisma.score.findMany({
      where: { studentId: { in: streamStudentIds }, term: termInt, year: yearInt },
    });

    // Compute totals per student for class position
    const studentTotals: Record<string, number> = {};
    streamStudentIds.forEach((id) => { studentTotals[id] = 0; });
    allStreamScores.forEach((sc) => {
      studentTotals[sc.studentId] = (studentTotals[sc.studentId] ?? 0) + sc.examScore + sc.catScore;
    });

    const sortedTotals = Object.values(studentTotals).sort((a, b) => b - a);
    const myTotal = studentTotals[req.params.studentId] ?? 0;
    const classPosition = sortedTotals.indexOf(myTotal) + 1;

    // Build per-subject scores with positions
    const subjectScores = scores.map((sc) => {
      const total = parseFloat((sc.examScore + sc.catScore).toFixed(2));
      const info = getGradeInfo(total, scales);

      // Subject position within stream
      const subjectStreamScores = allStreamScores
        .filter((s) => s.subjectId === sc.subjectId)
        .map((s) => s.examScore + s.catScore)
        .sort((a, b) => b - a);
      const subjectPosition = subjectStreamScores.findIndex((t) => t <= total) + 1;

      return {
        subject: sc.subject,
        examScore: sc.examScore,
        catScore: sc.catScore,
        total,
        grade: info.grade,
        points: info.points,
        remarks: info.remarks,
        subjectPosition: subjectPosition || 1,
        outOf: subjectStreamScores.length,
      };
    });

    // Sort by subject name
    subjectScores.sort((a, b) => a.subject.name.localeCompare(b.subject.name));

    const totalMarks = parseFloat(scores.reduce((s, sc) => s + sc.examScore + sc.catScore, 0).toFixed(2));
    const average = scores.length > 0 ? parseFloat((totalMarks / scores.length).toFixed(2)) : 0;
    const totalPoints = subjectScores.reduce((s, sc) => s + sc.points, 0);
    const meanPoints = scores.length > 0 ? parseFloat((totalPoints / scores.length).toFixed(2)) : 0;
    const overallInfo = getGradeInfo(average, scales);

    res.json({
      student,
      term: termInt,
      year: yearInt,
      scores: subjectScores,
      totalMarks,
      average,
      grade: overallInfo.grade,
      remarks: overallInfo.remarks,
      classPosition,
      totalStudents: streamStudents.length,
      totalSubjects: scores.length,
      meanPoints,
    });
  } catch (err) { next(err); }
});

// GET /api/results/stream/:streamId?term=&year=
router.get('/stream/:streamId', async (req, res, next) => {
  try {
    const { term, year } = req.query;
    if (!term || !year) { res.status(400).json({ message: 'term and year query params required' }); return; }

    const termInt = parseInt(term as string);
    const yearInt = parseInt(year as string);

    const stream = await prisma.classStream.findUnique({
      where: { id: req.params.streamId },
      include: { students: { orderBy: { firstName: 'asc' } } },
    });
    if (!stream) { res.status(404).json({ message: 'Stream not found' }); return; }

    const scales = await fetchScales();
    const studentIds = stream.students.map((s) => s.id);

    const allScores = await prisma.score.findMany({
      where: { studentId: { in: studentIds }, term: termInt, year: yearInt },
      include: { subject: true },
    });

    // Build per-student results
    const results = stream.students.map((student) => {
      const stuScores = allScores.filter((sc) => sc.studentId === student.id);
      const totalMarks = parseFloat(stuScores.reduce((s, sc) => s + sc.examScore + sc.catScore, 0).toFixed(2));
      const average = stuScores.length > 0 ? parseFloat((totalMarks / stuScores.length).toFixed(2)) : 0;

      const totalPoints = stuScores.reduce((s, sc) => {
        const info = getGradeInfo(sc.examScore + sc.catScore, scales);
        return s + info.points;
      }, 0);
      const meanPoints = stuScores.length > 0 ? parseFloat((totalPoints / stuScores.length).toFixed(2)) : 0;
      const gradeInfo = getGradeInfo(average, scales);

      return { student, totalMarks, average, grade: gradeInfo.grade, remarks: gradeInfo.remarks, totalSubjects: stuScores.length, meanPoints };
    });

    // Rank by total marks descending
    results.sort((a, b) => b.totalMarks - a.totalMarks);
    const rankedResults = results.map((r, i) => ({ ...r, position: i + 1 }));

    // Subject performance summary
    const subjectMap = new Map<string, { subject: (typeof allScores)[0]['subject']; totals: number[] }>();
    allScores.forEach((sc) => {
      if (!subjectMap.has(sc.subjectId)) {
        subjectMap.set(sc.subjectId, { subject: sc.subject, totals: [] });
      }
      subjectMap.get(sc.subjectId)!.totals.push(sc.examScore + sc.catScore);
    });

    const subjectPerformance = Array.from(subjectMap.values()).map(({ subject, totals }) => ({
      subject,
      average: parseFloat((totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(2)),
      highest: parseFloat(Math.max(...totals).toFixed(1)),
      lowest: parseFloat(Math.min(...totals).toFixed(1)),
      candidatesCount: totals.length,
    })).sort((a, b) => a.subject.name.localeCompare(b.subject.name));

    res.json({
      stream,
      term: termInt,
      year: yearInt,
      totalStudents: stream.students.length,
      results: rankedResults,
      subjectPerformance,
    });
  } catch (err) { next(err); }
});

export { router as resultsRouter };
