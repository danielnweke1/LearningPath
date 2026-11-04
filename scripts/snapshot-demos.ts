import fs from "fs";
import path from "path";
import { Plan } from "../src/types/plan";

const DEMOS_DIR = path.join(process.cwd(), "data", "demos");

const DEMO_CONFIGS = [
  {
    filename: "demo-1.json",
    intake: {
      goal: "Become a cloud security engineer",
      speciality: "Infrastructure & DevSecOps",
      growthIntent: "Switch fields" as const,
      currentLevel: "Intermediate" as const,
      hoursPerWeek: 6,
      targetWeeks: 12,
      learningStyle: ["Video-first" as const, "Hands-on projects" as const],
    },
    title: "Cloud Security Engineering Roadmap",
    summary:
      "A 12-week professional immersion into cloud security architectures, IAM enforcement, container runtime defense, and automated compliance auditing.",
    assumptions: [
      "Assumes working fluency with Linux CLI and standard TCP/IP networking primitives.",
      "Assumes basic cloud provider familiarity (AWS/GCP/Azure compute and storage).",
      "Paced at 6 hours per week combining conceptual security models and hands-on laboratory exercises.",
    ],
    phases: [
      {
        id: "p1",
        title: "Phase 1: Zero Trust Architecture & Identity Governance",
        goal: "Master least-privilege IAM policies, boundary enforcement, and cryptographic secrets management.",
        project: {
          title: "Phase 1 Milestone: Multi-Account Least-Privilege IAM Boundary Suite",
          brief:
            "Architect and deploy a hardened AWS/GCP IAM permission boundary hierarchy with automated policy linting and break-glass temporary elevation.",
          acceptance_criteria: [
            "Zero wildcard (*) actions on data-tier resources",
            "Automated CI/CD policy validation blocking overly permissive roles",
            "MFA-enforced session token generation for administrative operations",
          ],
          stretch: "Integrate automated revocation triggers based on anomaly alerts in CloudTrail.",
        },
        weeks: [
          {
            number: 1,
            theme: "Week 1: Identity & Access Management (IAM) Deep Dive",
            sessions: [
              {
                id: "d1_w1_s1",
                title: "IAM Policy Evaluation Logic & Permission Boundaries",
                objective:
                  "Understand the precise deterministic evaluation order of AWS IAM policies (explicit denies, boundaries, SCPs, and session policies).",
                estimated_minutes: 60,
                concepts: ["Explicit Deny", "Permission Boundaries", "Service Control Policies", "ABAC vs RBAC"],
                search_queries: ["AWS IAM policy evaluation logic deep dive", "Cloud IAM permission boundaries tutorial"],
                target_video_minutes_range: "medium" as const,
                difficulty: "Intermediate" as const,
                video: {
                  videoId: "b0i_Z2R06vY",
                  title: "AWS Security Specialty Course: Deep Dive into IAM Policies",
                  channel: "freeCodeCamp.org",
                  duration: "18:42",
                  durationSeconds: 1122,
                  thumbnail: "https://i.ytimg.com/vi/b0i_Z2R06vY/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=b0i_Z2R06vY",
                  why: "Clear breakdown of policy evaluation algorithms and common evaluation pitfalls with production examples.",
                  views: 184000,
                },
                alternate_video: {
                  videoId: "Z3xS_6d8w4w",
                  title: "Mastering AWS Identity and Access Management",
                  channel: "AWS Events",
                  duration: "42:15",
                  durationSeconds: 2535,
                  thumbnail: "https://i.ytimg.com/vi/Z3xS_6d8w4w/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=Z3xS_6d8w4w",
                  why: "Official architectural overview detailing permission boundaries at enterprise scale.",
                  views: 92000,
                },
                checkpoints: [
                  {
                    id: "chk_1",
                    type: "multiple_choice" as const,
                    question: "When evaluating an AWS request, what occurs if both an Allow and an Explicit Deny match?",
                    options: [
                      "The Explicit Deny always overrides any Allow",
                      "The Allow overrides if placed on an inline policy",
                      "The newer policy takes precedence",
                      "The request triggers a 409 conflict error",
                    ],
                    correctIndex: 0,
                    explanation: "Explicit Deny always supersedes any Allow in AWS evaluation logic.",
                  },
                  {
                    id: "chk_2",
                    type: "multiple_choice" as const,
                    question: "What is the primary role of a Permission Boundary on an IAM principal?",
                    options: [
                      "It grants permissions automatically to new users",
                      "It sets the maximum possible permissions an entity can be granted",
                      "It replaces the need for resource-based policies",
                      "It encrypts credentials in transit",
                    ],
                    correctIndex: 1,
                    explanation: "Permission boundaries set the outer limit of allowable permissions without granting rights on their own.",
                  },
                  {
                    id: "chk_3",
                    type: "practical_task" as const,
                    question: "Hands-on Verification: Test IAM Evaluation Order",
                    options: [
                      "Simulated policy evaluation via CLI/Console confirming explicit deny precedence",
                      "Skipped simulation due to credential setup",
                      "Created an unrestricted admin policy to test connectivity",
                      "Disabled root MFA",
                    ],
                    correctIndex: 0,
                    taskCriteria: "Run AWS IAM policy simulator or terraform policy test confirming boundary limits.",
                    explanation: "Testing with simulation tools proves least-privilege boundary boundaries hold.",
                  },
                ],
              },
              {
                id: "d1_w1_s2",
                title: "Secrets Management & Cryptographic Key Rings",
                objective:
                  "Design automated key rotation, envelope encryption with KMS, and dynamic database credentials injection.",
                estimated_minutes: 60,
                concepts: ["Envelope Encryption", "KMS Key Policies", "Automated Rotation", "Secrets Manager"],
                search_queries: ["Cloud KMS envelope encryption explained", "AWS Secrets Manager automated rotation"],
                target_video_minutes_range: "medium" as const,
                difficulty: "Intermediate" as const,
                video: {
                  videoId: "jhXA_qE5iQ4",
                  title: "Cloud Cryptography & Envelope Encryption Explained",
                  channel: "TechWorld with Nana",
                  duration: "15:10",
                  durationSeconds: 910,
                  thumbnail: "https://i.ytimg.com/vi/jhXA_qE5iQ4/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=jhXA_qE5iQ4",
                  why: "Visual explanation of customer master keys, data keys, and the mathematical mechanics of envelope encryption.",
                  views: 142000,
                },
                alternate_video: {
                  videoId: "4f_L4hB9pZ0",
                  title: "Cloud Key Management Deep Dive",
                  channel: "John Savill's Technical Training",
                  duration: "24:30",
                  durationSeconds: 1470,
                  thumbnail: "https://i.ytimg.com/vi/4f_L4hB9pZ0/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=4f_L4hB9pZ0",
                  why: "Comprehensive walkthrough of hardware security modules (HSMs) and cloud key ring hierarchies.",
                  views: 78000,
                },
                checkpoints: [
                  {
                    id: "chk_1",
                    type: "multiple_choice" as const,
                    question: "Why is envelope encryption preferred over direct KMS encryption for large payloads?",
                    options: [
                      "KMS API enforces a 4KB plaintext limit and network round-trips for large data degrade throughput",
                      "KMS does not support symmetric keys",
                      "Plaintext data must never be decrypted",
                      "Envelope encryption eliminates key rotation requirements",
                    ],
                    correctIndex: 0,
                    explanation: "KMS encrypts the data encryption key (DEK) locally, avoiding round-trips of bulk data over the API.",
                  },
                ],
              },
            ],
          },
          {
            number: 2,
            theme: "Week 2: Cloud Network Segmentation & Perimeter Defense",
            sessions: [
              {
                id: "d1_w2_s1",
                title: "VPC Peering, Transit Gateways & PrivateLink Architecture",
                objective:
                  "Isolate microservices into dedicated subnets and route internal traffic without internet gateway exposure.",
                estimated_minutes: 60,
                concepts: ["Transit Gateway", "AWS PrivateLink", "VPC Flow Logs", "Network Access Control Lists"],
                search_queries: ["AWS VPC peering transit gateway architecture", "Cloud network security private link"],
                target_video_minutes_range: "medium" as const,
                difficulty: "Intermediate" as const,
                video: {
                  videoId: "k1RI5locZE4",
                  title: "AWS Networking Masterclass: VPCs, Subnets & Transit Gateways",
                  channel: "freeCodeCamp.org",
                  duration: "22:15",
                  durationSeconds: 1335,
                  thumbnail: "https://i.ytimg.com/vi/k1RI5locZE4/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=k1RI5locZE4",
                  why: "Hands-on walkthrough of secure subnet topology, route tables, and VPC endpoints.",
                  views: 310000,
                },
              },
            ],
          },
        ],
      },
      {
        id: "p2",
        title: "Phase 2: Container & Kubernetes Security Hardening",
        goal: "Implement immutable container supply chains, vulnerability scanning, and eBPF runtime observability.",
        project: {
          title: "Phase 2 Milestone: Hardened Kubernetes Cluster with Admission Control",
          brief: "Deploy an Amazon EKS / GKE cluster with Kyverno/OPA Gatekeeper enforcing non-root execution and cosign signature verification.",
          acceptance_criteria: [
            "All pods blocked if running as root user (UID 0)",
            "Unsigned container images rejected at admission webhook",
            "NetworkPolicies restricting pod-to-pod lateral movement",
          ],
          stretch: "Deploy Cilium with eBPF-based L7 network monitoring and automated anomalous egress drops.",
        },
        weeks: [
          {
            number: 3,
            theme: "Week 3: Container Image Security & Supply Chain Defense",
            sessions: [
              {
                id: "d1_w3_s1",
                title: "SLSA Framework, SBOM Generation & Image Signing with Cosign",
                objective: "Build a reproducible container pipeline generating SPDX SBOMs and cryptographic attestations.",
                estimated_minutes: 60,
                concepts: ["Cosign", "Sigstore", "Trivy", "SBOM", "SLSA"],
                search_queries: ["Cosign container signing tutorial", "Software supply chain security SLSA"],
                target_video_minutes_range: "medium" as const,
                difficulty: "Intermediate" as const,
                video: {
                  videoId: "3c-iBn73dDE",
                  title: "Container Security: Scanning, Signing & Verification",
                  channel: "TechWorld with Nana",
                  duration: "19:40",
                  durationSeconds: 1180,
                  thumbnail: "https://i.ytimg.com/vi/3c-iBn73dDE/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=3c-iBn73dDE",
                  why: "Covers automated scanning in CI/CD, signing with Cosign, and verifying in Kubernetes.",
                  views: 95000,
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    filename: "demo-2.json",
    intake: {
      goal: "Learn Python for data analysis",
      speciality: "Business Analytics & Tabular Data",
      growthIntent: "Start from zero" as const,
      currentLevel: "Beginner" as const,
      hoursPerWeek: 5,
      targetWeeks: 8,
      learningStyle: ["Video-first" as const, "Hands-on projects" as const],
    },
    title: "Python for Data Analysis: Zero to Practical Insights",
    summary:
      "An 8-week foundational roadmap designed for beginners to confidently clean, transform, analyze, and visualize real-world datasets with Python, NumPy, Pandas, and Seaborn.",
    assumptions: [
      "No previous programming background required.",
      "Workload structured for 5 hours per week with immediate interactive notebook exercises.",
      "Focuses on practical tabular data operations, missing value handling, and exploratory data analysis (EDA).",
    ],
    phases: [
      {
        id: "p1",
        title: "Phase 1: Python Fundamentals & Data Structures",
        goal: "Master Python syntax, collections (lists, dictionaries, sets), and vectorized numerical computation with NumPy.",
        project: {
          title: "Phase 1 Milestone: Multi-Source Sales Transaction Analyzer",
          brief:
            "Write a Python script that ingests multiple messy CSV files, parses date strings, cleans invalid currencies, and computes statistical summaries using NumPy arrays.",
          acceptance_criteria: [
            "Handles corrupted rows without throwing uncaught exceptions",
            "Computes mean, median, standard deviation, and percentiles for revenue",
            "Outputs a formatted summary report to stdout and clean CSV",
          ],
          stretch: "Benchmark performance difference between Python loops and vectorized NumPy operations.",
        },
        weeks: [
          {
            number: 1,
            theme: "Week 1: Python Environment & Core Primitives",
            sessions: [
              {
                id: "d2_w1_s1",
                title: "Python Basics, Control Flow & Data Types",
                objective:
                  "Install Jupyter Notebooks, write foundational Python variables, conditional statements, and loops for data processing.",
                estimated_minutes: 50,
                concepts: ["Variables", "Data Types", "Conditionals", "Loops", "Functions"],
                search_queries: ["Python for beginners full course freecodecamp", "Python variables loops tutorial"],
                target_video_minutes_range: "long" as const,
                difficulty: "Beginner" as const,
                video: {
                  videoId: "r-uOLxNrNk8",
                  title: "Python for Data Analysis - Full Course for Beginners",
                  channel: "freeCodeCamp.org",
                  duration: "4:24:00",
                  durationSeconds: 15840,
                  thumbnail: "https://i.ytimg.com/vi/r-uOLxNrNk8/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=r-uOLxNrNk8",
                  why: "Clear pacing starting from installation through practical functions, structured specifically for data learners.",
                  views: 1250000,
                },
                alternate_video: {
                  videoId: "GPVsHOlRBBI",
                  title: "Data Analysis with Python Course",
                  channel: "freeCodeCamp.org",
                  duration: "4:15:30",
                  durationSeconds: 15330,
                  thumbnail: "https://i.ytimg.com/vi/GPVsHOlRBBI/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=GPVsHOlRBBI",
                  why: "Thorough visual breakdown of computational concepts in Jupyter Notebook.",
                  views: 890000,
                },
                checkpoints: [
                  {
                    id: "chk_1",
                    type: "multiple_choice" as const,
                    question: "Which Python data structure is unordered, mutable, and stores key-value pairs?",
                    options: ["List", "Dictionary", "Tuple", "String"],
                    correctIndex: 1,
                    explanation: "Dictionaries store key-value associations and allow constant-time O(1) lookups.",
                  },
                  {
                    id: "chk_2",
                    type: "multiple_choice" as const,
                    question: "What is the primary difference between a list and a tuple in Python?",
                    options: [
                      "Lists are mutable while tuples are immutable",
                      "Tuples can only store integers",
                      "Lists cannot be sliced",
                      "There is no difference in behavior",
                    ],
                    correctIndex: 0,
                    explanation: "Tuples cannot be altered once instantiated (immutable), making them safe for static records.",
                  },
                  {
                    id: "chk_3",
                    type: "practical_task" as const,
                    question: "Hands-on Verification: Write a function calculating filtered sum",
                    options: [
                      "Implemented function with list comprehension and verified with sample inputs",
                      "Used a manual calculator",
                      "Skipped test run",
                      "Relied on hardcoded return value",
                    ],
                    correctIndex: 0,
                    taskCriteria: "Write a function `sum_positives(numbers)` returning sum of all numbers > 0.",
                    explanation: "Validates functional comprehension of loops and conditionals.",
                  },
                ],
              },
              {
                id: "d2_w1_s2",
                title: "Vectorized Numerical Computing with NumPy",
                objective: "Create multidimensional arrays, perform mathematical slicing, and utilize boolean indexing.",
                estimated_minutes: 50,
                concepts: ["NumPy ndarray", "Broadcasting", "Vectorization", "Boolean Masking"],
                search_queries: ["NumPy full tutorial for beginners", "NumPy array broadcasting explained"],
                target_video_minutes_range: "medium" as const,
                difficulty: "Beginner" as const,
                video: {
                  videoId: "daefaLgNkw0",
                  title: "NumPy Full Course - Python NumPy Tutorial",
                  channel: "freeCodeCamp.org",
                  duration: "58:12",
                  durationSeconds: 3492,
                  thumbnail: "https://i.ytimg.com/vi/daefaLgNkw0/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=daefaLgNkw0",
                  why: "Teaches vectorization and array indexing without overwhelming mathematical jargon.",
                  views: 450000,
                },
              },
            ],
          },
          {
            number: 2,
            theme: "Week 2: Data Wrangling with Pandas",
            sessions: [
              {
                id: "d2_w2_s1",
                title: "DataFrames, Series, and Data Ingestion",
                objective: "Load CSV/Excel files into Pandas, inspect head/tail/info, and perform column selections.",
                estimated_minutes: 50,
                concepts: ["DataFrame", "Series", "read_csv", "loc and iloc"],
                search_queries: ["Pandas tutorial Corey Schafer", "Pandas DataFrame basics Python"],
                target_video_minutes_range: "medium" as const,
                difficulty: "Beginner" as const,
                video: {
                  videoId: "LHBE6Q9XlzI",
                  title: "Python Pandas Tutorial: Getting Started with DataFrames",
                  channel: "Corey Schafer",
                  duration: "18:24",
                  durationSeconds: 1104,
                  thumbnail: "https://i.ytimg.com/vi/LHBE6Q9XlzI/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=LHBE6Q9XlzI",
                  why: "Standard gold-standard instructional series on DataFrame mechanics.",
                  views: 780000,
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    filename: "demo-3.json",
    intake: {
      goal: "Move from software developer to AI engineer",
      speciality: "LLM Orchestration, RAG & Agentic Systems",
      growthIntent: "Level up in current area" as const,
      currentLevel: "Intermediate" as const,
      hoursPerWeek: 8,
      targetWeeks: 10,
      learningStyle: ["Video-first" as const, "Hands-on projects" as const],
    },
    title: "AI Engineer: Systems, Embeddings, RAG & Autonomous Agents",
    summary:
      "A 10-week intensive bridge for software engineers transitioning to building production AI applications, vector retrieval architectures, structured outputs, and eval-driven autonomous agent loops.",
    assumptions: [
      "Assumes solid familiarity with backend APIs (Python or TypeScript) and Git.",
      "Skips generic programming introductions and dives straight into transformer inference and prompt orchestration.",
      "Workload structured for 8 hours per week with end-to-end coding assignments.",
    ],
    phases: [
      {
        id: "p1",
        title: "Phase 1: Transformer Foundations, Tokenization & Prompt Engineering",
        goal: "Understand how autoregressive transformers work under the hood and implement deterministic structured outputs.",
        project: {
          title: "Phase 1 Milestone: Eval-Driven Extraction Engine with JSON Schemas",
          brief:
            "Build a production document extraction pipeline using structured outputs, few-shot prompting, and automated regression evaluations measuring accuracy against a benchmark test set.",
          acceptance_criteria: [
            "100% schema validation compliance across 100 test documents using Zod/Pydantic",
            "Automated cost and token latency logging per run",
            "Regression test harness comparing prompt iterations",
          ],
          stretch: "Add synthetic data generation loop to bootstrap domain edge cases.",
        },
        weeks: [
          {
            number: 1,
            theme: "Week 1: Transformer Architecture & Generative Inference",
            sessions: [
              {
                id: "d3_w1_s1",
                title: "How Large Language Models Work: Pre-training, Fine-Tuning & RLHF",
                objective:
                  "Grasp tokenization mechanics, context windows, sampling parameters (temperature, top_p), and the distinction between base and instruction-tuned models.",
                estimated_minutes: 60,
                concepts: ["Tokenization", "Attention Mechanism", "Sampling", "System Prompts"],
                search_queries: ["Intro to Large Language Models Andrej Karpathy", "How LLMs work transformer architecture"],
                target_video_minutes_range: "long" as const,
                difficulty: "Intermediate" as const,
                video: {
                  videoId: "zjkBMFhNj_g",
                  title: "Intro to Large Language Models",
                  channel: "Andrej Karpathy",
                  duration: "59:45",
                  durationSeconds: 3585,
                  thumbnail: "https://i.ytimg.com/vi/zjkBMFhNj_g/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
                  why: "The definitive high-clarity engineering lecture on the entire modern LLM stack by former Tesla AI director.",
                  views: 2800000,
                },
                alternate_video: {
                  videoId: "aircAruvnKk",
                  title: "But what is a neural network? | Deep learning, chapter 1",
                  channel: "3Blue1Brown",
                  duration: "19:13",
                  durationSeconds: 1153,
                  thumbnail: "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=aircAruvnKk",
                  why: "Intuitive geometric and mathematical foundation of matrix weights and activation functions.",
                  views: 14500000,
                },
                checkpoints: [
                  {
                    id: "chk_1",
                    type: "multiple_choice" as const,
                    question: "Why does lowering temperature close to 0 produce more deterministic model output?",
                    options: [
                      "It sharpens the token probability distribution, favoring highest-probability logits",
                      "It increases context window size",
                      "It skips self-attention layers entirely",
                      "It forces the model to use cached responses",
                    ],
                    correctIndex: 0,
                    explanation: "Lowering temperature scales down the logits before softmax, concentrating probabilities on the greedy top candidate.",
                  },
                  {
                    id: "chk_2",
                    type: "multiple_choice" as const,
                    question: "What is the primary cause of hallucination in autoregressive models?",
                    options: [
                      "Next-token prediction optimizes statistical plausibility rather than ground truth verification",
                      "GPU hardware floating-point roundoff errors",
                      "Insufficient RAM allocation on inference hosts",
                      "Using JSON output format",
                    ],
                    correctIndex: 0,
                    explanation: "Autoregressive generation predicts the most plausible continuation given prior tokens without an external verification oracle.",
                  },
                  {
                    id: "chk_3",
                    type: "practical_task" as const,
                    question: "Hands-on Verification: Compute token costs and latency",
                    options: [
                      "Measured token consumption and latency using tiktoken/tokenizer",
                      "Guessed cost based on word count",
                      "Skipped cost calculation",
                      "Used unlimited token budget",
                    ],
                    correctIndex: 0,
                    taskCriteria: "Calculate token count for a 500-word prompt using BPE tokenizer and compute cost.",
                    explanation: "Understanding token economics is critical for AI software architecture.",
                  },
                ],
              },
              {
                id: "d3_w1_s2",
                title: "Building GPT from Scratch: PyTorch Implementation",
                objective:
                  "Implement a character-level transformer decoder with multi-head self-attention to master tensor shapes and causal masking.",
                estimated_minutes: 75,
                concepts: ["Self-Attention", "Causal Masking", "Residual Connections", "LayerNorm"],
                search_queries: ["Lets build GPT Andrej Karpathy", "Transformer self attention code from scratch"],
                target_video_minutes_range: "long" as const,
                difficulty: "Advanced" as const,
                video: {
                  videoId: "kCc8FmEb1nY",
                  title: "Let's build GPT: from scratch, in code, spelled out.",
                  channel: "Andrej Karpathy",
                  duration: "1:56:00",
                  durationSeconds: 6960,
                  thumbnail: "https://i.ytimg.com/vi/kCc8FmEb1nY/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
                  why: "Masterclass breaking down every line of code behind transformer attention mechanisms.",
                  views: 4100000,
                },
              },
            ],
          },
          {
            number: 2,
            theme: "Week 2: Embeddings & Vector Retrieval (RAG Foundations)",
            sessions: [
              {
                id: "d3_w2_s1",
                title: "Dense Vector Embeddings, Chunking Strategies & Cosine Similarity",
                objective:
                  "Convert unstructured text into high-dimensional embedding spaces, implement semantic chunking, and benchmark vector search.",
                estimated_minutes: 60,
                concepts: ["Vector Embeddings", "HNSW Indexing", "Chunking Strategies", "Reranking"],
                search_queries: ["Vector databases explained RAG tutorial", "Embeddings and similarity search full course"],
                target_video_minutes_range: "medium" as const,
                difficulty: "Intermediate" as const,
                video: {
                  videoId: "9vM4p9NN0Ts",
                  title: "Building LLM Applications with Vector Databases & RAG",
                  channel: "freeCodeCamp.org",
                  duration: "1:20:15",
                  durationSeconds: 4815,
                  thumbnail: "https://i.ytimg.com/vi/9vM4p9NN0Ts/hqdefault.jpg",
                  url: "https://www.youtube.com/watch?v=9vM4p9NN0Ts",
                  why: "Practical implementation of embedding generation, ingestion into vector stores, and prompt context stuffing.",
                  views: 320000,
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

async function main() {
  if (!fs.existsSync(DEMOS_DIR)) {
    fs.mkdirSync(DEMOS_DIR, { recursive: true });
  }

  for (const config of DEMO_CONFIGS) {
    const filePath = path.join(DEMOS_DIR, config.filename);
    const plan: Plan = {
      id: `demo_${config.filename.replace(".json", "")}`,
      title: config.title,
      summary: config.summary,
      assumptions: config.assumptions,
      intake: config.intake,
      phases: config.phases as any,
      created_at: new Date().toISOString(),
      isDemo: true,
    };

    fs.writeFileSync(filePath, JSON.stringify(plan, null, 2), "utf-8");
    console.log(`✓ Wrote demo snapshot: ${filePath}`);
  }

  console.log("All 3 demo snapshots created successfully!");
}

main().catch((err) => {
  console.error("Error creating demo snapshots:", err);
  process.exit(1);
});
