import PDFDocument from 'pdfkit';

const PRIMARY = '#1e3a5f';
const ACCENT = '#2563eb';
const LIGHT_BG = '#f8fafc';
const BORDER = '#e2e8f0';
const TEXT_DARK = '#1e293b';
const TEXT_MUTED = '#64748b';

interface SubjectScore {
  subject: { name: string; code: string };
  examScore: number;
  catScore: number;
  total: number;
  grade: string;
  points: number;
  remarks: string;
  subjectPosition: number;
  outOf: number;
}

interface StudentResultData {
  student: {
    firstName: string;
    lastName: string;
    admissionNo: string;
    gender: string;
    dob: Date;
    stream: { name: string; year: number };
  };
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

interface ClassResultStudent {
  student: { firstName: string; lastName: string; admissionNo: string };
  totalMarks: number;
  average: number;
  grade: string;
  meanPoints: number;
  position: number;
}

interface ClassResultData {
  stream: { name: string; year: number };
  term: number;
  year: number;
  totalStudents: number;
  results: ClassResultStudent[];
  subjectPerformance: {
    subject: { name: string; code: string };
    average: number;
    highest: number;
    lowest: number;
    candidatesCount: number;
  }[];
}

function drawHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string): void {
  doc.rect(0, 0, doc.page.width, 90).fill(PRIMARY);

  doc.fillColor('white')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('IKONEX ACADEMY', 40, 18, { align: 'center' });

  doc.fontSize(11)
    .font('Helvetica')
    .text('P.O. Box 1234, Nairobi, Kenya | Tel: +254 700 000 000', 40, 44, { align: 'center' });

  doc.fontSize(13)
    .font('Helvetica-Bold')
    .text(title, 40, 62, { align: 'center' });

  doc.fontSize(10)
    .font('Helvetica')
    .text(subtitle, 40, 78, { align: 'center' });

  doc.fillColor(TEXT_DARK);
}

function drawInfoRow(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width = 240): void {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_MUTED).text(label, x, y);
  doc.font('Helvetica').fontSize(10).fillColor(TEXT_DARK).text(value, x, y + 12, { width });
}

export function generateStudentReportCard(data: StudentResultData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const termNames = ['', 'Term 1', 'Term 2', 'Term 3'];
    drawHeader(
      doc,
      'STUDENT REPORT CARD',
      `${termNames[data.term]} — ${data.year}`
    );

    // Student info panel
    const infoY = 106;
    doc.rect(40, infoY, doc.page.width - 80, 80).fill(LIGHT_BG).stroke(BORDER);
    doc.fillColor(TEXT_DARK);

    const fullName = `${data.student.firstName} ${data.student.lastName}`;
    drawInfoRow(doc, 'STUDENT NAME', fullName, 52, infoY + 8, 200);
    drawInfoRow(doc, 'ADMISSION NO.', data.student.admissionNo, 52, infoY + 42, 200);
    drawInfoRow(doc, 'CLASS / STREAM', data.student.stream.name, 240, infoY + 8, 160);
    drawInfoRow(doc, 'GENDER', data.student.gender, 240, infoY + 42, 160);
    drawInfoRow(doc, 'ACADEMIC YEAR', String(data.year), 400, infoY + 8, 120);
    const dob = new Date(data.student.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    drawInfoRow(doc, 'DATE OF BIRTH', dob, 400, infoY + 42, 120);

    // Scores table header
    const tableY = 202;
    const cols = { subject: 52, code: 190, exam: 240, cat: 285, total: 330, grade: 375, points: 415, position: 455, remarks: 495 };
    const tableWidth = doc.page.width - 80;

    doc.rect(40, tableY, tableWidth, 20).fill(PRIMARY);
    doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
    doc.text('SUBJECT', cols.subject, tableY + 6);
    doc.text('CODE', cols.code, tableY + 6);
    doc.text('EXAM/70', cols.exam, tableY + 6, { width: 44, align: 'center' });
    doc.text('CAT/30', cols.cat, tableY + 6, { width: 44, align: 'center' });
    doc.text('TOTAL', cols.total, tableY + 6, { width: 44, align: 'center' });
    doc.text('GRADE', cols.grade, tableY + 6, { width: 38, align: 'center' });
    doc.text('PTS', cols.points, tableY + 6, { width: 38, align: 'center' });
    doc.text('POS', cols.position, tableY + 6, { width: 38, align: 'center' });
    doc.text('REMARKS', cols.remarks, tableY + 6);

    let rowY = tableY + 20;
    data.scores.forEach((s, i) => {
      const bg = i % 2 === 0 ? 'white' : LIGHT_BG;
      doc.rect(40, rowY, tableWidth, 18).fill(bg);
      doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica');

      doc.text(s.subject.name, cols.subject, rowY + 5, { width: 135 });
      doc.text(s.subject.code, cols.code, rowY + 5, { width: 46, align: 'center' });
      doc.text(s.examScore.toFixed(1), cols.exam, rowY + 5, { width: 44, align: 'center' });
      doc.text(s.catScore.toFixed(1), cols.cat, rowY + 5, { width: 44, align: 'center' });
      doc.text(s.total.toFixed(1), cols.total, rowY + 5, { width: 44, align: 'center' });

      // Grade badge
      doc.fillColor(getGradeColor(s.grade))
        .font('Helvetica-Bold')
        .text(s.grade, cols.grade, rowY + 5, { width: 38, align: 'center' });

      doc.fillColor(TEXT_DARK).font('Helvetica');
      doc.text(String(s.points), cols.points, rowY + 5, { width: 38, align: 'center' });
      doc.text(`${s.subjectPosition}/${s.outOf}`, cols.position, rowY + 5, { width: 38, align: 'center' });
      doc.text(s.remarks, cols.remarks, rowY + 5, { width: 70 });

      rowY += 18;
    });

    // Border around table
    doc.rect(40, tableY, tableWidth, rowY - tableY).stroke(BORDER);

    // Summary panel
    rowY += 12;
    doc.rect(40, rowY, tableWidth, 60).fill(LIGHT_BG).stroke(BORDER);

    const summaryItems = [
      { label: 'TOTAL MARKS', value: data.totalMarks.toFixed(1) },
      { label: 'AVERAGE SCORE', value: `${data.average.toFixed(2)}%` },
      { label: 'MEAN GRADE', value: data.grade },
      { label: 'MEAN POINTS', value: data.meanPoints.toFixed(2) },
      { label: 'CLASS POSITION', value: `${data.classPosition} / ${data.totalStudents}` },
    ];

    const colWidth = tableWidth / summaryItems.length;
    summaryItems.forEach((item, idx) => {
      const sx = 40 + idx * colWidth;
      doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(8).text(item.label, sx + 8, rowY + 10, { width: colWidth - 16, align: 'center' });
      doc.fillColor(idx === 2 ? getGradeColor(item.value) : ACCENT)
        .font('Helvetica-Bold').fontSize(16)
        .text(item.value, sx + 8, rowY + 24, { width: colWidth - 16, align: 'center' });

      if (idx < summaryItems.length - 1) {
        doc.moveTo(sx + colWidth, rowY + 8).lineTo(sx + colWidth, rowY + 52).stroke(BORDER);
      }
    });

    // Grading key
    rowY += 72;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_DARK).text('GRADING KEY:', 40, rowY);
    rowY += 14;
    const keyItems = ['A (75-100)', 'A- (70-74)', 'B+ (65-69)', 'B (60-64)', 'B- (55-59)', 'C+ (50-54)', 'C (45-49)', 'C- (40-44)', 'D+ (35-39)', 'D (30-34)', 'D- (25-29)', 'E (0-24)'];
    doc.font('Helvetica').fontSize(8).fillColor(TEXT_MUTED).text(keyItems.join('   '), 40, rowY, { width: tableWidth });

    // Footer
    const footerY = doc.page.height - 50;
    doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).stroke(BORDER);
    doc.font('Helvetica').fontSize(8).fillColor(TEXT_MUTED)
      .text(`Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}   |   Ikonex Academy Student Management System`, 40, footerY + 8, { align: 'center' });

    doc.end();
  });
}

export function generateClassReport(data: ClassResultData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const termNames = ['', 'Term 1', 'Term 2', 'Term 3'];
    drawHeader(doc, 'CLASS PERFORMANCE REPORT', `${data.stream.name} — ${termNames[data.term]} ${data.year}`);

    // Summary bar
    const summaryY = 102;
    doc.rect(40, summaryY, doc.page.width - 80, 36).fill(LIGHT_BG).stroke(BORDER);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_MUTED)
      .text(`CLASS: ${data.stream.name}`, 52, summaryY + 8)
      .text(`TOTAL STUDENTS: ${data.totalStudents}`, 180, summaryY + 8)
      .text(`TERM: ${termNames[data.term]}`, 320, summaryY + 8)
      .text(`YEAR: ${data.year}`, 430, summaryY + 8);

    // Rankings table
    const tableY = 150;
    const tW = doc.page.width - 80;
    doc.rect(40, tableY, tW, 20).fill(PRIMARY);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(8);
    doc.text('POS', 52, tableY + 6, { width: 28, align: 'center' });
    doc.text('ADM NO.', 82, tableY + 6, { width: 60 });
    doc.text('STUDENT NAME', 144, tableY + 6, { width: 180 });
    doc.text('TOTAL', 326, tableY + 6, { width: 50, align: 'center' });
    doc.text('AVERAGE', 378, tableY + 6, { width: 55, align: 'center' });
    doc.text('GRADE', 435, tableY + 6, { width: 40, align: 'center' });
    doc.text('POINTS', 477, tableY + 6, { width: 45, align: 'center' });

    let ry = tableY + 20;
    data.results.forEach((r, i) => {
      const bg = i % 2 === 0 ? 'white' : LIGHT_BG;
      doc.rect(40, ry, tW, 18).fill(bg);
      doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(9);

      // Medal for top 3
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${r.position}`;
      doc.text(typeof medal === 'string' && medal.startsWith('�') ? `#${r.position}` : medal, 52, ry + 4, { width: 28, align: 'center' });
      doc.text(r.student.admissionNo, 82, ry + 4, { width: 60 });
      doc.text(`${r.student.firstName} ${r.student.lastName}`, 144, ry + 4, { width: 180 });
      doc.text(r.totalMarks.toFixed(1), 326, ry + 4, { width: 50, align: 'center' });
      doc.text(`${r.average.toFixed(2)}%`, 378, ry + 4, { width: 55, align: 'center' });
      doc.fillColor(getGradeColor(r.grade)).font('Helvetica-Bold')
        .text(r.grade, 435, ry + 4, { width: 40, align: 'center' });
      doc.fillColor(TEXT_DARK).font('Helvetica')
        .text(r.meanPoints.toFixed(2), 477, ry + 4, { width: 45, align: 'center' });

      ry += 18;
    });
    doc.rect(40, tableY, tW, ry - tableY).stroke(BORDER);

    // Subject performance section
    ry += 16;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(TEXT_DARK)
      .text('SUBJECT PERFORMANCE SUMMARY', 40, ry);
    ry += 18;

    doc.rect(40, ry, tW, 18).fill(PRIMARY);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(8);
    doc.text('SUBJECT', 52, ry + 5);
    doc.text('CODE', 210, ry + 5, { width: 50, align: 'center' });
    doc.text('CANDIDATES', 262, ry + 5, { width: 65, align: 'center' });
    doc.text('AVERAGE', 329, ry + 5, { width: 65, align: 'center' });
    doc.text('HIGHEST', 396, ry + 5, { width: 65, align: 'center' });
    doc.text('LOWEST', 463, ry + 5, { width: 55, align: 'center' });

    ry += 18;
    data.subjectPerformance.forEach((sp, i) => {
      const bg = i % 2 === 0 ? 'white' : LIGHT_BG;
      doc.rect(40, ry, tW, 18).fill(bg);
      doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(9);
      doc.text(sp.subject.name, 52, ry + 4, { width: 156 });
      doc.text(sp.subject.code, 210, ry + 4, { width: 50, align: 'center' });
      doc.text(String(sp.candidatesCount), 262, ry + 4, { width: 65, align: 'center' });
      doc.text(`${sp.average.toFixed(2)}%`, 329, ry + 4, { width: 65, align: 'center' });
      doc.text(`${sp.highest.toFixed(1)}`, 396, ry + 4, { width: 65, align: 'center' });
      doc.text(`${sp.lowest.toFixed(1)}`, 463, ry + 4, { width: 55, align: 'center' });
      ry += 18;
    });
    doc.rect(40, ry - data.subjectPerformance.length * 18 - 18, tW, data.subjectPerformance.length * 18 + 18).stroke(BORDER);

    // Footer
    const footerY = doc.page.height - 50;
    doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).stroke(BORDER);
    doc.font('Helvetica').fontSize(8).fillColor(TEXT_MUTED)
      .text(`Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}   |   Ikonex Academy Student Management System`, 40, footerY + 8, { align: 'center' });

    doc.end();
  });
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#16a34a';
  if (grade.startsWith('B')) return '#2563eb';
  if (grade.startsWith('C')) return '#d97706';
  if (grade.startsWith('D')) return '#dc2626';
  return '#6b7280';
}
