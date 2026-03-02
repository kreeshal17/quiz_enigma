/**
 * Seed script — uploads 70 quiz questions to Firestore.
 *
 * 20 Easy   (10 pts, 2 penalty)
 * 20 Medium (20 pts, 4 penalty)
 * 30 Hard   (50 pts, 10 penalty)
 *
 * Run:  npx tsx scripts/seed-questions.ts
 */

import "dotenv/config";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  writeBatch,
  doc,
  getDocs,
} from "firebase/firestore";

/* ── Firebase init ─────────────────────────────────────────── */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ── Types ─────────────────────────────────────────────────── */
interface SeedQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  difficulty: "easy" | "medium" | "hard";
  rewardPoints: number;
  penaltyPoints: number;
  round: 1 | 2;
}

/* ── Points (20 % penalty) ─────────────────────────────────── */
const PTS = {
  easy:   { rewardPoints: 10, penaltyPoints: 2 },
  medium: { rewardPoints: 20, penaltyPoints: 4 },
  hard:   { rewardPoints: 50, penaltyPoints: 10 },
} as const;

/* ================================================================
   EASY — 20 questions  (10 pts / 2 penalty)
   ================================================================ */
const easyQuestions: SeedQuestion[] = [
  {
    question: "What does HTML stand for?",
    options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language", "Hyper Tool Multi Language"],
    answerIndex: 0,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "Which language is used for styling web pages?",
    options: ["HTML", "JQuery", "CSS", "XML"],
    answerIndex: 2,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "What does CSS stand for?",
    options: ["Colorful Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Creative Style Sheets"],
    answerIndex: 1,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "Which HTML tag is used to define an internal style sheet?",
    options: ["<css>", "<style>", "<script>", "<link>"],
    answerIndex: 1,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "Which company developed JavaScript?",
    options: ["Microsoft", "Google", "Netscape", "Apple"],
    answerIndex: 2,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "What is the correct file extension for a Python file?",
    options: [".pt", ".pyt", ".py", ".python"],
    answerIndex: 2,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "Which symbol is used for single-line comments in JavaScript?",
    options: ["//", "/* */", "#", "<!-- -->"],
    answerIndex: 0,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "What does CPU stand for?",
    options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Central Processor Upgrade"],
    answerIndex: 0,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "Which data structure uses FIFO (First In First Out)?",
    options: ["Stack", "Queue", "Array", "Tree"],
    answerIndex: 1,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "What does RAM stand for?",
    options: ["Read Access Memory", "Random Access Memory", "Run Access Memory", "Rapid Access Memory"],
    answerIndex: 1,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "Inside which HTML element do we put JavaScript?",
    options: ["<js>", "<javascript>", "<script>", "<code>"],
    answerIndex: 2,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "What does URL stand for?",
    options: ["Uniform Resource Locator", "Universal Reference Link", "Unified Resource Locator", "Universal Resource Language"],
    answerIndex: 0,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "Which of these is a valid variable name in Python?",
    options: ["2name", "my-var", "_count", "class"],
    answerIndex: 2,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "What does the 'print()' function do in Python?",
    options: ["Reads input", "Outputs text to the console", "Creates a file", "Deletes a variable"],
    answerIndex: 1,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "Which tag is used for the largest heading in HTML?",
    options: ["<h6>", "<heading>", "<head>", "<h1>"],
    answerIndex: 3,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "What is the output of 2 ** 3 in Python?",
    options: ["6", "9", "8", "5"],
    answerIndex: 2,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "Which keyword is used to define a function in JavaScript?",
    options: ["func", "def", "function", "define"],
    answerIndex: 2,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "What does IDE stand for?",
    options: ["Integrated Development Environment", "Internal Data Engine", "Internet Development Environment", "Intelligent Design Editor"],
    answerIndex: 0,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "Which of the following is NOT a programming language?",
    options: ["Python", "Java", "HTML", "C++"],
    answerIndex: 2,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
  {
    question: "What symbol is used for comments in Python?",
    options: ["//", "#", "/* */", "--"],
    answerIndex: 1,
    difficulty: "easy", ...PTS.easy, round: 1,
  },
];

/* ================================================================
   MEDIUM — 20 questions  (20 pts / 4 penalty)
   ================================================================ */
const mediumQuestions: SeedQuestion[] = [
  {
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(n²)", "O(log n)", "O(n log n)"],
    answerIndex: 2,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "Which protocol is used to send emails?",
    options: ["FTP", "HTTP", "SMTP", "SSH"],
    answerIndex: 2,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "In React, which hook is used to manage state in a functional component?",
    options: ["useEffect", "useState", "useRef", "useMemo"],
    answerIndex: 1,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "What is the output of `typeof null` in JavaScript?",
    options: ["'null'", "'undefined'", "'object'", "'boolean'"],
    answerIndex: 2,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "Which sorting algorithm has the best average-case time complexity?",
    options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"],
    answerIndex: 2,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "What is the purpose of a foreign key in a database?",
    options: ["To uniquely identify a row", "To link two tables together", "To encrypt data", "To index a column"],
    answerIndex: 1,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "Which of these is NOT a JavaScript framework?",
    options: ["Angular", "React", "Django", "Vue"],
    answerIndex: 2,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "What does REST stand for in APIs?",
    options: ["Representational State Transfer", "Remote Execution Standard Technology", "Real-time Event Streaming Transfer", "Request-Execute-Send-Terminate"],
    answerIndex: 0,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "Which data structure is used by recursion internally?",
    options: ["Queue", "Array", "Stack", "Linked List"],
    answerIndex: 2,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "What is a closure in JavaScript?",
    options: ["A function bundled with its lexical scope", "A way to close a browser tab", "A type of loop", "A method to end a program"],
    answerIndex: 0,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "What is the difference between '==' and '===' in JavaScript?",
    options: ["'==' checks value only, '===' checks value and type", "They are the same", "'===' checks value only", "'==' is for strings only"],
    answerIndex: 0,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "Which HTTP status code indicates 'Not Found'?",
    options: ["200", "301", "404", "500"],
    answerIndex: 2,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "What does DNS stand for?",
    options: ["Data Network Service", "Domain Name System", "Digital Network Security", "Dynamic Name Server"],
    answerIndex: 1,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "In Git, what does 'git rebase' do?",
    options: ["Deletes a branch", "Reapplies commits on top of another base", "Creates a new repository", "Merges two branches with a merge commit"],
    answerIndex: 1,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "What is the output of `console.log(0.1 + 0.2 === 0.3)` in JavaScript?",
    options: ["true", "false", "undefined", "NaN"],
    answerIndex: 1,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "Which CSS property is used to change the text color?",
    options: ["font-color", "text-color", "color", "foreground-color"],
    answerIndex: 2,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "What is the default port number for HTTP?",
    options: ["21", "443", "80", "8080"],
    answerIndex: 2,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "Which of these is an immutable data type in Python?",
    options: ["List", "Dictionary", "Set", "Tuple"],
    answerIndex: 3,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "What does JSON stand for?",
    options: ["JavaScript Object Notation", "Java Standard Object Naming", "JavaScript Online Networking", "Java Serialized Object Network"],
    answerIndex: 0,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
  {
    question: "Which method is used to add an element to the end of an array in JavaScript?",
    options: ["push()", "append()", "add()", "insert()"],
    answerIndex: 0,
    difficulty: "medium", ...PTS.medium, round: 1,
  },
];

/* ================================================================
   HARD — 30 questions  (50 pts / 10 penalty)  ← ROUND 2
   ================================================================ */
const hardQuestions: SeedQuestion[] = [
  {
    question: "What is the worst-case time complexity of QuickSort?",
    options: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"],
    answerIndex: 2,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "In networking, which layer of the OSI model does TCP operate at?",
    options: ["Network Layer", "Data Link Layer", "Transport Layer", "Application Layer"],
    answerIndex: 2,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is the purpose of the 'virtual' keyword in C++?",
    options: ["To allocate memory dynamically", "To enable runtime polymorphism", "To define constant variables", "To create inline functions"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "Which algorithm is used in public-key cryptography?",
    options: ["AES", "DES", "RSA", "MD5"],
    answerIndex: 2,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is the CAP theorem about in distributed systems?",
    options: ["Cost, Availability, Performance", "Consistency, Availability, Partition Tolerance", "Computing, Architecture, Protocols", "Caching, Analysis, Prediction"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is a race condition in concurrent programming?",
    options: ["When two processes compete for fastest execution", "When output depends on the unpredictable sequence of events", "When a program runs faster than expected", "When a process is terminated prematurely"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "Which design pattern ensures a class has only one instance?",
    options: ["Factory", "Observer", "Singleton", "Strategy"],
    answerIndex: 2,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is the amortized time complexity of inserting into a dynamic array?",
    options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
    answerIndex: 2,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "In databases, what does ACID stand for?",
    options: ["Atomicity, Consistency, Isolation, Durability", "Access, Control, Integrity, Data", "Asynchronous, Computed, Indexed, Distributed", "Aggregated, Cached, Isolated, Durable"],
    answerIndex: 0,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is the difference between a process and a thread?",
    options: ["They are the same thing", "A thread is heavier than a process", "A process has its own memory space; threads share it", "A process runs inside a thread"],
    answerIndex: 2,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "Which graph traversal algorithm uses a priority queue?",
    options: ["BFS", "DFS", "Dijkstra's Algorithm", "Topological Sort"],
    answerIndex: 2,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is 'hoisting' in JavaScript?",
    options: ["Moving declarations to the top of their scope during compilation", "Lifting DOM elements in the page", "Raising errors before execution", "Importing modules at the top of a file"],
    answerIndex: 0,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is the time complexity of finding an element in a balanced BST?",
    options: ["O(n)", "O(n²)", "O(log n)", "O(1)"],
    answerIndex: 2,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What problem does the 'Dining Philosophers' problem illustrate?",
    options: ["Memory leaks", "Deadlock and resource contention", "Sorting efficiency", "Network latency"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "In TypeScript, what is the difference between 'interface' and 'type'?",
    options: ["There is no difference", "Interfaces can be extended/merged; types support unions and intersections", "Types can only define primitives", "Interfaces are only for classes"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is a deadlock in operating systems?",
    options: ["When a process crashes", "When two or more processes wait indefinitely for resources held by each other", "When the CPU overheats", "When memory is full"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is the purpose of the 'volatile' keyword in Java?",
    options: ["Makes a variable constant", "Ensures visibility of changes across threads", "Allocates memory on heap", "Makes a method synchronized"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "Which data structure is best for implementing an LRU cache?",
    options: ["Array + Binary Search", "HashMap + Doubly Linked List", "Stack + Queue", "Binary Heap"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is the output of `(function(){ return typeof arguments; })()` in JavaScript?",
    options: ["'array'", "'object'", "'undefined'", "'function'"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is tail-call optimization?",
    options: ["Optimizing the last element of an array", "Reusing the current stack frame for the last function call in a recursive function", "Caching the return value of the last call", "Sorting from the tail end"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "In SQL, what is the difference between HAVING and WHERE?",
    options: ["They are the same", "WHERE filters rows before grouping; HAVING filters after grouping", "HAVING is faster than WHERE", "WHERE works only with JOINs"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is the space complexity of Merge Sort?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    answerIndex: 2,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is a memory leak?",
    options: ["When memory is physically damaged", "When allocated memory is never freed and accumulates over time", "When too much data is stored in RAM", "When the CPU cache overflows"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "Which of the following is an NP-complete problem?",
    options: ["Binary Search", "Sorting an array", "Travelling Salesman Problem", "Finding the maximum element"],
    answerIndex: 2,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is the event loop in Node.js?",
    options: ["A loop that handles DOM events", "A mechanism that handles asynchronous callbacks by offloading operations and queuing their callbacks", "A for-loop that iterates over events", "A timer that runs every second"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What does the 'yield' keyword do in Python?",
    options: ["Terminates a function", "Pauses a generator function and returns a value", "Imports a module", "Creates a new thread"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is a B-tree primarily used for?",
    options: ["Sorting algorithms", "Database indexing and file systems", "Graph traversal", "String matching"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is the difference between TCP and UDP?",
    options: ["TCP is faster than UDP", "TCP is connection-oriented and reliable; UDP is connectionless and faster", "UDP guarantees delivery; TCP does not", "They are the same protocol"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is a semaphore in operating systems?",
    options: ["A type of CPU register", "A signaling mechanism used to control access to shared resources by multiple processes", "A memory allocation technique", "A type of interrupt"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
  {
    question: "What is the Liskov Substitution Principle?",
    options: ["Objects should have only one responsibility", "Subtypes must be substitutable for their base types without altering correctness", "Depend on abstractions, not concretions", "A class should be open for extension but closed for modification"],
    answerIndex: 1,
    difficulty: "hard", ...PTS.hard, round: 2,
  },
];

/* ── Seed runner ───────────────────────────────────────────── */
async function clearQuestions() {
  const colRef = collection(db, "questions");
  const snap = await getDocs(colRef);
  if (snap.empty) return 0;

  const BATCH_SIZE = 500;
  let batch = writeBatch(db);
  let ops = 0;
  let deleted = 0;

  for (const d of snap.docs) {
    batch.delete(doc(db, "questions", d.id));
    ops++;
    deleted++;
    if (ops === BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
  return deleted;
}

async function seed() {
  const allQuestions: SeedQuestion[] = [
    ...easyQuestions,
    ...mediumQuestions,
    ...hardQuestions,
  ];

  const colRef = collection(db, "questions");

  console.log(
    `\n🚀  Seeding ${allQuestions.length} questions to project "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}"...\n`
  );

  // Clear old questions first
  const deleted = await clearQuestions();
  console.log(`   🗑  Cleared ${deleted} old questions.`);

  const BATCH_SIZE = 500;
  let batch = writeBatch(db);
  let ops = 0;
  let total = 0;

  for (const q of allQuestions) {
    const newDocRef = doc(colRef); // auto-ID
    batch.set(newDocRef, q);
    ops++;
    total++;

    if (ops === BATCH_SIZE) {
      await batch.commit();
      console.log(`   ✔ Committed batch (${total} so far)`);
      batch = writeBatch(db);
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`\n✅  Done! Seeded ${total} questions total.`);
  console.log(
    `   Round 1 — Easy:   ${easyQuestions.length}  (${PTS.easy.rewardPoints} pts / ${PTS.easy.penaltyPoints} penalty)`
  );
  console.log(
    `   Round 1 — Medium: ${mediumQuestions.length}  (${PTS.medium.rewardPoints} pts / ${PTS.medium.penaltyPoints} penalty)`
  );
  console.log(
    `   Round 2 — Hard:   ${hardQuestions.length}  (${PTS.hard.rewardPoints} pts / ${PTS.hard.penaltyPoints} penalty)\n`
  );

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
