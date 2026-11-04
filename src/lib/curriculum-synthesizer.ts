import {
  IntakeInput,
  Phase,
  Session,
  StageAResponse,
  SkillLevel,
} from "@/types/plan";

export interface WeekThemeTemplate {
  theme: string;
  sessions: {
    title: string;
    objective: string;
    concepts: string[];
    queries: string[];
    difficulty?: SkillLevel;
  }[];
}

export interface BlueprintPhaseTemplate {
  title: string;
  goal: string;
  project: {
    title: string;
    brief: string;
    acceptance_criteria: string[];
    stretch: string;
  };
  weekThemes: WeekThemeTemplate[];
}

export interface TopicBlueprint {
  keywords: string[];
  title: string;
  phases: BlueprintPhaseTemplate[];
}

export function capitalizeWords(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function matchesKeyword(text: string, kw: string): boolean {
  const normText = text.toLowerCase();
  const normKw = kw.toLowerCase().trim();
  if (!normKw) return false;
  if (normText.includes(normKw)) return true;
  const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s|\\W)${escaped}(\\W|\\s|$)`, "i").test(normText);
}

/**
 * Extracts high-signal core topic name (e.g., "Spanish", "Acoustic Guitar", "Next.js", "Vue.js")
 * stripping generic educational filler so queries and titles 100% match the user's intent.
 */
export function extractSubjectTerm(goal: string, speciality?: string): string {
  const text = `${goal} ${speciality || ""}`.trim();
  const lower = text.toLowerCase();

  // 1. Language matching
  const languages: Record<string, string> = {
    spanish: "Spanish",
    french: "French",
    german: "German",
    japanese: "Japanese",
    chinese: "Chinese (Mandarin)",
    mandarin: "Chinese (Mandarin)",
    italian: "Italian",
    korean: "Korean",
    portuguese: "Portuguese",
    russian: "Russian",
    arabic: "Arabic",
    dutch: "Dutch",
    swedish: "Swedish",
    norwegian: "Norwegian",
    polish: "Polish",
    greek: "Greek",
    hebrew: "Hebrew",
    turkish: "Turkish",
    hindi: "Hindi",
    vietnamese: "Vietnamese",
    yoruba: "Yoruba",
    swahili: "Swahili",
  };
  for (const [kw, name] of Object.entries(languages)) {
    if (matchesKeyword(lower, kw)) return name;
  }

  // 2. Instrument & Music matching
  const instruments: Record<string, string> = {
    "acoustic guitar": "Acoustic Guitar",
    "electric guitar": "Electric Guitar",
    "classical guitar": "Classical Guitar",
    guitar: "Guitar",
    piano: "Piano",
    keyboard: "Keyboard",
    violin: "Violin",
    drums: "Drums",
    drumming: "Drums",
    bass: "Bass Guitar",
    singing: "Singing & Vocals",
    vocals: "Vocals",
    voice: "Vocal Training",
    ukulele: "Ukulele",
    flute: "Flute",
    saxophone: "Saxophone",
    cello: "Cello",
    ableton: "Ableton Live",
    "fl studio": "FL Studio",
    "music production": "Music Production",
    "music theory": "Music Theory",
  };
  for (const [kw, name] of Object.entries(instruments)) {
    if (matchesKeyword(lower, kw)) return name;
  }

  // 3. Frontend & Framework matching
  const techMap: Record<string, string> = {
    "next.js": "Next.js",
    nextjs: "Next.js",
    "next js": "Next.js",
    react: "React",
    reactjs: "React",
    "vue.js": "Vue.js",
    vuejs: "Vue.js",
    vue: "Vue.js",
    nuxt: "Nuxt.js",
    svelte: "Svelte",
    sveltekit: "SvelteKit",
    angular: "Angular",
    "html css": "HTML & CSS",
    "html and css": "HTML & CSS",
    tailwind: "Tailwind CSS",
    tailwindcss: "Tailwind CSS",
    typescript: "TypeScript",
    javascript: "JavaScript",
    python: "Python",
    rust: "Rust",
    golang: "Go (Golang)",
    docker: "Docker",
    kubernetes: "Kubernetes",
    k8s: "Kubernetes",
    aws: "AWS Cloud",
    terraform: "Terraform",
    figma: "Figma UI/UX",
    "ui/ux": "UI/UX Design",
    "ui ux": "UI/UX Design",
    "product design": "Product Design",
    sql: "SQL & Databases",
    postgresql: "PostgreSQL",
  };
  for (const [kw, name] of Object.entries(techMap)) {
    if (matchesKeyword(lower, kw)) return name;
  }

  // Fallback: clean goal string of generic instructional stopwords
  const cleaned = goal
    .replace(/\b(learn|learning|how to|for beginners|beginner|complete|course|mastery|guide|from scratch|fundamentals|crash course|basics)\b/gi, "")
    .trim();
  return capitalizeWords(cleaned || goal);
}

// ============================================================================
// DOMAIN-SPECIFIC EXPERT CURRICULUM BLUEPRINTS
// ============================================================================

export const TOPIC_BLUEPRINTS: TopicBlueprint[] = [
  // 1. Full-Stack Web Development & Modern Frontend (Next.js, React, TypeScript)
  {
    keywords: [
      "next.js",
      "nextjs",
      "next js",
      "react",
      "react.js",
      "reactjs",
      "web dev",
      "web development",
      "full stack",
      "fullstack",
      "frontend",
      "front-end",
      "javascript",
      "typescript",
      "node",
      "nodejs",
      "node.js",
    ],
    title: "Full-Stack Web Development & Next.js Architecture Mastery",
    phases: [
      {
        title: "Phase 1: Component Architecture, React Internals & Client State",
        goal: "Master modern declarative UI composition, reactive state, custom hooks, and rendering lifecycles.",
        project: {
          title: "Phase 1 Milestone: Interactive Component Library & State Engine",
          brief: "Build a modular, accessible UI dashboard with nested state management, optimistic updates, and custom reactive hooks.",
          acceptance_criteria: [
            "Fully typed TypeScript component hierarchy with zero runtime console errors",
            "State management handles async loading, error boundaries, and debounce flows",
            "Accessible keyboard navigation and WCAG AA color contrast standards verified",
          ],
          stretch: "Add persistent offline state caching with IndexedDB / LocalStorage syncing.",
        },
        weekThemes: [
          {
            theme: "Week 1: Declarative Component Architecture & React Core Model",
            sessions: [
              {
                title: "Modern React Model: Virtual DOM, Fiber & Declarative UI",
                objective: "Grasp how React reconciles state transitions, batches renders, and prevents layout thrashing.",
                concepts: ["Fiber Reconciler", "Virtual DOM", "Declarative UI", "Immutability"],
                queries: ["React Fiber architecture explained", "React reconciliation and virtual DOM deep dive"],
              },
              {
                title: "State Mechanics: useState, useReducer & Event Handlers",
                objective: "Architect robust local state flows and implement reducer patterns for complex state transitions.",
                concepts: ["useState vs useReducer", "State Colocation", "Derived State", "Event Batching"],
                queries: ["React useState and useReducer patterns tutorial", "React state management best practices"],
              },
              {
                title: "Effect Boundaries: Lifecycle, Cleanups & Custom Hooks",
                objective: "Master side-effect management, cleanup subscriptions, and encapsulate reusable logic into custom hooks.",
                concepts: ["useEffect Lifecycle", "AbortController", "Custom Hooks", "Dependency Array Rules"],
                queries: ["React useEffect cleanup and AbortController tutorial", "How to write custom React hooks clean code"],
              },
            ],
          },
          {
            theme: "Week 2: TypeScript for UI, Props Contracts & Form Pipelines",
            sessions: [
              {
                title: "TypeScript Component Contracts & Discriminated Unions",
                objective: "Design strict, bulletproof component prop types using generics and discriminated union variants.",
                concepts: ["Discriminated Unions", "Generic Props", "Component Props With Ref", "Strict Null Checks"],
                queries: ["TypeScript React component props best practices", "TypeScript discriminated unions React tutorial"],
              },
              {
                title: "Controlled vs Uncontrolled Forms & Zod Schema Validation",
                objective: "Build resilient form pipelines with validation schemas, error handling, and performance optimization.",
                concepts: ["React Hook Form", "Zod Validation", "Uncontrolled Inputs", "Form Accessibility"],
                queries: ["React Hook Form and Zod full tutorial", "Building production forms in React with Zod"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 2: Next.js App Router, Server Components & Database Integration",
        goal: "Architect full-stack hybrid applications leveraging Server Components, Server Actions, streaming, and database ORMs.",
        project: {
          title: "Phase 2 Milestone: Production Full-Stack Application with Auth & Database",
          brief: "Deliver a full-stack Next.js web application with PostgreSQL/Prisma, authentication, server mutations, and real-time UI.",
          acceptance_criteria: [
            "Leverages Next.js App Router with Server Components for zero-bundle data fetching",
            "Server Actions handle mutations with input validation and security checks",
            "Relational database integration with migrations, indexing, and connection pooling",
          ],
          stretch: "Implement real-time updates using Server-Sent Events (SSE) or WebSockets.",
        },
        weekThemes: [
          {
            theme: "Week 3: Next.js App Router, Server vs Client Components & Layouts",
            sessions: [
              {
                title: "React Server Components (RSC) vs Client Components",
                objective: "Deconstruct the boundary between server execution and client hydration, minimizing JavaScript bundle size.",
                concepts: ["Server Components", "Client Boundaries", "Hydration", "Bundle Reduction"],
                queries: ["Next.js Server Components vs Client Components explained", "Next.js App Router mental model tutorial"],
              },
              {
                title: "Nested Layouts, Parallel Routes & Intercepting Modals",
                objective: "Build scalable route trees with persistent layouts, loading skeletons, and non-destructive modals.",
                concepts: ["Layout Trees", "Parallel Routes", "Intercepting Routes", "Loading Skeletons"],
                queries: ["Next.js nested layouts and parallel routes tutorial", "Next.js intercepting routes modal walkthrough"],
              },
            ],
          },
          {
            theme: "Week 4: Server Actions, Data Mutations & Security Primitives",
            sessions: [
              {
                title: "Server Actions: Mutations, Form Actions & Optimistic UI",
                objective: "Execute secure backend mutations directly from components without boilerplated API boilerplate.",
                concepts: ["Server Actions", "useOptimistic Hook", "revalidatePath", "CSRF Protection"],
                queries: ["Next.js Server Actions and useOptimistic tutorial", "Next.js data mutations revalidatePath guide"],
              },
              {
                title: "Authentication, Sessions & Protected Middleware",
                objective: "Implement JWT/cookie-based session validation, role-based access control, and edge middleware.",
                concepts: ["Next-Auth / Auth.js", "Edge Middleware", "HTTP-Only Cookies", "RBAC"],
                queries: ["Next.js authentication Auth.js v5 tutorial", "Next.js middleware route protection guide"],
              },
            ],
          },
          {
            theme: "Week 5: Relational Databases, ORM Modeling with Prisma & SQL",
            sessions: [
              {
                title: "Database Modeling: Relations, Foreign Keys & Migrations",
                objective: "Design normalized schema relationships, foreign keys, and indexes in PostgreSQL with Prisma ORM.",
                concepts: ["Relational Schema", "Foreign Keys", "Prisma Migrations", "N+1 Query Prevention"],
                queries: ["Prisma ORM PostgreSQL full course tutorial", "Preventing N+1 queries in Prisma and SQL"],
              },
              {
                title: "Connection Pooling, Transactions & Safe ACID Mutations",
                objective: "Manage database connections under serverless scaling and enforce multi-table transactional integrity.",
                concepts: ["Connection Pooling", "Prisma Transactions", "ACID Invariants", "Database Indexing"],
                queries: ["Serverless database connection pooling explained", "Prisma transactions and database concurrency"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 3: Performance, Caching, Automated Testing & Vercel Deployment",
        goal: "Optimize Core Web Vitals, implement multi-tier caching, automated end-to-end testing, and production CI/CD.",
        project: {
          title: "Phase 3 Milestone: Enterprise-Grade Hardened Web Deployment",
          brief: "Deploy the production full-stack application with automated testing, Lighthouse 95+ performance, and CI/CD pipelines.",
          acceptance_criteria: [
            "Achieves 95+ Lighthouse Performance, SEO, and Accessibility scores",
            "Multi-tier caching strategy (Data Cache, Request Memoization, Full Route Cache)",
            "Automated unit and integration test suite passing in GitHub Actions CI",
          ],
          stretch: "Implement global edge caching and automated canary deployments.",
        },
        weekThemes: [
          {
            theme: "Week 6: Multi-Tier Caching Architecture & Core Web Vitals",
            sessions: [
              {
                title: "Next.js Caching Architecture: Request, Data & Route Cache",
                objective: "Master the 4 caching layers in Next.js: memoization, fetch data cache, full route cache, and router cache.",
                concepts: ["Request Memoization", "Data Cache", "Full Route Cache", "Stale-While-Revalidate"],
                queries: ["Next.js 14 caching layers explained deeply", "Next.js fetch cache tag revalidation tutorial"],
              },
              {
                title: "Core Web Vitals Optimization: LCP, INP & CLS Tuning",
                objective: "Diagnose and optimize Largest Contentful Paint, Interaction to Next Paint, and Cumulative Layout Shift.",
                concepts: ["Core Web Vitals", "LCP Optimization", "INP Reduction", "Font & Image Optimization"],
                queries: ["How to optimize Core Web Vitals in Next.js", "Next.js image and font optimization guide"],
              },
            ],
          },
          {
            theme: "Week 7: Automated Testing with Vitest, Playwright & CI/CD",
            sessions: [
              {
                title: "Component Unit & Integration Testing with Vitest & RTL",
                objective: "Write deterministic tests verifying user interactions, accessibility roles, and mocked network requests.",
                concepts: ["Vitest", "React Testing Library", "MSW Mock Service Worker", "Test-Driven Development"],
                queries: ["React Testing Library and Vitest modern tutorial", "Mock Service Worker MSW with React tutorial"],
              },
              {
                title: "End-to-End Testing with Playwright in GitHub Actions CI",
                objective: "Construct end-to-end test suites simulating multi-page user journeys, authentication, and form submissions.",
                concepts: ["Playwright E2E", "GitHub Actions CI", "Headless Browser Testing", "Flaky Test Prevention"],
                queries: ["Playwright tutorial for Next.js full walkthrough", "Running Playwright in GitHub Actions CI/CD"],
              },
            ],
          },
          {
            theme: "Week 8: Production Security Hardening & Zero-Downtime Deployment",
            sessions: [
              {
                title: "Security Hardening: CSP, Headers, Rate Limiting & Secrets",
                objective: "Enforce Content Security Policy (CSP), HTTP security headers, and distributed Redis rate limiting.",
                concepts: ["Content Security Policy", "Security Headers", "Upstash Redis Rate Limiting", "Secret Hygiene"],
                queries: ["Next.js security best practices CSP headers", "Next.js API rate limiting with Redis tutorial"],
              },
              {
                title: "Production Deployment, Telemetry & Zero-Downtime Releases",
                objective: "Deploy to Vercel/Docker, integrate Sentry error telemetry, and establish operational monitoring runbooks.",
                concepts: ["Production Deployment", "Sentry Error Tracking", "OpenTelemetry", "Zero-Downtime Releases"],
                queries: ["Deploying Next.js to production best practices", "Next.js Sentry monitoring and error tracking setup"],
              },
            ],
          },
        ],
      },
    ],
  },

  // 2. Python, Data Science, Machine Learning & AI Engineering
  {
    keywords: [
      "python",
      "data science",
      "machine learning",
      "deep learning",
      "pandas",
      "numpy",
      "scikit-learn",
      "scikit",
      "pytorch",
      "tensorflow",
      "data analysis",
      "data analytics",
      "ai engineer",
      "artificial intelligence",
      "nlp",
      "computer vision",
    ],
    title: "Python Data Science, Machine Learning & AI Engineering",
    phases: [
      {
        title: "Phase 1: Python Idioms, Scientific Computing & Exploratory Data Analysis",
        goal: "Master vectorized numerical computing, data wrangling with Pandas/NumPy, and statistical visualization.",
        project: {
          title: "Phase 1 Milestone: Automated Data Cleaning & EDA Pipeline",
          brief: "Build an end-to-end data processing pipeline that ingests raw datasets, imputes missing values, and produces statistical reports.",
          acceptance_criteria: [
            "Fully vectorized operations using NumPy and Pandas with zero iterative for-loops",
            "Handles edge-case anomalies, date parsing, categorical encoding, and outliers",
            "Produces interactive publication-quality visualizations with Matplotlib/Seaborn",
          ],
          stretch: "Integrate automated data profiling and validation tests using Great Expectations.",
        },
        weekThemes: [
          {
            theme: "Week 1: Python Data Structures, Generators & Vectorized NumPy",
            sessions: [
              {
                title: "Idiomatic Python: Comprehensions, Iterators & Memory Profiling",
                objective: "Write high-performance Python code using generators, itertools, and memory-efficient data structures.",
                concepts: ["Generators", "Itertools", "List Comprehensions", "Memory Profiling"],
                queries: ["Idiomatic Python data science best practices", "Python generators and iterators in depth tutorial"],
              },
              {
                title: "NumPy Fundamentals: Array Broadcasting, Slicing & Vectorization",
                objective: "Deconstruct multidimensional ndarray memory buffers, broadcasting arithmetic, and vectorized execution.",
                concepts: ["NumPy ndarray", "Array Broadcasting", "Vectorization", "Strides & Memory Layout"],
                queries: ["NumPy array broadcasting explained visually", "NumPy vectorization vs python loops tutorial"],
              },
            ],
          },
          {
            theme: "Week 2: Advanced Pandas DataFrames & Exploratory Data Analysis (EDA)",
            sessions: [
              {
                title: "Pandas Mastery: Indexing, GroupBy Aggregations & Merges",
                objective: "Wrangle relational datasets using multi-indexes, split-apply-combine GroupBy logic, and merge strategies.",
                concepts: ["Pandas MultiIndex", "GroupBy Aggregations", "Merge vs Join", "Window Functions"],
                queries: ["Pandas GroupBy and data aggregation tutorial", "Pandas advanced data manipulation techniques"],
              },
              {
                title: "Data Visualization & Statistical Distribution Analysis",
                objective: "Uncover correlations, skewness, and multi-variable relationships using Seaborn and Matplotlib.",
                concepts: ["Seaborn Heatmaps", "Box Plots & Outliers", "Kernel Density Estimation", "Visual Storytelling"],
                queries: ["Exploratory data analysis in Python tutorial", "Seaborn data visualization complete guide"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 2: Statistical Foundations, Scikit-Learn & Classical Machine Learning",
        goal: "Master supervised and unsupervised learning algorithms, feature engineering pipelines, and metric evaluation.",
        project: {
          title: "Phase 2 Milestone: Production Predictive Machine Learning Model",
          brief: "Train, evaluate, and tune a predictive regression or classification pipeline with cross-validation and feature scaling.",
          acceptance_criteria: [
            "Leakage-free Scikit-Learn Pipeline with ColumnTransformer for numeric and categorical features",
            "Hyperparameter optimization using GridSearchCV/RandomizedSearchCV",
            "Comprehensive evaluation: ROC-AUC, Precision-Recall, F1-Score, and confusion matrix",
          ],
          stretch: "Implement SHAP/LIME model explainability analysis on individual predictions.",
        },
        weekThemes: [
          {
            theme: "Week 3: Statistical Learning, Regression & Classification Foundations",
            sessions: [
              {
                title: "Linear & Logistic Regression: Cost Functions & Gradient Descent",
                objective: "Derive ordinary least squares, logistic loss, and optimize weights via gradient descent.",
                concepts: ["Cost Function", "Gradient Descent", "Odds Ratio", "Regularization L1/L2"],
                queries: ["Gradient descent and linear regression from scratch", "Logistic regression explained clearly math and code"],
              },
              {
                title: "Evaluation Metrics: Precision, Recall, ROC-AUC & Trade-offs",
                objective: "Evaluate models beyond raw accuracy, balancing false positives and false negatives under class imbalance.",
                concepts: ["Confusion Matrix", "Precision vs Recall", "ROC-AUC Curve", "F1 Score"],
                queries: ["Precision recall and ROC AUC curves explained", "Handling imbalanced datasets in machine learning"],
              },
            ],
          },
          {
            theme: "Week 4: Tree-Based Models, Ensembles & Scikit-Learn Pipelines",
            sessions: [
              {
                title: "Decision Trees, Random Forests & Gradient Boosting (XGBoost)",
                objective: "Construct ensemble algorithms: bagging, boosting, and gradient-boosted decision trees.",
                concepts: ["Decision Trees", "Random Forests", "XGBoost", "Feature Importance"],
                queries: ["Random Forest and XGBoost explained tutorial", "How gradient boosting works step by step"],
              },
              {
                title: "Scikit-Learn Pipelines, Preprocessing & Preventing Data Leakage",
                objective: "Build modular pipelines combining Imputer, StandardScaler, OneHotEncoder, and model estimators.",
                concepts: ["Pipeline API", "ColumnTransformer", "Data Leakage Prevention", "Cross-Validation"],
                queries: ["Scikit Learn Pipeline and ColumnTransformer tutorial", "Preventing data leakage in machine learning Python"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 3: Deep Learning, PyTorch Tensors & Model Deployment",
        goal: "Build neural network architectures using PyTorch, train on GPUs, and deploy models as REST microservices.",
        project: {
          title: "Phase 3 Milestone: End-to-End Neural Network API Deployment",
          brief: "Train a PyTorch neural network and serve inference via a FastAPI service containerized with Docker.",
          acceptance_criteria: [
            "PyTorch custom Dataset, DataLoader, and Training/Validation loop with early stopping",
            "FastAPI endpoint serving batch predictions with sub-50ms latency",
            "Dockerized container with automated model artifact loading and healthchecks",
          ],
          stretch: "Integrate ONNX runtime quantization for 3x faster CPU inference.",
        },
        weekThemes: [
          {
            theme: "Week 5: PyTorch Core: Tensors, Autograd & Neural Network Layers",
            sessions: [
              {
                title: "PyTorch Tensor Operations, Computational Graphs & Autograd",
                objective: "Grasp how PyTorch builds dynamic computation graphs and computes backpropagation gradients automatically.",
                concepts: ["Tensors", "Autograd", "Computational Graph", "Backpropagation"],
                queries: ["PyTorch tensors and autograd tutorial for beginners", "How backpropagation works in PyTorch step by step"],
              },
              {
                title: "Building Neural Networks with nn.Module & Training Loops",
                objective: "Implement custom neural network architectures with linear layers, activation functions, and optimizers.",
                concepts: ["nn.Module", "Forward Pass", "Loss Functions", "Adam Optimizer"],
                queries: ["PyTorch custom nn.Module and training loop guide", "PyTorch DataLoader and Dataset tutorial"],
              },
            ],
          },
          {
            theme: "Week 6: Production Model Serving with FastAPI & Docker",
            sessions: [
              {
                title: "Model Serialization (Pickle, TorchScript, ONNX) & Inference",
                objective: "Serialize model weights and run optimized inference pipelines without training dependencies.",
                concepts: ["Model Serialization", "TorchScript", "ONNX Runtime", "Inference Optimization"],
                queries: ["Exporting PyTorch models to ONNX tutorial", "Model serialization and inference best practices"],
              },
              {
                title: "Serving Machine Learning Models via FastAPI & Docker",
                objective: "Package inference logic into a production-grade asynchronous REST API with validation and Docker containerization.",
                concepts: ["FastAPI Model Serving", "Async Endpoints", "Docker Containerization", "Healthchecks"],
                queries: ["Deploying ML models with FastAPI and Docker tutorial", "FastAPI production machine learning API guide"],
              },
            ],
          },
        ],
      },
    ],
  },

  // 3. Foreign Languages & Linguistics (Spanish, French, German, Japanese, etc.)
  {
    keywords: [
      "spanish",
      "french",
      "german",
      "japanese",
      "chinese",
      "mandarin",
      "italian",
      "russian",
      "korean",
      "arabic",
      "portuguese",
      "learn language",
      "language learning",
      "foreign language",
    ],
    title: "Conversational Language Fluency & Immersion Mastery",
    phases: [
      {
        title: "Phase 1: Phonetics, Pronunciation & Core Sentence Mechanics",
        goal: "Master authentic pronunciation, foundational greetings, grammatical gender, and basic sentence structure.",
        project: {
          title: "Phase 1 Milestone: 3-Minute Self-Introduction & Pronunciation Video",
          brief: "Record a natural, fluent 3-minute spoken audio/video introducing yourself, your background, daily routine, and interests.",
          acceptance_criteria: [
            "Accurate vowel and consonant pronunciation adhering to native phonetic rules",
            "Correct use of essential regular present-tense verbs and subject pronouns",
            "Coherent sentence connections using basic conjunctions and greetings",
          ],
          stretch: "Transcribe the recording in target script with zero spelling or accent mark errors.",
        },
        weekThemes: [
          {
            theme: "Week 1: Phonetic Invariants, Alphabet & Essential Greetings",
            sessions: [
              {
                title: "Phonetic Foundations: Vowel Sounds, Stress Rules & Accent Marks",
                objective: "Train mouth and tongue articulation to produce clear, authentic native phonemes without mother-tongue accent interference.",
                concepts: ["Vowel Articulation", "Stress & Syllable Rules", "Accent Marks", "Phonetic Pairs"],
                queries: ["Language pronunciation and phonetics for beginners tutorial", "How to master pronunciation guide step by step"],
              },
              {
                title: "Essential Greetings, Polite Formality & Self-Introductions",
                objective: "Command social icebreakers, formal vs informal address, and introduce your name, origin, and profession.",
                concepts: ["Formal vs Informal Address", "Personal Pronouns", "Introductions", "Greetings & Farewells"],
                queries: ["Beginner conversation greetings and introductions lesson", "Formal vs informal language communication tutorial"],
              },
            ],
          },
          {
            theme: "Week 2: Core Sentence Structure & Present-Tense Verb Conjugation",
            sessions: [
              {
                title: "Sentence Architecture: Subject-Verb-Object & Word Order Rules",
                objective: "Understand natural sentence rhythm, question formulation, and negation syntax.",
                concepts: ["SVO Word Order", "Negation Rules", "Question Inversion", "Definite & Indefinite Articles"],
                queries: ["Sentence structure and word order beginner tutorial", "How to form questions and negatives in language"],
              },
              {
                title: "Essential Present Tense Verbs: Regular Patterns & High-Frequency Irregulars",
                objective: "Conjugate high-frequency verbs across all grammatical persons with automaticity.",
                concepts: ["Regular Verb Endings", "To Be & To Have Verbs", "Stem Changes", "Conjugation Drills"],
                queries: ["Present tense verb conjugation beginner lesson", "Most common irregular verbs explained clearly"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 2: Narrative Timeframes, Past/Future Tenses & Practical Dialogues",
        goal: "Expand conversational range into past memories, future intentions, directions, dining, and daily storytelling.",
        project: {
          title: "Phase 2 Milestone: Spontaneous Travel & Narrative Roleplay Dialogue",
          brief: "Conduct a 5-minute roleplay scenario handling travel bookings, navigating directions, ordering food, and recounting past events.",
          acceptance_criteria: [
            "Seamless transition between present, past narrative, and near-future statements",
            "Accurate preposition usage for spatial navigation, time, and quantities",
            "Demonstrates listening comprehension by responding naturally to unexpected questions",
          ],
          stretch: "Incorporate colloquial idioms and conversational filler phrases naturally.",
        },
        weekThemes: [
          {
            theme: "Week 3: Daily Life Vocabulary, Numbers, Time & Spatial Directions",
            sessions: [
              {
                title: "Navigating the Real World: Locations, Directions & Transportation",
                objective: "Confidently ask for and follow directions, navigate public transit, and describe spatial landmarks.",
                concepts: ["Spatial Prepositions", "Direction Imperatives", "Transportation Terms", "Distance & Measurements"],
                queries: ["Directions and travel vocabulary listening practice", "How to ask for directions conversation guide"],
              },
              {
                title: "Time, Schedules, Numbers & Routine Activities",
                objective: "Tell time, schedule appointments, handle financial transactions, and narrate your daily schedule.",
                concepts: ["Telling Time", "Numbers & Prices", "Reflexive Daily Verbs", "Temporal Connectors"],
                queries: ["Daily routine reflexive verbs conversation tutorial", "Telling time and scheduling lesson"],
              },
            ],
          },
          {
            theme: "Week 4: Narrating the Past: Completed Events vs Continuous Context",
            sessions: [
              {
                title: "Completed Past Actions: Simple Past Tense Mechanics",
                objective: "Express finished events, timelines, and past accomplishments with correct irregular forms.",
                concepts: ["Simple Past Tense", "Past Time Markers", "Irregular Past Forms", "Narrative Sequencing"],
                queries: ["Past tense conjugation and storytelling lesson", "Mastering the simple past tense step by step"],
              },
              {
                title: "Descriptive Past & Habitual Background Context",
                objective: "Describe weather, emotions, and recurring habits in the past, contrasting with single events.",
                concepts: ["Continuous Past", "Habitual Past", "Past Contrast", "Storytelling Nuances"],
                queries: ["Past tense contrast when to use which tutorial", "Storytelling in the past language lesson"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 3: Conversational Fluency, Spontaneous Immersion & Nuance",
        goal: "Attain spontaneous listening comprehension, express complex opinions, subjunctive/modal subtleties, and native idioms.",
        project: {
          title: "Phase 3 Milestone: 10-Minute Spontaneous Conversation & Cultural Capstone",
          brief: "Engage in an unscripted 10-minute spoken discourse on a cultural, social, or personal topic with a native or tandem partner.",
          acceptance_criteria: [
            "Demonstrates continuous speech with minimal hesitations or English translation pauses",
            "Accurately uses conditional/modal expressions to offer advice, opinions, and hypothetical thoughts",
            "Understands normal native conversational pacing and responds with natural colloquial markers",
          ],
          stretch: "Read and summarize a native news article or literary excerpt entirely in the target language.",
        },
        weekThemes: [
          {
            theme: "Week 5: Future Intentions, Conditional Modals & Expressing Opinions",
            sessions: [
              {
                title: "Near & Future Tense: Plans, Predictions & Commitments",
                objective: "Articulate personal aspirations, professional plans, and probabilistic forecasts.",
                concepts: ["Future Tense", "Going To + Verb", "Time Horizons", "Probability Markers"],
                queries: ["How to talk about the future language tutorial", "Future tense and predictions conversation practice"],
              },
              {
                title: "Conditional Mood & Polite Requests: 'I would like' & Hypotheses",
                objective: "Formulate polite inquiries, hypothetical scenarios, and nuanced personal opinions.",
                concepts: ["Conditional Tense", "Polite Modals", "Hypothetical Clauses", "Debate & Agreement"],
                queries: ["Conditional tense polite requests and opinions lesson", "Expressing opinions and feelings conversation tutorial"],
              },
            ],
          },
          {
            theme: "Week 6: Native Speed Listening Immersion & Spontaneous Speaking Drills",
            sessions: [
              {
                title: "Deciphering Fast Speech: Connected Phonetics & Slang Reductions",
                objective: "Train ears to decode slurred contractions, dropped syllables, and natural fast-paced native speech.",
                concepts: ["Connected Speech", "Phonetic Reductions", "Colloquial Fillers", "Listening Comprehension"],
                queries: ["How to understand native speakers fast speech tutorial", "Listening comprehension immersion practice"],
              },
              {
                title: "Spontaneous Speaking: Circumlocution, Idioms & Fluency Drills",
                objective: "Overcome vocabulary gaps through creative circumlocution and adopt natural idiomatic expressions.",
                concepts: ["Circumlocution", "Idiomatic Expressions", "Speech Flow Drills", "Thinking in the Target Language"],
                queries: ["How to think in your target language fluency exercises", "Speaking fluency and overcoming hesitations tutorial"],
              },
            ],
          },
        ],
      },
    ],
  },

  // 4. Music, Instruments & Audio Production (Guitar, Piano, Vocals, Ableton, etc.)
  {
    keywords: [
      "guitar",
      "piano",
      "music production",
      "music theory",
      "singing",
      "vocals",
      "bass",
      "drums",
      "ableton",
      "fl studio",
      "beatmaking",
      "audio engineering",
      "songwriter",
    ],
    title: "Musical Instrument Mastery & Sound Performance Architecture",
    phases: [
      {
        title: "Phase 1: Instrument Anatomy, Posture & Foundational Muscle Memory",
        goal: "Develop proper physical ergonomics, clean tone production, essential open chords/notes, and metronome timing.",
        project: {
          title: "Phase 1 Milestone: Multi-Chord Acoustic Performance at Tempo",
          brief: "Record a full, clean performance of a multi-chord progression or foundational piece locked to a steady metronome pulse.",
          acceptance_criteria: [
            "Zero buzzing or muted strings with clean fretting and relaxed hand posture",
            "Seamless on-beat chord transitions without dropping tempo or hesitating",
            "Demonstrates dynamic control between soft and accented rhythmic strums",
          ],
          stretch: "Perform the piece while counting rhythmic subdivisions out loud.",
        },
        weekThemes: [
          {
            theme: "Week 1: Physical Ergonomics, Tuning & Clean Tone Production",
            sessions: [
              {
                title: "Instrument Mechanics: Posture, Hand Geometry & Tuning",
                objective: "Position body and hands to eliminate tendon strain, establish proper thumb anchoring, and tune by ear.",
                concepts: ["Ergonomic Posture", "Fretting Hand Geometry", "Tuning & Pitch", "Tension Release"],
                queries: ["Instrument beginner posture and hand positioning tutorial", "How to get clean tone without buzzing beginner lesson"],
              },
              {
                title: "First Chords & Notes: Finger Pressure & Precision Placement",
                objective: "Place fingertips cleanly right behind the fret wires to produce crystal-clear resonance on every note.",
                concepts: ["Finger Placement", "Fret Physics", "Arching Fingers", "Muscle Memory Building"],
                queries: ["First beginner chords clean sound tutorial", "Finger placement and chord transitions for beginners"],
              },
            ],
          },
          {
            theme: "Week 2: Rhythmic Subdivisions, Strumming Patterns & Metronome Sync",
            sessions: [
              {
                title: "Rhythm Fundamentals: Down-Up Strumming & Counting 4/4 Time",
                objective: "Develop a fluid, pendulum-like rhythmic strumming arm locked to quarter and eighth-note pulses.",
                concepts: ["Down-Up Strumming", "Rhythm Counting", "Metronome Practice", "Internal Clock"],
                queries: ["Beginner rhythm and strumming patterns tutorial", "How to practice with a metronome music lesson"],
              },
              {
                title: "Rapid Chord Transitions: Anchor Fingers & Anticipation Mechanics",
                objective: "Eliminate transition pauses between open chords using common pivot fingers and mental anticipation.",
                concepts: ["Anchor Fingers", "Pivot Movements", "Transition Drills", "Muscle Memory Automations"],
                queries: ["How to switch chords fast smooth transitions lesson", "Chord transition drills for beginners"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 2: Scale Geometry, Music Theory Foundations & Ear Training",
        goal: "Master major and minor scales, root-note navigation, chord construction theory, and interval ear training.",
        project: {
          title: "Phase 2 Milestone: Melodic Soloing & Improv Over Backing Track",
          brief: "Record a 2-minute melodic improvisation or solo over a backing track applying pentatonic and major scale shapes.",
          acceptance_criteria: [
            "Navigates across fretboard/keyboard positions targeting chord tones on strong beats",
            "Applies expressive articulation: vibrato, slides, hammer-ons, or dynamic volume shifts",
            "Maintains rhythmic phrasing with clean start and resolution points",
          ],
          stretch: "Incorporate intentional call-and-response phrasing and syncopated rhythmic hooks.",
        },
        weekThemes: [
          {
            theme: "Week 3: Scale Shapes, Key Centers & The Pentatonic Framework",
            sessions: [
              {
                title: "The Pentatonic Framework: Scale Geometry & Position 1",
                objective: "Internalize the universal 5-note pentatonic framework and navigate root note anchor points across octaves.",
                concepts: ["Minor Pentatonic", "Root Note Anchors", "Scale Patterns", "Finger Independence"],
                queries: ["Minor pentatonic scale position 1 tutorial", "How to use pentatonic scale for beginners"],
              },
              {
                title: "Ear Training & Interval Recognition: Thirds, Fifths & Octaves",
                objective: "Recognize musical distances by ear and translate audible melodies directly to the instrument without tabs.",
                concepts: ["Musical Intervals", "Relative Pitch", "Active Listening", "Melodic Transcription"],
                queries: ["Ear training for musicians intervals beginner tutorial", "How to play what you hear in your head music lesson"],
              },
            ],
          },
          {
            theme: "Week 4: Chord Construction Theory: Triads, Sevenths & Progression Science",
            sessions: [
              {
                title: "Triad Architecture: Major, Minor, Diminished & Inversions",
                objective: "Understand how notes stack in thirds to construct major and minor harmony across the instrument.",
                concepts: ["Triads", "Root-Third-Fifth", "Chord Formulas", "Voice Leading"],
                queries: ["Chord construction music theory explained simply", "Triads and inversions music theory tutorial"],
              },
              {
                title: "The Roman Numeral System & Common Harmonic Progressions",
                objective: "Deconstruct why the I-V-vi-IV and ii-V-I progressions define contemporary and classic music.",
                concepts: ["Roman Numeral Analysis", "I-IV-V-I Progression", "Tension & Resolution", "Key Centers"],
                queries: ["Roman numeral chord progressions explained", "Understanding chord progressions in music theory"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 3: Advanced Articulation, Phrasing, Repertoire & Performance",
        goal: "Master expressive phrasing, dynamic touch, complex repertoire performance, and professional recording standards.",
        project: {
          title: "Phase 3 Milestone: Studio-Grade Solo Repertoire Video Performance",
          brief: "Perform and record an advanced full-length repertoire piece or original composition with polished studio-grade dynamics.",
          acceptance_criteria: [
            "Demonstrates complete technical command with nuanced dynamic touch and zero tempo drops",
            "Clean musical interpretation with expressive vibrato, articulation, and voice leading",
            "Recorded with clear audio fidelity, level staging, and structured presentation",
          ],
          stretch: "Compose an original variation or bridge section showcasing personal musical voice.",
        },
        weekThemes: [
          {
            theme: "Week 5: Expressive Articulation: Vibrato, Dynamics & Phrasing",
            sessions: [
              {
                title: "Touch Dynamics, Micro-Timing & Expressive Vibrato",
                objective: "Inject emotion into notes through controlled pitch modulation, touch sensitivity, and pocket timing.",
                concepts: ["Vibrato Physics", "Dynamic Contrast", "Playing in the Pocket", "Bending & Slides"],
                queries: ["How to develop great vibrato and touch music lesson", "Musical phrasing and dynamics masterclass"],
              },
              {
                title: "Advanced Rhythm: Syncopation, Triplets & Groove Tightness",
                objective: "Master complex subdivisions, offbeat syncopation, and lock tightly into the rhythmic groove.",
                concepts: ["Syncopation", "Triplets", "Polyrhythms", "Groove Execution"],
                queries: ["Advanced rhythm and syncopation exercises tutorial", "How to improve groove and timing music lesson"],
              },
            ],
          },
          {
            theme: "Week 6: Full Repertoire Synthesis & Performance Capstone",
            sessions: [
              {
                title: "Deconstructing Complex Repertoire: Sectional Chunking Practice",
                objective: "Break down challenging musical passages using slow-motion sectional loops and deliberate practice.",
                concepts: ["Sectional Chunking", "Deliberate Practice", "Performance Memory", "Stage Presence"],
                queries: ["How to learn difficult songs fast on instrument", "Deliberate practice techniques for musicians"],
              },
              {
                title: "Performance Recording, Audio Capture & Musical Capstone",
                objective: "Capture high-fidelity audio/video, analyze playback for timing and tone flaws, and execute the final piece.",
                concepts: ["Audio Gain Staging", "Performance Review", "Self-Assessment", "Live Execution"],
                queries: ["How to record acoustic instruments at home tutorial", "Music performance mindset and overcoming nerves"],
              },
            ],
          },
        ],
      },
    ],
  },

  // 5. UI/UX & Digital Product Design (Figma, Design Systems, Wireframing)
  {
    keywords: [
      "ui ux",
      "ui/ux",
      "figma",
      "product design",
      "user experience",
      "user interface",
      "design system",
      "wireframing",
      "prototyping",
      "graphic design",
      "interaction design",
    ],
    title: "UI/UX & Digital Product Design Mastery with Figma",
    phases: [
      {
        title: "Phase 1: Visual Hierarchy, Typography, Color Systems & Figma Foundations",
        goal: "Master optical alignment, typography pairing, accessible color palettes, and Figma vector primitives.",
        project: {
          title: "Phase 1 Milestone: High-Fidelity Landing Page & Component Kit",
          brief: "Design a high-fidelity landing page for a modern software product featuring an 8pt grid, typography scale, and components.",
          acceptance_criteria: [
            "Strict adherence to an 8pt spatial grid system with consistent auto-layout padding",
            "Accessible color system with 4.5:1 WCAG AA text contrast ratios verified",
            "Harmonious typographic hierarchy with responsive mobile and desktop variants",
          ],
          stretch: "Create responsive breakpoints utilizing Figma constraints and fluid auto-layout.",
        },
        weekThemes: [
          {
            theme: "Week 1: Visual Hierarchy, Typography Scales & The 8pt Spatial Grid",
            sessions: [
              {
                title: "Visual Hierarchy: Contrast, Scale, Proximity & Fitts's Law",
                objective: "Guide user attention deterministically using scale contrast, negative space, and visual focal points.",
                concepts: ["Visual Hierarchy", "Proximity & Whitespace", "Fitts's Law", "Focal Points"],
                queries: ["Visual hierarchy UI design principles tutorial", "Whitespace and optical alignment in UI design"],
              },
              {
                title: "Typography Systems & The 8pt Spatial Grid Architecture",
                objective: "Establish modular type scales (Major Third/Golden Ratio) and enforce spatial rhythm with 8pt grids.",
                concepts: ["Type Scales", "Line Height & Letter Spacing", "8pt Grid System", "Spatial Rhythm"],
                queries: ["Typography in UI design complete guide Figma", "8pt grid system UI design tutorial"],
              },
            ],
          },
          {
            theme: "Week 2: Figma Primitives: Vector Networks, Auto-Layout & Color Science",
            sessions: [
              {
                title: "Figma Auto-Layout Mastery: Flexbox Thinking for Designers",
                objective: "Build fluid, responsive UI frames that adapt dynamically to content using auto-layout hug/fill properties.",
                concepts: ["Auto-Layout", "Hug vs Fill vs Fixed", "Padding & Gap Tokens", "Nested Frames"],
                queries: ["Figma auto layout complete tutorial beginner to advanced", "Figma auto layout responsive design guide"],
              },
              {
                title: "Color Systems: HSL Color Science, Semantic Tokens & WCAG Contrast",
                objective: "Generate functional color palettes with primary, neutral, state tints, and mathematically proven accessibility.",
                concepts: ["Semantic Colors", "WCAG 2.1 AA Standards", "Color Contrast", "Dark Mode Mapping"],
                queries: ["Color theory and systems for UI designers tutorial", "Figma color styles and accessibility contrast guide"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 2: User Research, Wireframing & Design Systems Architecture",
        goal: "Conduct user journeys, synthesize low-fidelity wireframes, and construct scalable component design systems.",
        project: {
          title: "Phase 2 Milestone: Multi-Screen Mobile App Design System in Figma",
          brief: "Design an end-to-end multi-screen mobile flow supported by a reusable component library with variants and properties.",
          acceptance_criteria: [
            "Comprehensive component set: buttons, inputs, modals, cards with interactive hover/focus states",
            "Component properties (boolean, text swap, instance swap) configured cleanly",
            "Low-fidelity user flow wireframes validated against clear user personas and jobs-to-be-done",
          ],
          stretch: "Implement design tokens and export CSS/JSON token mappings for developers.",
        },
        weekThemes: [
          {
            theme: "Week 3: User Research, Jobs-to-Be-Done & Low-Fidelity Wireframing",
            sessions: [
              {
                title: "User Journey Mapping, Personas & Information Architecture",
                objective: "Structure user workflows, identify friction bottlenecks, and organize content hierarchies logically.",
                concepts: ["Information Architecture", "User Journey Maps", "JTBD Framework", "Mental Models"],
                queries: ["Information architecture and user flows tutorial", "User journey mapping UX design step by step"],
              },
              {
                title: "Rapid Wireframing & Low-Fidelity Prototyping",
                objective: "Iterate quickly on layout concepts, visual structure, and user task flows before polishing aesthetic details.",
                concepts: ["Low-Fidelity Wireframes", "Card Sorting", "Paper Prototyping", "Task Success Paths"],
                queries: ["Wireframing in Figma tutorial for beginners", "How to wireframe like a senior product designer"],
              },
            ],
          },
          {
            theme: "Week 4: Design Systems Architecture: Components, Variants & Tokens",
            sessions: [
              {
                title: "Figma Components & Interactive Variants: State Management",
                objective: "Construct reusable components with hover, active, disabled, and loading states using component properties.",
                concepts: ["Components & Instances", "Variant Properties", "Boolean Properties", "State Machines"],
                queries: ["Figma component variants and properties masterclass", "How to build a scalable design system in Figma"],
              },
              {
                title: "Design Tokens & Developer Handoff Specifications",
                objective: "Bridge the gap between design and code with standardized color, spacing, radius, and elevation tokens.",
                concepts: ["Design Tokens", "Figma Variables", "Dev Mode Handoff", "Redline Specs"],
                queries: ["Figma variables and design tokens complete guide", "Figma to code developer handoff best practices"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 3: Micro-Interactions, Usability Testing & Portfolio Case Study",
        goal: "Create realistic animated prototypes, conduct empirical usability tests, and craft a senior portfolio case study.",
        project: {
          title: "Phase 3 Milestone: Interactive Prototype & Comprehensive Case Study",
          brief: "Produce an animated, interactive Figma prototype and a comprehensive portfolio case study detailing the design rationale.",
          acceptance_criteria: [
            "Smart animate transitions with realistic easing curves and interactive micro-animations",
            "Documented usability testing findings with actionable iteration revisions",
            "Portfolio-ready case study showcasing problem statement, metrics, wireframes, and final UI",
          ],
          stretch: "Publish an interactive Figma Community file and present in video walkthrough format.",
        },
        weekThemes: [
          {
            theme: "Week 5: Advanced Figma Prototyping, Smart Animate & Variables",
            sessions: [
              {
                title: "Smart Animate & Transition Easing Curves: Physics of UI",
                objective: "Design lifelike micro-animations and state transitions using cubic-bezier curves and smart animate.",
                concepts: ["Smart Animate", "Easing Curves", "Micro-Interactions", "Motion Choreography"],
                queries: ["Figma Smart Animate micro interactions tutorial", "Advanced prototyping in Figma step by step"],
              },
              {
                title: "Interactive Prototyping with Figma Variables & Logic Expressions",
                objective: "Simulate true software logic: dynamic carts, incrementing counters, and conditional screen branches.",
                concepts: ["Figma Variables", "Conditional Logic", "Interactive Components", "String & Number Binds"],
                queries: ["Figma variables conditional prototyping tutorial", "Interactive shopping cart prototype in Figma"],
              },
            ],
          },
          {
            theme: "Week 6: Empirical Usability Testing & Senior Case Study Storytelling",
            sessions: [
              {
                title: "Conducting Usability Testing & Heuristic Evaluation (Nielsen)",
                objective: "Observe real user interactions, identify confusion patterns, and score against the 10 Nielsen heuristics.",
                concepts: ["Usability Testing", "Think-Aloud Protocol", "Nielsen Heuristics", "SUS Scoring"],
                queries: ["How to conduct usability testing UX tutorial", "Nielsen 10 usability heuristics explained with examples"],
              },
              {
                title: "Crafting a Compelling Senior Product Design Case Study",
                objective: "Structure your portfolio case study to communicate business impact, trade-off decisions, and user empathy.",
                concepts: ["Case Study Architecture", "Storytelling", "Business Impact Metrics", "Portfolio Presentation"],
                queries: ["How to write a killer UX case study tutorial", "Senior product designer portfolio review best practices"],
              },
            ],
          },
        ],
      },
    ],
  },

  // 6. SQL, Relational Databases & Data Modeling (PostgreSQL, MySQL, SQLite)
  {
    keywords: [
      "sql",
      "mysql",
      "postgres",
      "postgresql",
      "sqlite",
      "database",
      "databases",
      "rdbms",
      "relational database",
      "sql queries",
    ],
    title: "SQL & Relational Database Mastery: From Queries to Performance Engineering",
    phases: [
      {
        title: "Phase 1: Relational Foundations, Schema Design & Declarative Queries",
        goal: "Master relational table models, data types, primary keys, filtering, aggregations, and multi-table joins.",
        project: {
          title: "Phase 1 Milestone: Multi-Table E-Commerce Relational Database",
          brief: "Design and implement a normalized relational schema for an e-commerce platform with customers, orders, and products.",
          acceptance_criteria: [
            "Normalized schema (3NF) with primary and foreign key constraints",
            "Complex queries combining INNER and LEFT joins with zero duplicate rows",
            "Aggregate reporting queries calculating revenue and customer cohorts using GROUP BY and HAVING",
          ],
          stretch: "Implement data integrity check constraints and cascading foreign key updates.",
        },
        weekThemes: [
          {
            theme: "Week 1: Relational Architecture, Data Types & Basic SELECT Queries",
            sessions: [
              {
                title: "Relational Invariants: Tables, Primary Keys & Data Types",
                objective: "Understand relational table architecture, candidate keys, nullability rules, and foundational data types.",
                concepts: ["Relational Model", "Primary Keys", "Data Types", "NULL Semantics"],
                queries: ["SQL beginner tutorial tables and primary keys", "SQL relational database basics tutorial"],
              },
              {
                title: "Data Retrieval: SELECT, WHERE, ORDER BY & LIMIT Filtering",
                objective: "Filter and project table records with precise boolean predicates, pattern matching (LIKE), and sorting.",
                concepts: ["SELECT Projections", "WHERE Predicates", "Pattern Matching", "ORDER BY & LIMIT"],
                queries: ["SQL SELECT statement filtering for beginners", "SQL WHERE clause and operators tutorial"],
              },
            ],
          },
          {
            theme: "Week 2: Aggregations, Grouping & Multi-Table Relational Joins",
            sessions: [
              {
                title: "Multi-Table Relational Joins: INNER, LEFT, RIGHT & FULL OUTER",
                objective: "Combine data across normalized tables while mastering join cardinality, Venn diagram mechanics, and missing rows.",
                concepts: ["INNER JOIN", "LEFT JOIN", "Join Cardinality", "Foreign Key References"],
                queries: ["SQL joins tutorial for beginners with examples", "SQL INNER JOIN vs LEFT JOIN visual guide"],
              },
              {
                title: "Aggregate Computation: COUNT, SUM, AVG, GROUP BY & HAVING",
                objective: "Compute summary statistics over grouped subsets of data and filter aggregate results with the HAVING clause.",
                concepts: ["Aggregate Functions", "GROUP BY Mechanics", "HAVING vs WHERE", "Aggregate Null Handling"],
                queries: ["SQL GROUP BY and HAVING tutorial with examples", "SQL aggregate functions COUNT SUM AVG guide"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 2: Intermediate Data Modeling, Subqueries & Relational Constraints",
        goal: "Command nested subqueries, common table expressions (CTEs), window functions, and database schema mutations.",
        project: {
          title: "Phase 2 Milestone: Advanced Business Analytics & Reporting Pipeline",
          brief: "Build an analytical reporting suite that computes customer lifetime value, retention cohorts, and month-over-month growth.",
          acceptance_criteria: [
            "Readable, maintainable queries using CTEs instead of deeply nested subqueries",
            "Accurate cohort analytics using window functions (ROW_NUMBER, RANK, LAG)",
            "Automated view layer abstracting complex business logic",
          ],
          stretch: "Create recursive CTEs for hierarchical organizational data trees.",
        },
        weekThemes: [
          {
            theme: "Week 3: Subqueries, Correlated Queries & Common Table Expressions (CTEs)",
            sessions: [
              {
                title: "Subquery Architecture: Scalar, Columnar & Correlated Subqueries",
                objective: "Employ nested subqueries in SELECT, FROM, and WHERE clauses, and distinguish correlated vs uncorrelated execution.",
                concepts: ["Scalar Subqueries", "Correlated Subqueries", "IN vs EXISTS", "Subquery Performance"],
                queries: ["SQL subqueries tutorial with real world examples", "SQL correlated subqueries explained"],
              },
              {
                title: "Common Table Expressions (CTEs): WITH Clause & Modular SQL",
                objective: "Structure complex nested logic into clean, readable, modular pipelines using Common Table Expressions.",
                concepts: ["CTEs (WITH Clause)", "Modular Query Design", "Recursive CTEs", "CTE vs Temporary Tables"],
                queries: ["SQL Common Table Expressions CTE tutorial", "SQL WITH clause modular queries explained"],
              },
            ],
          },
          {
            theme: "Week 4: Window Functions & Analytical SQL",
            sessions: [
              {
                title: "Ranking Functions: ROW_NUMBER, RANK & DENSE_RANK",
                objective: "Segment datasets into partitions and assign deterministic ranks without collapsing rows like GROUP BY.",
                concepts: ["Window Functions", "OVER Clause", "ROW_NUMBER()", "DENSE_RANK() vs RANK()"],
                queries: ["SQL window functions tutorial for beginners", "SQL ROW_NUMBER RANK DENSE_RANK explained"],
              },
              {
                title: "Moving Averages, Running Totals & Value Offsets (LEAD / LAG)",
                objective: "Compute financial running totals, rolling moving averages, and period-over-period differences using LEAD and LAG.",
                concepts: ["LEAD & LAG", "Running Totals", "Partitioning Frames", "ROWS BETWEEN Frames"],
                queries: ["SQL LEAD and LAG window functions tutorial", "SQL running total and moving average tutorial"],
              },
            ],
          },
        ],
      },
      {
        title: "Phase 3: Performance Tuning, Indexing & Production Administration",
        goal: "Master B-Tree indexing, execution plans (EXPLAIN ANALYZE), ACID transactions, concurrency locking, and query optimization.",
        project: {
          title: "Phase 3 Milestone: High-Throughput Production Database Tuning",
          brief: "Optimize a slow database schema with millions of rows, eliminating full table scans and deadlock contention.",
          acceptance_criteria: [
            "Documented 10x query latency reduction verified via EXPLAIN ANALYZE",
            "Optimal B-Tree composite indexes covering frequent query paths",
            "Safe atomic transaction boundaries preventing race conditions and dirty reads",
          ],
          stretch: "Implement database connection pooling and automated slow-query log auditing.",
        },
        weekThemes: [
          {
            theme: "Week 5: Indexing Internals: B-Trees, Indexes & EXPLAIN Plans",
            sessions: [
              {
                title: "B-Tree Index Mechanics & Execution Plans (EXPLAIN ANALYZE)",
                objective: "Deconstruct how database engines traverse B-Tree index pages and diagnose query bottlenecks using execution plans.",
                concepts: ["B-Tree Indexes", "EXPLAIN ANALYZE", "Index Scans vs Seq Scans", "Composite Indexes"],
                queries: ["SQL indexing explained how B-Tree indexes work", "How to read EXPLAIN ANALYZE execution plans tutorial"],
              },
              {
                title: "Query Optimization: SARGable Predicates & Index Traps",
                objective: "Eliminate common anti-patterns like function-wrapped columns, wildcard prefixes, and implicit type conversions.",
                concepts: ["SARGable Queries", "Implicit Casts", "Covering Indexes", "Cost-Based Optimizer"],
                queries: ["SQL query optimization best practices tutorial", "How to optimize slow SQL queries indexing guide"],
              },
            ],
          },
          {
            theme: "Week 6: ACID Transactions, Locking & Data Integrity Capstone",
            sessions: [
              {
                title: "ACID Guarantees: Isolation Levels, Deadlocks & Row Locks",
                objective: "Ensure data consistency during concurrent writes using transaction boundaries, isolation levels, and row-level locks.",
                concepts: ["ACID Properties", "Isolation Levels", "Row Locks vs Table Locks", "Deadlock Prevention"],
                queries: ["SQL transactions ACID tutorial for beginners", "Database isolation levels and locking explained"],
              },
              {
                title: "Production Schema Normalization, Integrity Constraints & Upserts",
                objective: "Synthesize relational mastery by designing scalable schemas with check constraints, foreign keys, and upsert logic.",
                concepts: ["3NF Normalization", "Integrity Constraints", "ON CONFLICT Upserts", "Production Database Patterns"],
                queries: ["Database normalization 1NF 2NF 3NF explained", "SQL ON CONFLICT upsert statement tutorial"],
              },
            ],
          },
        ],
      },
    ],
  },
];

// ============================================================================
// UNIVERSAL DOMAIN CLASSIFIER & DYNAMIC MATRIX ENGINE
// ============================================================================

export type DomainCategory =
  | "frontend_web"
  | "data_ai"
  | "database_sql"
  | "languages"
  | "music_audio"
  | "design_ui"
  | "systems_backend"
  | "cloud_devops"
  | "cybersecurity"
  | "business_finance"
  | "general_mastery";

export function detectDomainCategory(goal: string, spec: string): DomainCategory {
  const text = `${goal} ${spec}`.toLowerCase();

  if (
    matchesKeyword(text, "sql") ||
    matchesKeyword(text, "database") ||
    matchesKeyword(text, "databases") ||
    matchesKeyword(text, "postgres") ||
    matchesKeyword(text, "postgresql") ||
    matchesKeyword(text, "mysql") ||
    matchesKeyword(text, "sqlite") ||
    matchesKeyword(text, "relational") ||
    matchesKeyword(text, "queries")
  ) {
    return "database_sql";
  }

  if (
    matchesKeyword(text, "web") ||
    matchesKeyword(text, "frontend") ||
    matchesKeyword(text, "react") ||
    matchesKeyword(text, "next") ||
    matchesKeyword(text, "javascript") ||
    matchesKeyword(text, "typescript") ||
    matchesKeyword(text, "fullstack") ||
    matchesKeyword(text, "css")
  ) {
    return "frontend_web";
  }

  if (
    matchesKeyword(text, "python") ||
    matchesKeyword(text, "data science") ||
    matchesKeyword(text, "machine learning") ||
    matchesKeyword(text, "ai") ||
    matchesKeyword(text, "deep learning") ||
    matchesKeyword(text, "analytics")
  ) {
    return "data_ai";
  }

  if (
    matchesKeyword(text, "spanish") ||
    matchesKeyword(text, "french") ||
    matchesKeyword(text, "german") ||
    matchesKeyword(text, "japanese") ||
    matchesKeyword(text, "chinese") ||
    matchesKeyword(text, "italian") ||
    matchesKeyword(text, "korean") ||
    matchesKeyword(text, "language")
  ) {
    return "languages";
  }

  if (
    matchesKeyword(text, "guitar") ||
    matchesKeyword(text, "piano") ||
    matchesKeyword(text, "music") ||
    matchesKeyword(text, "singing") ||
    matchesKeyword(text, "drums") ||
    matchesKeyword(text, "audio") ||
    matchesKeyword(text, "beat")
  ) {
    return "music_audio";
  }

  if (
    matchesKeyword(text, "design") ||
    matchesKeyword(text, "ui") ||
    matchesKeyword(text, "ux") ||
    matchesKeyword(text, "figma") ||
    matchesKeyword(text, "product design")
  ) {
    return "design_ui";
  }

  if (
    matchesKeyword(text, "devops") ||
    matchesKeyword(text, "cloud") ||
    matchesKeyword(text, "docker") ||
    matchesKeyword(text, "kubernetes") ||
    matchesKeyword(text, "aws") ||
    matchesKeyword(text, "terraform")
  ) {
    return "cloud_devops";
  }

  if (
    matchesKeyword(text, "security") ||
    matchesKeyword(text, "cyber") ||
    matchesKeyword(text, "hacking") ||
    matchesKeyword(text, "infosec")
  ) {
    return "cybersecurity";
  }

  if (
    matchesKeyword(text, "finance") ||
    matchesKeyword(text, "investing") ||
    matchesKeyword(text, "marketing") ||
    matchesKeyword(text, "seo") ||
    matchesKeyword(text, "business") ||
    matchesKeyword(text, "management")
  ) {
    return "business_finance";
  }

  if (
    matchesKeyword(text, "rust") ||
    matchesKeyword(text, "golang") ||
    matchesKeyword(text, "go") ||
    matchesKeyword(text, "c++") ||
    matchesKeyword(text, "backend") ||
    matchesKeyword(text, "distributed") ||
    matchesKeyword(text, "systems")
  ) {
    return "systems_backend";
  }

  return "general_mastery";
}

/**
 * Universal Dynamic Curriculum Synthesizer
 * Generates structured, domain-appropriate curriculums for ANY goal/topic
 * that strictly tallies with user input.
 */
export function synthesizeDynamicPlan(
  intake: IntakeInput,
  sanitizedGoal: string,
  sanitizedSpeciality: string
): StageAResponse {
  const goalLower = sanitizedGoal.toLowerCase();
  const totalWeeks = Math.min(Math.max(intake.targetWeeks, 4), 24);
  const hours = intake.hoursPerWeek;
  const sessionsPerWeek = Math.max(2, Math.min(4, Math.floor(hours / 1.5)));
  const minutesPerSession = Math.round((hours * 60) / sessionsPerWeek);
  const targetSubject = extractSubjectTerm(sanitizedGoal, sanitizedSpeciality);
  const topicTitle = targetSubject;

  // 1. Try matching dedicated topic blueprint
  const matchedBlueprint = TOPIC_BLUEPRINTS.find((bp) =>
    bp.keywords.some((kw) => matchesKeyword(goalLower, kw))
  );

  // 2. Determine number of phases: 2 for <= 6 weeks, 3 for > 6 weeks
  const phaseCount = totalWeeks <= 6 ? 2 : 3;

  // Flatten blueprint week themes if matched
  const blueprintThemes: WeekThemeTemplate[] = [];
  if (matchedBlueprint) {
    for (const phase of matchedBlueprint.phases) {
      for (const wt of phase.weekThemes) {
        blueprintThemes.push(wt);
      }
    }
  }

  const category = detectDomainCategory(sanitizedGoal, sanitizedSpeciality);

  // Build phases with exact, sequential week distribution
  const phases: Phase[] = [];
  let currentWeekNumber = 1;

  for (let pIdx = 0; pIdx < phaseCount; pIdx++) {
    const isLastPhase = pIdx === phaseCount - 1;
    const weeksInPhase = isLastPhase
      ? totalWeeks - currentWeekNumber + 1
      : Math.floor(totalWeeks / phaseCount);

    const phaseWeeks = [];

    // Phase metadata
    const blueprintPhase = matchedBlueprint?.phases[pIdx];

    const phaseTitlesByCategory: Record<DomainCategory, string[]> = {
      database_sql: [
        "Phase 1: Relational Foundations, Schema Design & Declarative Queries",
        "Phase 2: Intermediate Data Modeling, Subqueries & Relational Constraints",
        "Phase 3: Performance Tuning, Indexing & Production Administration",
      ],
      frontend_web: [
        "Phase 1: Component Architecture, React Internals & Client State",
        "Phase 2: Full-Stack APIs, Routing & Database Integration",
        "Phase 3: Production Caching, Core Web Vitals & Deployment Capstone",
      ],
      data_ai: [
        "Phase 1: Python Idioms, Numerical Computing & Exploratory Data Analysis",
        "Phase 2: Statistical Modeling, Scikit-Learn & Feature Engineering",
        "Phase 3: Deep Learning, PyTorch Tensors & Model Serving Capstone",
      ],
      languages: [
        "Phase 1: Phonetics, Pronunciation & Core Sentence Mechanics",
        "Phase 2: Narrative Timeframes, Past/Future Tenses & Storytelling",
        "Phase 3: Spontaneous Dialogue, Cultural Nuances & Fluency Capstone",
      ],
      music_audio: [
        "Phase 1: Instrument Anatomy, Posture & Foundational Muscle Memory",
        "Phase 2: Scale Geometry, Rhythm Subdivisions & Harmonic Theory",
        "Phase 3: Advanced Articulation, Phrasing & Performance Capstone",
      ],
      design_ui: [
        "Phase 1: Visual Hierarchy, Typography & Figma Foundations",
        "Phase 2: User Research, Wireframing & Design Systems Architecture",
        "Phase 3: Interactive Prototyping, Usability Testing & Portfolio Capstone",
      ],
      cloud_devops: [
        "Phase 1: Linux Primitives, Shell Automation & Docker Containers",
        "Phase 2: Kubernetes Orchestration, Ingress & Infrastructure as Code",
        "Phase 3: Automated CI/CD Pipelines, Chaos Resilience & Cloud Capstone",
      ],
      cybersecurity: [
        "Phase 1: Network Protocols, Packet Analysis & Reconnaissance",
        "Phase 2: Web Application Security, OWASP Exploits & Privilege Escalation",
        "Phase 3: Defensive Engineering, Threat Modeling & Penetration Capstone",
      ],
      business_finance: [
        "Phase 1: Core Economic Levers, Market Mechanics & Metric Modeling",
        "Phase 2: Strategic Positioning, Funnel Optimization & Risk Control",
        "Phase 3: Scaled Execution, Telemetry Auditing & Capstone Strategy",
      ],
      systems_backend: [
        "Phase 1: Memory Safety, Data Layouts & Foundational Primitives",
        "Phase 2: Concurrent Pipelines, Non-Blocking I/O & Distributed Services",
        "Phase 3: High-Throughput Benchmarking, Fault-Tolerance & Production Capstone",
      ],
      general_mastery: [
        "Phase 1: Foundational Invariants, Core Tooling & Mental Models",
        "Phase 2: Applied Workflows, Systematic Execution & Methodologies",
        "Phase 3: Advanced Nuances, Complex Problem Solving & Capstone Project",
      ],
    };

    const domainTitles = phaseTitlesByCategory[category] || phaseTitlesByCategory.general_mastery;
    let rawPhaseTitle = blueprintPhase?.title || domainTitles[pIdx] || domainTitles[domainTitles.length - 1];
    rawPhaseTitle = rawPhaseTitle.replace(/\b(Language|Instrument|Modern Software Engineering)\b/gi, targetSubject);
    if (!rawPhaseTitle.toLowerCase().includes(targetSubject.toLowerCase())) {
      rawPhaseTitle = rawPhaseTitle.replace(/^Phase \d+:\s*/, (m) => `${m}${targetSubject} `);
    }
    const phaseTitle = rawPhaseTitle;

    const phaseGoal =
      blueprintPhase?.goal?.replace(/\b(Language|Instrument|target language)\b/gi, targetSubject) ||
      `Achieve rigorous, demonstrable mastery of ${phaseTitle.replace(/^Phase \d+:\s*/, "")} in ${targetSubject}.`;

    const rawPhaseProject = blueprintPhase?.project || {
      title: `Phase ${pIdx + 1} Milestone: ${targetSubject} Deliverable`,
      brief: `Deliver a comprehensive, documented project proving command of ${phaseTitle.replace(/^Phase \d+:\s*/, "")} with zero unhandled edge cases.`,
      acceptance_criteria: [
        `Strict adherence to professional best practices in ${targetSubject}`,
        "Complete verification across all core failure modes and execution scenarios",
        "Demonstrates measurable performance, fluency, and production readiness",
      ],
      stretch: `Extend the milestone with advanced optimizations or portfolio-ready presentation.`,
    };

    const phaseProject = {
      ...rawPhaseProject,
      title: rawPhaseProject.title.toLowerCase().includes(targetSubject.toLowerCase())
        ? rawPhaseProject.title
        : `${targetSubject} ${rawPhaseProject.title}`,
      brief: rawPhaseProject.brief.replace(/\b(Language|Instrument|target language)\b/gi, targetSubject),
    };

    for (let w = 0; w < weeksInPhase; w++) {
      const wkNum = currentWeekNumber;
      const bpTheme = blueprintThemes[wkNum - 1];

      let weekThemeTitle = `Week ${wkNum}: ${targetSubject} Core Execution`;
      let weekSessions: Session[] = [];

      if (bpTheme && bpTheme.sessions.length > 0) {
        let rawTheme = bpTheme.theme.startsWith("Week") ? bpTheme.theme : `Week ${wkNum}: ${bpTheme.theme}`;
        rawTheme = rawTheme.replace(/\b(Language|Instrument)\b/gi, targetSubject);
        if (!rawTheme.toLowerCase().includes(targetSubject.toLowerCase())) {
          rawTheme = rawTheme.replace(/^Week \d+:\s*/, (m) => `${m}${targetSubject} `);
        }
        weekThemeTitle = rawTheme;

        weekSessions = bpTheme.sessions.slice(0, sessionsPerWeek).map((s, sIdx) => {
          let sTitle = s.title.replace(/\b(Language|Instrument)\b/gi, targetSubject);
          if (!sTitle.toLowerCase().includes(targetSubject.toLowerCase())) {
            sTitle = `${targetSubject}: ${sTitle}`;
          }

          const rawQ1 = (s.queries[0] || `${sTitle} tutorial`).replace(/\b(Language|Instrument)\b/gi, targetSubject);
          const rawQ2 = (s.queries[1] || `${sTitle} guide`).replace(/\b(Language|Instrument)\b/gi, targetSubject);

          const q1 = rawQ1.toLowerCase().includes(targetSubject.toLowerCase())
            ? rawQ1
            : `${targetSubject} ${rawQ1}`;
          const q2 = rawQ2.toLowerCase().includes(targetSubject.toLowerCase())
            ? rawQ2
            : `${targetSubject} ${rawQ2}`;

          const concepts = s.concepts.map((c) => {
            const cleaned = c.replace(/\b(Language|Instrument)\b/gi, targetSubject);
            return cleaned.toLowerCase().includes(targetSubject.toLowerCase())
              ? cleaned
              : `${targetSubject} ${cleaned}`;
          });

          return {
            id: `p${pIdx + 1}_w${wkNum}_s${sIdx + 1}`,
            title: sTitle,
            objective: s.objective.replace(/\b(Language|Instrument|target language)\b/gi, targetSubject),
            estimated_minutes: minutesPerSession,
            concepts,
            search_queries: [q1, q2],
            target_video_minutes_range: "medium" as const,
            difficulty: s.difficulty || (pIdx === 0 ? "Beginner" : pIdx === 1 ? "Intermediate" : "Advanced"),
          };
        });
      } else {
        // Universal Smart Synthesis tailored dynamically to the exact topic and category
        const universalThemesByCategory: Record<DomainCategory, Array<{ theme: string; s1: string; s2: string }>> = {
          database_sql: [
            { theme: "Relational Architecture & Declarative Queries", s1: "Tables, Keys & Data Types", s2: "Data Retrieval: SELECT & Filtering" },
            { theme: "Aggregations & Multi-Table Relational Joins", s1: "Relational Joins: INNER & LEFT", s2: "GROUP BY, HAVING & Aggregations" },
            { theme: "Subqueries & Common Table Expressions (CTEs)", s1: "Scalar & Correlated Subqueries", s2: "Modular Pipelines with CTEs" },
            { theme: "Window Functions & Analytical SQL", s1: "Ranking: ROW_NUMBER & RANK", s2: "Running Totals & Value Offsets" },
            { theme: "Indexing Internals & Query Optimization", s1: "B-Tree Indexes & EXPLAIN Plans", s2: "Query Tuning & SARGable Predicates" },
            { theme: "ACID Transactions & Concurrency Locking", s1: "Transactions & Isolation Levels", s2: "Deadlock Prevention & Row Locks" },
            { theme: "Schema Normalization & Data Integrity", s1: "Normalization (1NF to 3NF)", s2: "Constraints & Scalable Schemas" },
            { theme: "Production Database Administration & Analytics Capstone", s1: "Performance Auditing & Tuning", s2: "Comprehensive Production Capstone" },
          ],
          frontend_web: [
            { theme: "Component Foundations & Reactive State", s1: "Component Composition & Props", s2: "State Management & Lifecycle" },
            { theme: "Form Handling & User Input Validation", s1: "Controlled Forms & Schemas", s2: "Error Handling & Feedback UI" },
            { theme: "Routing, Navigation & Layout Trees", s1: "Route Matching & Nested Layouts", s2: "Dynamic Segments & Skeletons" },
            { theme: "Backend API Integration & Mutations", s1: "REST / GraphQL Data Fetching", s2: "Mutations & Optimistic UI" },
            { theme: "Authentication, State & Security", s1: "Session Management & Cookies", s2: "Protected Routes & Permissions" },
            { theme: "Performance Profiling & Bundle Tuning", s1: "Code Splitting & Lazy Loading", s2: "Rendering Optimization & Vitals" },
            { theme: "Automated Testing & Quality Assurance", s1: "Component Unit Testing", s2: "End-to-End User Journeys" },
            { theme: "Production Deployment & Monitoring", s1: "CI/CD Pipeline Setup", s2: "Production Monitoring & Logging" },
          ],
          data_ai: [
            { theme: "Data Ingestion & Array Computing", s1: "Data Loading & Environment Setup", s2: "Vectorized Operations & Slicing" },
            { theme: "Data Wrangling & Statistical EDA", s1: "Cleaning & Missing Value Imputation", s2: "Distribution Plots & Heatmaps" },
            { theme: "Feature Engineering & Preprocessing", s1: "Categorical Encoding & Scaling", s2: "Feature Selection & Pipelines" },
            { theme: "Supervised Baseline Modeling", s1: "Regression & Cost Minimization", s2: "Classification & Metric Trade-offs" },
            { theme: "Ensemble Models & Hyperparameter Tuning", s1: "Decision Trees & Random Forests", s2: "GridSearch & Cross-Validation" },
            { theme: "Neural Architectures & Backpropagation", s1: "Tensor Operations & Autograd", s2: "Network Training Loops" },
            { theme: "Model Evaluation & Error Auditing", s1: "Confusion Matrix & ROC Curves", s2: "Feature Importance & Explainability" },
            { theme: "Model Serving & Production APIs", s1: "Model Serialization & Export", s2: "FastAPI Inference Deployment" },
          ],
          languages: [
            { theme: "Phonetics, Alphabet & Essential Greetings", s1: "Pronunciation & Vowel Clarity", s2: "Greetings, Politeness & Names" },
            { theme: "Sentence Structure & Present Tense", s1: "Word Order & Core Verbs", s2: "Conjugations & Daily Expressions" },
            { theme: "Everyday Objects, Numbers & Navigation", s1: "Time, Numbers & Routine Tasks", s2: "Directions & Spatial Placement" },
            { theme: "Narrating Past Memories & Storytelling", s1: "Simple Past Tense Verbs", s2: "Continuous Past & Descriptions" },
            { theme: "Expressing Future Goals & Desires", s1: "Future Plans & Intentions", s2: "Conditional Politeness & Wants" },
            { theme: "Listening Comprehension at Native Speed", s1: "Connected Speech & Reductions", s2: "Audio Dialogue Transcription" },
            { theme: "Conversational Idioms & Fluency Drills", s1: "Colloquial Sayings & Culture", s2: "Circumlocution & Spontaneous Talk" },
            { theme: "Spontaneous Discourse & Immersion", s1: "Debating Topics & Opinions", s2: "Full Conversational Synthesis" },
          ],
          music_audio: [
            { theme: "Ergonomics, Posture & First Notes", s1: "Hand Positioning & Instrument Tuning", s2: "Clean Fret/Key Tone Production" },
            { theme: "Basic Chords, Strumming & Metronome", s1: "Open Chords & Clean Fingering", s2: "Rhythm Patterns in 4/4 Time" },
            { theme: "Rapid Chord Transitions & Timing", s1: "Anchor Finger Pivot Drills", s2: "Playing Through Complete Progressions" },
            { theme: "Scales, Intervals & Ear Training", s1: "The Pentatonic Framework", s2: "Interval Recognition by Ear" },
            { theme: "Chord Construction & Progression Theory", s1: "Triads & Major/Minor Formulas", s2: "The Roman Numeral Harmonic System" },
            { theme: "Phrasing, Dynamics & Touch Sensitivity", s1: "Vibrato & Expressive Articulation", s2: "Pocket Timing & Dynamic Range" },
            { theme: "Repertoire Mastery & Song Breakdown", s1: "Deconstructing Complex Passages", s2: "End-to-End Song Practice" },
            { theme: "Studio Recording & Performance Capstone", s1: "High-Fidelity Audio Capture", s2: "Final Repertoire Performance" },
          ],
          design_ui: [
            { theme: "Visual Hierarchy & Spatial Grid", s1: "Optical Alignment & Hierarchy", s2: "8pt Spatial Grids & Spacing" },
            { theme: "Typography Scales & Color Theory", s1: "Modular Typography Systems", s2: "Accessible Color Contrast & Tokens" },
            { theme: "Auto-Layout & Frame Composition in Figma", s1: "Auto-Layout Hug & Fill Logic", s2: "Responsive Frame Breakpoints" },
            { theme: "User Research & Information Architecture", s1: "User Personas & Journey Maps", s2: "Low-Fidelity Wireframe Flows" },
            { theme: "Component Systems & Interactive Variants", s1: "Master Components & Properties", s2: "Interactive Variant States" },
            { theme: "Micro-Animations & Smart Prototyping", s1: "Smart Animate & Motion Curves", s2: "Variable Logic & Expressions" },
            { theme: "Usability Testing & Design Handoff", s1: "Heuristic Usability Auditing", s2: "Developer Redline Specs & Tokens" },
            { theme: "Portfolio Presentation & Final UI Capstone", s1: "Case Study Storytelling", s2: "Polished Interactive Showcase" },
          ],
          cloud_devops: [
            { theme: "Linux Primitives & Shell Automation", s1: "Linux File Systems & Permissions", s2: "Bash Scripting & Automation" },
            { theme: "Docker Containerization Essentials", s1: "Dockerfiles & Multi-Stage Builds", s2: "Docker Compose & Networks" },
            { theme: "Infrastructure as Code with Terraform", s1: "Terraform Providers & State", s2: "Modular Cloud Infrastructure" },
            { theme: "Kubernetes Pods, Deployments & Services", s1: "Pods, ReplicaSets & Deployments", s2: "Cluster Networking & Services" },
            { theme: "Kubernetes Ingress & Config Management", s1: "Ingress Controllers & TLS Certs", s2: "ConfigMaps, Secrets & Volumes" },
            { theme: "Automated CI/CD Delivery Pipelines", s1: "GitHub Actions Build Workflows", s2: "Automated Testing & Artifacts" },
            { theme: "Observability, Metrics & Telemetry", s1: "Prometheus Metrics & Grafana", s2: "Structured Logging & Alerting" },
            { theme: "Chaos Resilience & Zero-Downtime Releases", s1: "Rolling Updates & Canary Deploys", s2: "Disaster Recovery Runbooks" },
          ],
          cybersecurity: [
            { theme: "Network Protocols & Packet Inspection", s1: "TCP/IP & OSI Model Mechanics", s2: "Wireshark Packet Analysis" },
            { theme: "Reconnaissance & Vulnerability Scanning", s1: "Nmap Port & Service Scanning", s2: "Asset Discovery & Footprinting" },
            { theme: "Web Application Security Primitives", s1: "Authentication & Session Flaws", s2: "Injection Attacks (SQLi, XSS)" },
            { theme: "Access Control & Broken Authorizations", s1: "IDOR & Privilege Escalation", s2: "CSRF & Security Misconfigurations" },
            { theme: "Cryptography & Secure Communication", s1: "Symmetric vs Asymmetric Encryption", s2: "TLS Handshakes & Hash Invariants" },
            { theme: "Defensive Security & Blue Team Ops", s1: "SIEM Log Analysis & Threat Hunting", s2: "Firewalls, IDS & IPS Configuration" },
            { theme: "Exploitation Defense & Patch Verification", s1: "Binary Exploit Protection Models", s2: "Remediation & Patch Verification" },
            { theme: "Penetration Testing Capstone Audit", s1: "Full Scope Penetration Workflow", s2: "Executive Audit Report & Debrief" },
          ],
          business_finance: [
            { theme: "Core Mechanics & Unit Economics", s1: "Financial Statements & Metrics", s2: "Unit Economics: CAC & LTV" },
            { theme: "Market Analysis & Competitive Strategy", s1: "Market Sizing & Industry Forces", s2: "Value Proposition Architecture" },
            { theme: "Financial Modeling & Projection Frameworks", s1: "Cash Flow & Runway Projections", s2: "Scenario Analysis & Sensitivity" },
            { theme: "Acquisition Funnels & Growth Channels", s1: "Organic vs Paid Growth Levers", s2: "Conversion Rate Optimization (CRO)" },
            { theme: "Risk Assessment & Portfolio Allocation", s1: "Risk Modeling & Downside Hedge", s2: "Asset Allocation Strategies" },
            { theme: "Operational Scaling & Governance", s1: "KPI Dashboards & Instrumentation", s2: "Process Automation & Delegation" },
            { theme: "Valuation Science & Strategic Capital", s1: "DCF & Multiple-Based Valuation", s2: "Capital Allocation Discipline" },
            { theme: "Executive Synthesis & Strategic Capstone", s1: "Comprehensive Board Presentation", s2: "Long-Term Strategic Execution" },
          ],
          systems_backend: [
            { theme: "Memory Layouts, Pointers & System Primitives", s1: "Stack vs Heap & Memory Allocations", s2: "Pointers & Data Representations" },
            { theme: "Composite Structs & State Synchronization", s1: "Struct Memory Layout & Padding", s2: "Atomic Operations & Thread Safety" },
            { theme: "Concurrency Primitives & Channel Synchronization", s1: "Threads, Tasks & Goroutines", s2: "Channels & Mutex Locks" },
            { theme: "I/O Multiplexing & Network Socket Systems", s1: "Epoll, Kqueue & Event Loops", s2: "TCP Sockets & Framing Protocols" },
            { theme: "Database Storage Engines & ACID Transactions", s1: "B-Trees, LSM Trees & Write Ahead Logs", s2: "Transaction Isolation & Lock Contention" },
            { theme: "Distributed Consensus & Fault Tolerant Systems", s1: "Raft, Paxos & Leader Election", s2: "Vector Clocks & Data Replication" },
            { theme: "Profiling, Benchmarking & Cache Alignment", s1: "CPU Profiling & Allocation Auditing", s2: "Cache Line False Sharing" },
            { theme: "Enterprise Distributed Capstone Service", s1: "Resilient Microservice Cluster", s2: "Chaos Injection & Load Saturation" },
          ],
          general_mastery: [
            { theme: "Foundations, Vocabulary & First Principles", s1: "Core Terminology & Mental Models", s2: "Baseline Tools & Starting Exercises" },
            { theme: "Key Mechanics & Fundamental Drills", s1: "Step-by-Step Technique Execution", s2: "Repetition & Deliberate Practice" },
            { theme: "Applied Workflows & Process Composition", s1: "Structuring End-to-End Tasks", s2: "Intermediate Problem Solving" },
            { theme: "Common Pitfalls & Quality Auditing", s1: "Diagnosing Common Mistakes", s2: "Self-Correction & Refinement" },
            { theme: "Advanced Nuances & Deepening Skill", s1: "Speed, Precision & Efficiency", s2: "Handling Complex Edge Cases" },
            { theme: "Real-World Scenarios & Case Studies", s1: "Analyzing Professional Benchmarks", s2: "Applying Methods Under Constraint" },
            { theme: "Optimization, Polish & High Standards", s1: "Fine-Tuning Execution Polish", s2: "Professional Standards Review" },
            { theme: "Independent Mastery & Capstone Deliverable", s1: "Comprehensive Capstone Project", s2: "Long-Term Independent Practice" },
          ],
        };

        const themeList = universalThemesByCategory[category] || universalThemesByCategory.general_mastery;
        const themeIndex = (wkNum - 1) % themeList.length;
        const currentTheme = themeList[themeIndex];

        weekThemeTitle = `Week ${wkNum}: ${targetSubject} — ${currentTheme.theme}`;

        const sessionSpecs = [
          {
            title: `${targetSubject}: ${currentTheme.s1}`,
            objective: `Master the foundational techniques, principles, and practical application of ${currentTheme.s1} in the context of ${targetSubject}.`,
            concepts: [`${currentTheme.s1}`, `${targetSubject} Fundamentals`, "Practical Application"],
            queries: [
              `${targetSubject} ${currentTheme.s1.toLowerCase()} tutorial`,
              `${targetSubject} ${currentTheme.s1.toLowerCase()} for beginners explained`,
            ],
          },
          {
            title: `${targetSubject}: ${currentTheme.s2}`,
            objective: `Analyze, practice, and implement ${currentTheme.s2} to build fluency and eliminate errors in ${targetSubject}.`,
            concepts: [`${currentTheme.s2}`, `${targetSubject} Workflow`, "Best Practices"],
            queries: [
              `${targetSubject} ${currentTheme.s2.toLowerCase()} step by step`,
              `${targetSubject} ${currentTheme.s2.toLowerCase()} complete guide`,
            ],
          },
        ];

        weekSessions = sessionSpecs.slice(0, sessionsPerWeek).map((ms, sIdx) => ({
          id: `p${pIdx + 1}_w${wkNum}_s${sIdx + 1}`,
          title: ms.title,
          objective: ms.objective,
          estimated_minutes: minutesPerSession,
          concepts: ms.concepts,
          search_queries: [ms.queries[0], ms.queries[1]],
          target_video_minutes_range: "medium" as const,
          difficulty: pIdx === 0 ? "Beginner" : pIdx === 1 ? "Intermediate" : "Advanced",
        }));
      }

      phaseWeeks.push({
        number: wkNum,
        theme: weekThemeTitle,
        sessions: weekSessions,
      });

      currentWeekNumber++;
    }

    phases.push({
      id: `phase_${pIdx + 1}`,
      title: phaseTitle,
      goal: phaseGoal,
      project: phaseProject,
      weeks: phaseWeeks,
    });
  }

  const blueprintTitle = matchedBlueprint
    ? matchedBlueprint.title.toLowerCase().includes(targetSubject.toLowerCase())
      ? matchedBlueprint.title
      : `${targetSubject}: ${matchedBlueprint.title.replace(/\b(Language|Instrument)\b/gi, targetSubject)}`
    : `${targetSubject} Mastery Path`;

  return {
    refusal_reason: null,
    clarifying_question: null,
    plan: {
      title: blueprintTitle,
      summary: `A rigorous ${totalWeeks}-week curriculum tailored for ${intake.currentLevel} practitioners, budgeted at ${hours} hours/week across ${intake.learningStyle.join(", ")}.`,
      assumptions: [
        `Paced strictly for ${hours} hours per week with dedicated hands-on verification.`,
        `Sequenced by prerequisite dependency: fundamental abstractions precede operational optimizations.`,
        `Every session includes curated video lectures, architectural blueprints, and interactive checkpoints.`,
      ],
      phases,
    },
  };
}
