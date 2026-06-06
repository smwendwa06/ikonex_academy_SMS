import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { GradingScale } from '@prisma/client';
import { generateStudentReportCard, generateClassReport } from '../lib/pdf';

const router = Router();

function getGradeInfo(total: number, scales: GradingScale[]) {
  return scales.find((s) => total >= s.minScore && total <= s.maxScore)
    ?? { grade: 'E', points: 1, remarks: 'Fail' };
}

// GET /api/reports/student/:studentId?term=&year=
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const { term, year } = req.query;
    if (!term || !year) { res.status(400).json({ message: 'term and year are required' }); return; }

    const termInt = parseInt(term as string);
    const yearInt = parseInt(year as string);

    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      include: { stream: true },
    });
    if (!student) { res.status(404).json({ message: 'Student not found' }); return; }

    const scales = await prisma.gradingScale.findMany({ orderBy: { minScore: 'desc' } });
    const scores = await prisma.score.findMany({
      where: { studentId: req.params.studentId, term: termInt, year: yearInt },
      include: { subject: true },
    });

    const streamStudents = await prisma.student.findMany({ where: { streamId: student.streamId } });
    const allStreamScores = await prisma.score.findMany({
      where: { studentId: { in: streamStudents.map((s) => s.id) }, term: termInt, year: yearInt },
    });

    const studentTotals: Record<string, number> = {};
    streamStudents.forEach((s) => { studentTotals[s.id] = 0; });
    allStreamScores.forEach((sc) => { studentTotals[sc.studentId] = (studentTotals[sc.studentId] ?? 0) + sc.examScore + sc.catScore; });
    const myTotal = studentTotals[req.params.studentId] ?? 0;
    const classPosition = Object.values(studentTotals).sort((a, b) => b - a).indexOf(myTotal) + 1;

    const subjectScores = scores.map((sc) => {
      const total = parseFloat((sc.examScore + sc.catScore).toFixed(2));
      const info = getGradeInfo(total, scales);
      const subjectStreamTotals = allStreamScores
        .filter((s) => s.subjectId === sc.subjectId)
        .map((s) => s.examScore + s.catScore)
        .sort((a, b) => b - a);
      const subjectPosition = subjectStreamTotals.findIndex((t) => t <= total) + 1;
      return { subject: sc.subject, examScore: sc.examScore, catScore: sc.catScore, total, grade: info.grade, points: info.points, remarks: info.remarks, subjectPosition: subjectPosition || 1, outOf: subjectStreamTotals.length };
    }).sort((a, b) => a.subject.name.localeCompare(b.subject.name));

    const totalMarks = parseFloat(scores.reduce((s, sc) => s + sc.examScore + sc.catScore, 0).toFixed(2));
    const average = scores.length > 0 ? parseFloat((totalMarks / scores.length).toFixed(2)) : 0;
    const totalPoints = subjectScores.reduce((s, sc) => s + sc.points, 0);
    const meanPoints = scores.length > 0 ? parseFloat((totalPoints / scores.length).toFixed(2)) : 0;
    const overallInfo = getGradeInfo(average, scales);

    const pdfBuffer = await generateStudentReportCard({
      student: { ...student, stream: student.stream },
      term: termInt, year: yearInt, scores: subjectScores,
      totalMarks, average, grade: overallInfo.grade, remarks: overallInfo.remarks,
      classPosition, totalStudents: streamStudents.length,
      totalSubjects: scores.length, meanPoints,
    });

    const filename = `report-card-${student.admissionNo}-term${termInt}-${yearInt}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

// GET /api/reports/stream/:streamId?term=&year=
router.get('/stream/:streamId', async (req, res, next) => {
  try {
    const { term, year } = req.query;
    if (!term || !year) { res.status(400).json({ message: 'term and year are required' }); return; }

    const termInt = parseInt(term as string);
    const yearInt = parseInt(year as string);

    const stream = await prisma.classStream.findUnique({
      where: { id: req.params.streamId },
      include: { students: { orderBy: { firstName: 'asc' } } },
    });
    if (!stream) { res.status(404).json({ message: 'Stream not found' }); return; }

    const scales = await prisma.gradingScale.findMany({ orderBy: { minScore: 'desc' } });
    const studentIds = stream.students.map((s) => s.id);
    const allScores = await prisma.score.findMany({
      where: { studentId: { in: studentIds }, term: termInt, year: yearInt },
      include: { subject: true },
    });

    const results = stream.students.map((student) => {
      const stuScores = allScores.filter((sc) => sc.studentId === student.id);
      const totalMarks = parseFloat(stuScores.reduce((s, sc) => s + sc.examScore + sc.catScore, 0).toFixed(2));
      const average = stuScores.length > 0 ? parseFloat((totalMarks / stuScores.length).toFixed(2)) : 0;
      const totalPoints = stuScores.reduce((s, sc) => { const info = getGradeInfo(sc.examScore + sc.catScore, scales); return s + info.points; }, 0);
      const meanPoints = stuScores.length > 0 ? parseFloat((totalPoints / stuScores.length).toFixed(2)) : 0;
      const gradeInfo = getGradeInfo(average, scales);
      return { student, totalMarks, average, grade: gradeInfo.grade, remarks: gradeInfo.remarks, totalSubjects: stuScores.length, meanPoints };
    });

    results.sort((a, b) => b.totalMarks - a.totalMarks);
    const rankedResults = results.map((r, i) => ({ ...r, position: i + 1 }));

    const subjectMap = new Map<string, { subject: (typeof allScores)[0]['subject']; totals: number[] }>();
    allScores.forEach((sc) => {
      if (!subjectMap.has(sc.subjectId)) subjectMap.set(sc.subjectId, { subject: sc.subject, totals: [] });
      subjectMap.get(sc.subjectId)!.totals.push(sc.examScore + sc.catScore);
    });
    const subjectPerformance = Array.from(subjectMap.values()).map(({ subject, totals }) => ({
      subject, average: parseFloat((totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(2)),
      highest: parseFloat(Math.max(...totals).toFixed(1)), lowest: parseFloat(Math.min(...totals).toFixed(1)),
      candidatesCount: totals.length,
    })).sort((a, b) => a.subject.name.localeCompare(b.subject.name));

    const pdfBuffer = await generateClassReport({
      stream: { name: stream.name, year: stream.year }, term: termInt, year: yearInt,
      totalStudents: stream.students.length, results: rankedResults, subjectPerformance,
    });

    const filename = `class-report-${stream.name.replace(/\s/g, '-')}-term${termInt}-${yearInt}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

export { router as reportsRouter };
