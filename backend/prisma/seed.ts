import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Grading scales (KCSE-based)
  await prisma.gradingScale.deleteMany();
  const gradingScales = await prisma.gradingScale.createMany({
    data: [
      { minScore: 75, maxScore: 100, grade: 'A',  points: 12, remarks: 'Excellent' },
      { minScore: 70, maxScore: 74,  grade: 'A-', points: 11, remarks: 'Very Good' },
      { minScore: 65, maxScore: 69,  grade: 'B+', points: 10, remarks: 'Good' },
      { minScore: 60, maxScore: 64,  grade: 'B',  points: 9,  remarks: 'Good' },
      { minScore: 55, maxScore: 59,  grade: 'B-', points: 8,  remarks: 'Fairly Good' },
      { minScore: 50, maxScore: 54,  grade: 'C+', points: 7,  remarks: 'Average' },
      { minScore: 45, maxScore: 49,  grade: 'C',  points: 6,  remarks: 'Average' },
      { minScore: 40, maxScore: 44,  grade: 'C-', points: 5,  remarks: 'Below Average' },
      { minScore: 35, maxScore: 39,  grade: 'D+', points: 4,  remarks: 'Below Average' },
      { minScore: 30, maxScore: 34,  grade: 'D',  points: 3,  remarks: 'Weak' },
      { minScore: 25, maxScore: 29,  grade: 'D-', points: 2,  remarks: 'Very Weak' },
      { minScore: 0,  maxScore: 24,  grade: 'E',  points: 1,  remarks: 'Fail' },
    ],
  });
  console.log(`✓ Created ${gradingScales.count} grading scales`);

  // Class streams
  await prisma.classStream.deleteMany();
  const form1A = await prisma.classStream.create({ data: { name: 'Form 1A', year: 2024 } });
  const form1B = await prisma.classStream.create({ data: { name: 'Form 1B', year: 2024 } });
  const form2A = await prisma.classStream.create({ data: { name: 'Form 2A', year: 2024 } });
  console.log('✓ Created 3 class streams');

  // Subjects
  await prisma.subject.deleteMany();
  const subjects = await Promise.all([
    prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH' } }),
    prisma.subject.create({ data: { name: 'English', code: 'ENG' } }),
    prisma.subject.create({ data: { name: 'Kiswahili', code: 'KSW' } }),
    prisma.subject.create({ data: { name: 'Physics', code: 'PHY' } }),
    prisma.subject.create({ data: { name: 'Chemistry', code: 'CHEM' } }),
    prisma.subject.create({ data: { name: 'Biology', code: 'BIO' } }),
    prisma.subject.create({ data: { name: 'History', code: 'HIST' } }),
    prisma.subject.create({ data: { name: 'Geography', code: 'GEO' } }),
  ]);
  console.log(`✓ Created ${subjects.length} subjects`);

  // Assign subjects to streams
  await prisma.streamSubject.deleteMany();
  const streamSubjectData = [form1A, form1B, form2A].flatMap(stream =>
    subjects.map(subject => ({ streamId: stream.id, subjectId: subject.id }))
  );
  await prisma.streamSubject.createMany({ data: streamSubjectData });
  console.log('✓ Assigned subjects to streams');

  // Students for Form 1A
  await prisma.student.deleteMany();
  const form1AStudents = [
    { firstName: 'Amina', lastName: 'Odhiambo', admissionNo: 'IKA001', gender: 'Female', dob: new Date('2009-03-12'), streamId: form1A.id },
    { firstName: 'Brian', lastName: 'Kariuki', admissionNo: 'IKA002', gender: 'Male', dob: new Date('2009-07-22'), streamId: form1A.id },
    { firstName: 'Catherine', lastName: 'Wanjiku', admissionNo: 'IKA003', gender: 'Female', dob: new Date('2008-11-05'), streamId: form1A.id },
    { firstName: 'David', lastName: 'Otieno', admissionNo: 'IKA004', gender: 'Male', dob: new Date('2009-01-30'), streamId: form1A.id },
    { firstName: 'Esther', lastName: 'Muthoni', admissionNo: 'IKA005', gender: 'Female', dob: new Date('2009-05-18'), streamId: form1A.id },
  ];
  const form1BStudents = [
    { firstName: 'Faith', lastName: 'Akinyi', admissionNo: 'IKA006', gender: 'Female', dob: new Date('2009-02-14'), streamId: form1B.id },
    { firstName: 'George', lastName: 'Kamau', admissionNo: 'IKA007', gender: 'Male', dob: new Date('2008-09-08'), streamId: form1B.id },
    { firstName: 'Hannah', lastName: 'Njeri', admissionNo: 'IKA008', gender: 'Female', dob: new Date('2009-04-25'), streamId: form1B.id },
  ];
  const form2AStudents = [
    { firstName: 'Ivan', lastName: 'Mwangi', admissionNo: 'IKA009', gender: 'Male', dob: new Date('2008-06-10'), streamId: form2A.id },
    { firstName: 'Janet', lastName: 'Chebet', admissionNo: 'IKA010', gender: 'Female', dob: new Date('2008-12-03'), streamId: form2A.id },
  ];
  const allStudents = await prisma.student.createMany({
    data: [...form1AStudents, ...form1BStudents, ...form2AStudents],
  });
  console.log(`✓ Created ${allStudents.count} students`);

  // Seed scores for Form 1A (Term 1, 2024)
  const createdStudents = await prisma.student.findMany({ where: { streamId: form1A.id } });
  const scoreData = createdStudents.flatMap(student =>
    subjects.slice(0, 6).map(subject => ({
      studentId: student.id,
      subjectId: subject.id,
      examScore: parseFloat((Math.random() * 50 + 20).toFixed(1)),
      catScore: parseFloat((Math.random() * 25 + 5).toFixed(1)),
      term: 1,
      year: 2024,
    }))
  );
  await prisma.score.createMany({ data: scoreData });
  console.log(`✓ Created ${scoreData.length} scores`);

  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
