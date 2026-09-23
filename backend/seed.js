const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const User = require('./models/User');
const Subject = require('./models/Subject');
const Question = require('./models/Question');
const Exam = require('./models/Exam');
const Result = require('./models/Result');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Preparing fresh seeds...');

    // Clear existing collections
    await User.deleteMany();
    await Subject.deleteMany();
    await Question.deleteMany();
    await Exam.deleteMany();
    await Result.deleteMany();
    console.log('[Seed] Prior collections cleaned.');

    // 1. Create Users
    console.log('[Seed] Creating Administrator and Candidate accounts...');
    const adminUser = await User.create({
      name: 'Prof. Sarfraj Sharma',
      email: 'admin@exam.com',
      password: 'Admin@123',
      role: 'admin',
      enrolmentNo: 'ADMIN-001',
      course: 'Administration',
      semester: 1,
      isApproved: true,
    });

    const studentRishu = await User.create({
      name: 'Rishu Jha',
      email: 'rishu@student.com',
      password: 'Student@123',
      role: 'student',
      enrolmentNo: '2400042128',
      course: 'BCA',
      semester: 6,
      isApproved: true,
    });

    const studentAarav = await User.create({
      name: 'Aarav Verma',
      email: 'aarav@student.com',
      password: 'Student@123',
      role: 'student',
      enrolmentNo: '2400042129',
      course: 'BCA',
      semester: 6,
      isApproved: true,
    });

    const studentPriya = await User.create({
      name: 'Priya Sharma',
      email: 'priya@student.com',
      password: 'Student@123',
      role: 'student',
      enrolmentNo: '2400042130',
      course: 'MCA',
      semester: null, // Unassigned pending admin approval
      isApproved: false, // Pending approval test case
    });

    // 2. Create Subjects
    console.log('[Seed] Creating Academic Subjects...');
    const subCN = await Subject.create({
      name: 'Computer Networks',
      description: 'Covers the 7-layer OSI Model, TCP/IP protocol suite, subnetting, switching, and routing protocols.',
    });

    const subJava = await Subject.create({
      name: 'Java Programming',
      description: 'Object-Oriented Programming principles, JVM memory management, Multithreading, and Collections Framework.',
    });

    const subDBMS = await Subject.create({
      name: 'Database Management Systems',
      description: 'Relational database design, Normalization (1NF-BCNF), ACID properties, and SQL query execution.',
    });

    // 3. Create Questions for each subject
    console.log('[Seed] Populating Question Bank with 15 verified MCQs...');
    const questionsData = [
      // Computer Networks (5 MCQs)
      {
        subjectId: subCN._id,
        questionText: 'Which layer of the OSI model is responsible for reliable process-to-process delivery of messages?',
        options: ['Network Layer', 'Transport Layer', 'Data Link Layer', 'Session Layer'],
        correctOption: 1,
        marks: 1,
        difficulty: 'easy',
      },
      {
        subjectId: subCN._id,
        questionText: 'What is the default subnet mask for a Class C IPv4 address network?',
        options: ['255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.255'],
        correctOption: 2,
        marks: 1,
        difficulty: 'easy',
      },
      {
        subjectId: subCN._id,
        questionText: 'Which protocol operates at the Application Layer to resolve domain names to IP addresses?',
        options: ['ARP', 'DHCP', 'DNS', 'ICMP'],
        correctOption: 2,
        marks: 1,
        difficulty: 'medium',
      },
      {
        subjectId: subCN._id,
        questionText: 'Which protocol is connectionless and does not guarantee reliable delivery or packet ordering?',
        options: ['TCP', 'UDP', 'SCTP', 'FTP'],
        correctOption: 1,
        marks: 2,
        difficulty: 'medium',
      },
      {
        subjectId: subCN._id,
        questionText: 'In Dijkstra shortest-path algorithm, which data structure is typically used to achieve optimal time complexity?',
        options: ['Stack', 'Min-Heap / Priority Queue', 'Circular Queue', 'Hash Map'],
        correctOption: 1,
        marks: 2,
        difficulty: 'hard',
      },

      // Java Programming (5 MCQs)
      {
        subjectId: subJava._id,
        questionText: 'Which keyword in Java is used to prevent method overriding in derived classes?',
        options: ['static', 'abstract', 'final', 'const'],
        correctOption: 2,
        marks: 1,
        difficulty: 'easy',
      },
      {
        subjectId: subJava._id,
        questionText: 'Which Java memory area stores runtime objects and JRE classes created using the "new" operator?',
        options: ['Stack Memory', 'Heap Memory', 'Program Counter Register', 'Native Method Stack'],
        correctOption: 1,
        marks: 1,
        difficulty: 'easy',
      },
      {
        subjectId: subJava._id,
        questionText: 'Which interface is the root of the Java Collections Framework hierarchy for List, Set, and Queue?',
        options: ['Map', 'Collection', 'Iterable', 'Iterator'],
        correctOption: 1,
        marks: 1,
        difficulty: 'medium',
      },
      {
        subjectId: subJava._id,
        questionText: 'What is the outcome of compiling and running a Java class with two public classes in the same source file?',
        options: [
          'Compiles and runs normally',
          'Compilation error: only one public class allowed per file',
          'Runtime NullPointerException',
          'JVM ignores the second class',
        ],
        correctOption: 1,
        marks: 2,
        difficulty: 'medium',
      },
      {
        subjectId: subJava._id,
        questionText: 'Which garbage collection algorithm in modern JVM versions partitions the heap into equal-sized regions?',
        options: ['Serial GC', 'Parallel GC', 'G1 (Garbage-First) GC', 'Stop-The-World Collector'],
        correctOption: 2,
        marks: 2,
        difficulty: 'hard',
      },

      // Database Management Systems (5 MCQs)
      {
        subjectId: subDBMS._id,
        questionText: 'Which normal form eliminates partial functional dependencies on candidate keys?',
        options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
        correctOption: 1,
        marks: 1,
        difficulty: 'easy',
      },
      {
        subjectId: subDBMS._id,
        questionText: 'In ACID properties of database transactions, what does the "I" stand for?',
        options: ['Integrity', 'Isolation', 'Inheritance', 'Indexability'],
        correctOption: 1,
        marks: 1,
        difficulty: 'easy',
      },
      {
        subjectId: subDBMS._id,
        questionText: 'Which SQL clause is used to filter group results produced by the GROUP BY clause?',
        options: ['WHERE', 'ORDER BY', 'HAVING', 'FILTER'],
        correctOption: 2,
        marks: 1,
        difficulty: 'medium',
      },
      {
        subjectId: subDBMS._id,
        questionText: 'What type of index is physically stored in the exact same sorted order as the data rows on disk?',
        options: ['Non-Clustered Index', 'Clustered Index', 'Bitmap Index', 'Hash Index'],
        correctOption: 1,
        marks: 2,
        difficulty: 'medium',
      },
      {
        subjectId: subDBMS._id,
        questionText: 'Which concurrency control protocol prevents cascading rollbacks and guarantees serializability via read/write locks?',
        options: ['Timestamp Ordering', 'Strict Two-Phase Locking (Strict 2PL)', 'Optimistic Concurrency Control', 'Multiversion Snapshot'],
        correctOption: 1,
        marks: 2,
        difficulty: 'hard',
      },
    ];

    const insertedQuestions = await Question.insertMany(questionsData);
    console.log(`[Seed] ${insertedQuestions.length} Questions inserted successfully.`);

    // 4. Create Configured Exams
    console.log('[Seed] Scheduling test examinations...');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoDaysLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const fiveDaysLater = new Date(now.getTime() + 120 * 60 * 60 * 1000);

    // Exam 1: Live Now Computer Networks Exam
    const cnQuestions = insertedQuestions.filter((q) => q.subjectId.toString() === subCN._id.toString());
    const cnTotalMarks = cnQuestions.reduce((s, q) => s + q.marks, 0);

    const exam1 = await Exam.create({
      title: 'BCA-601: Computer Networks Final Assessment',
      subjectId: subCN._id,
      questionIds: cnQuestions.map((q) => q._id),
      duration: 30, // 30 minutes
      totalMarks: cnTotalMarks,
      passingPercentage: 40,
      startTime: oneHourAgo,
      endTime: twoDaysLater,
      eligibility: {
        targetCourse: 'BCA',
        targetSemester: '6',
        accessType: 'open',
        passcode: '',
      },
      createdBy: adminUser._id,
      isActive: true,
    });

    // Exam 2: Live Now Java Quiz with Passcode
    const javaQuestions = insertedQuestions.filter((q) => q.subjectId.toString() === subJava._id.toString());
    const javaTotalMarks = javaQuestions.reduce((s, q) => s + q.marks, 0);

    const exam2 = await Exam.create({
      title: 'BCA-602: Java Core OOP Lab Assessment',
      subjectId: subJava._id,
      questionIds: javaQuestions.map((q) => q._id),
      duration: 20, // 20 minutes
      totalMarks: javaTotalMarks,
      passingPercentage: 50,
      startTime: oneHourAgo,
      endTime: twoDaysLater,
      eligibility: {
        targetCourse: 'BCA',
        targetSemester: '6',
        accessType: 'passcode',
        passcode: 'JAVA2026',
      },
      createdBy: adminUser._id,
      isActive: true,
    });

    // Exam 3: Upcoming DBMS Exam
    const dbmsQuestions = insertedQuestions.filter((q) => q.subjectId.toString() === subDBMS._id.toString());
    const dbmsTotalMarks = dbmsQuestions.reduce((s, q) => s + q.marks, 0);

    const exam3 = await Exam.create({
      title: 'BCA-603: Database Management Systems Mid-Term',
      subjectId: subDBMS._id,
      questionIds: dbmsQuestions.map((q) => q._id),
      duration: 45,
      totalMarks: dbmsTotalMarks,
      passingPercentage: 40,
      startTime: tomorrow,
      endTime: fiveDaysLater,
      eligibility: {
        targetCourse: 'BCA',
        targetSemester: '6',
        accessType: 'open',
        passcode: '',
      },
      createdBy: adminUser._id,
      isActive: true,
    });

    // 5. Seed 1 Sample Result for student Aarav Verma (for analytics & gradebook preview)
    console.log('[Seed] Creating sample Result for Aarav Verma to demonstrate Analytics...');
    await Result.create({
      studentId: studentAarav._id,
      examId: exam1._id,
      responses: [
        { questionId: cnQuestions[0]._id, selectedOption: 1 }, // Correct (1 mark)
        { questionId: cnQuestions[1]._id, selectedOption: 2 }, // Correct (1 mark)
        { questionId: cnQuestions[2]._id, selectedOption: 2 }, // Correct (1 mark)
        { questionId: cnQuestions[3]._id, selectedOption: 0 }, // Incorrect (0 mark)
        { questionId: cnQuestions[4]._id, selectedOption: 1 }, // Correct (2 marks)
      ],
      score: 5,
      percentage: Number(((5 / cnTotalMarks) * 100).toFixed(2)),
      status: 'pass',
      submittedAt: new Date(now.getTime() - 30 * 60 * 1000),
    });

    console.log('\n=============================================================');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY ON MONGODB ATLAS!');
    console.log('=============================================================');
    console.log('Admin Account:    admin@exam.com       / Admin@123');
    console.log('Student Account:  rishu@student.com     / Student@123  (Enrolment: 2400042128, BCA Sem 6)');
    console.log('Student Account:  aarav@student.com     / Student@123  (Enrolment: 2400042129, BCA Sem 6)');
    console.log('Pending Account:  priya@student.com     / Student@123  (Enrolment: 2400042130, MCA Sem 2)');
    console.log('-------------------------------------------------------------');
    console.log(`Live Exams:       "${exam1.title}" (Open)`);
    console.log(`Live Exams:       "${exam2.title}" (Passcode: JAVA2026)`);
    console.log(`Upcoming Exams:   "${exam3.title}" (Scheduled tomorrow)`);
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
