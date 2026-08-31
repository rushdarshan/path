"use strict";

// Knowledge graph: domains -> topics -> concepts -> resources, with prerequisite
// edges, difficulty levels, and learning-style affinities.
//
// level: 1=founded, 2=working, 3=fluent, 4=expert (rough expected exposure)
// estHours: median hours for average learner to reach working competence
// prereqs: topic ids that must come earlier
// concepts: {name, weight} the concept-to-skill decomposition used for mastery
// resources: {title, url, kind: video|article|course|interactive|book, minutes}

const DOMAIN_META = {
  programming: { name: "Programming Foundations", color: "#e5484d" },
  web: { name: "Web Development", color: "#0091ff" },
  data: { name: "Data & Analytics", color: "#46a758" },
  ml: { name: "Machine Learning & AI", color: "#8e4ec6" },
  cloud: { name: "Cloud & DevOps", color: "#f76b15" },
  security: { name: "Cybersecurity", color: "#0d74ce" },
  game: { name: "Game Development", color: "#e93d82" },
  mobile: { name: "Mobile Development", color: "#12a594" },
  product: { name: "Product & Design", color: "#e5484d" },
  languages: { name: "Human Languages", color: "#3dd68c" },
};

const TOPICS = [
  // ---------------- Programming Foundations ----------------
  {
    id: "programming-basics", domain: "programming", name: "Programming Basics",
    level: 1, estHours: 40,
    prereqs: [],
    keywords: ["python", "programming", "coding", "first language", "beginner"],
    concepts: [
      { name: "variables", weight: 1.0 }, { name: "data-types", weight: 1.0 },
      { name: "control-flow", weight: 1.0 }, { name: "functions", weight: 1.2 },
      { name: "debugging", weight: 0.9 },
    ],
    resources: [
      { title: "Harvard CS50", url: "https://cs50.harvard.edu/x/", kind: "course", minutes: 900 },
      { title: "Python.org Beginner Tutorial", url: "https://docs.python.org/3/tutorial/", kind: "interactive", minutes: 300 },
      { title: "freeCodeCamp Python", url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/", kind: "course", minutes: 600 },
    ],
    styles: { visual: 0.3, reading: 0.6, hands: 0.7, auditory: 0.2 },
  },
  {
    id: "git-version-control", domain: "programming", name: "Git & Version Control",
    level: 1, estHours: 12,
    prereqs: ["programming-basics"],
    keywords: ["git", "github", "version control"],
    concepts: [
      { name: "commits", weight: 1.0 }, { name: "branching", weight: 1.2 },
      { name: "merging", weight: 1.0 }, { name: "remotes-and-pull-requests", weight: 1.1 },
    ],
    resources: [
      { title: "Git official docs", url: "https://git-scm.com/doc", kind: "article", minutes: 180 },
      { title: "Learn Git Branching (interactive)", url: "https://learngitbranching.js.org/", kind: "interactive", minutes: 180 },
    ],
    styles: { visual: 0.8, reading: 0.3, hands: 0.9, auditory: 0.2 },
  },
  {
    id: "data-structures-algorithms", domain: "programming", name: "Data Structures & Algorithms",
    level: 2, estHours: 60,
    prereqs: ["programming-basics"],
    keywords: ["algorithms", "data structures", "interview prep", "dsa"],
    concepts: [
      { name: "arrays-and-strings", weight: 1.0 }, { name: "hash-maps", weight: 1.1 },
      { name: "linked-lists-stacks-queues", weight: 1.0 }, { name: "trees-graphs", weight: 1.3 },
      { name: "sorting-searching", weight: 1.1 }, { name: "recursion-dp", weight: 1.4 },
    ],
    resources: [
      { title: "NeetCode.io", url: "https://neetcode.io/", kind: "interactive", minutes: 1200 },
      { title: "Coursera Algorithms I (Princeton)", url: "https://www.coursera.org/learn/algorithms-part1", kind: "course", minutes: 600 },
      { title: "CS Dojo YouTube", url: "https://www.youtube.com/@CSDojo", kind: "video", minutes: 240 },
    ],
    styles: { visual: 0.6, reading: 0.4, hands: 0.9, auditory: 0.3 },
  },

  // ---------------- Web Development ----------------
  {
    id: "html-css", domain: "web", name: "HTML & CSS Foundations",
    level: 1, estHours: 30,
    prereqs: [],
    keywords: ["html", "css", "frontend", "web design", "websites"],
    concepts: [
      { name: "html-semantics", weight: 1.0 }, { name: "css-selectors", weight: 1.0 },
      { name: "box-model-layout", weight: 1.2 }, { name: "flexbox-grid", weight: 1.2 },
      { name: "responsive-design", weight: 1.1 },
    ],
    resources: [
      { title: "MDN HTML Tutorial", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", kind: "article", minutes: 300 },
      { title: "freeCodeCamp Responsive Web Design", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/", kind: "course", minutes: 600 },
      { title: "Flexbox Froggy", url: "https://flexboxfroggy.com/", kind: "interactive", minutes: 45 },
    ],
    styles: { visual: 0.9, reading: 0.4, hands: 0.8, auditory: 0.2 },
  },
  {
    id: "javascript-core", domain: "web", name: "JavaScript Core",
    level: 1, estHours: 45,
    prereqs: ["programming-basics"],
    keywords: ["javascript", "js", "vanilla js", "web scripting"],
    concepts: [
      { name: "syntax-and-types", weight: 1.0 }, { name: "functions-scope-closures", weight: 1.3 },
      { name: "arrays-objects", weight: 1.1 }, { name: "asynchronous-js", weight: 1.4 },
      { name: "dom-manipulation", weight: 1.1 },
    ],
    resources: [
      { title: "MDN JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", kind: "article", minutes: 400 },
      { title: "JavaScript.info", url: "https://javascript.info/", kind: "interactive", minutes: 800 },
      { title: "The Odin Project", url: "https://www.theodinproject.com/paths/foundations", kind: "course", minutes: 500 },
    ],
    styles: { visual: 0.4, reading: 0.7, hands: 0.8, auditory: 0.3 },
  },
  {
    id: "react-frontend", domain: "web", name: "React Frontend Development",
    level: 2, estHours: 55,
    prereqs: ["javascript-core", "html-css"],
    keywords: ["react", "frontend framework", "spa", "components", "hooks"],
    concepts: [
      { name: "components-and-props", weight: 1.0 }, { name: "state-and-hooks", weight: 1.3 },
      { name: "effects-and-lifecycle", weight: 1.2 }, { name: "routing", weight: 0.9 },
      { name: "api-integration", weight: 1.0 }, { name: "state-management", weight: 1.1 },
    ],
    resources: [
      { title: "React official docs", url: "https://react.dev/learn", kind: "course", minutes: 500 },
      { title: "Epic React (Kent C. Dodds)", url: "https://www.epicreact.dev/", kind: "course", minutes: 900 },
      { title: "Scrimba Learn React", url: "https://scrimba.com/learn/learnreact", kind: "interactive", minutes: 400 },
    ],
    styles: { visual: 0.5, reading: 0.6, hands: 0.8, auditory: 0.3 },
  },
  {
    id: "node-backend", domain: "web", name: "Node.js & Backend APIs",
    level: 2, estHours: 50,
    prereqs: ["javascript-core"],
    keywords: ["node", "backend", "api", "express", "server"],
    concepts: [
      { name: "node-module-system", weight: 1.0 }, { name: "http-and-routing", weight: 1.1 },
      { name: "rest-api-design", weight: 1.2 }, { name: "middleware-auth", weight: 1.1 },
      { name: "databases-integration", weight: 1.0 },
    ],
    resources: [
      { title: "Node.js official docs", url: "https://nodejs.org/docs/latest/api/", kind: "article", minutes: 400 },
      { title: "The Odin Project Node Path", url: "https://www.theodinproject.com/paths/full-stack-javascript", kind: "course", minutes: 700 },
      { title: "Express tutorial (MDN)", url: "https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs", kind: "course", minutes: 500 },
    ],
    styles: { visual: 0.3, reading: 0.7, hands: 0.8, auditory: 0.2 },
  },
  {
    id: "databases-sql", domain: "data", name: "Databases & SQL",
    level: 1, estHours: 30,
    prereqs: [],
    keywords: ["sql", "database", "postgres", "mysql", "data"],
    concepts: [
      { name: "sql-queries", weight: 1.0 }, { name: "joins", weight: 1.3 },
      { name: "aggregations", weight: 1.0 }, { name: "schema-design-normalization", weight: 1.1 },
      { name: "indexing", weight: 1.0 },
    ],
    resources: [
      { title: "SQLBolt (interactive)", url: "https://sqlbolt.com/", kind: "interactive", minutes: 120 },
      { title: "PostgreSQL Tutorial", url: "https://www.postgresqltutorial.com/", kind: "article", minutes: 300 },
      { title: "Stanford DB Course", url: "https://www.coursera.org/learn/database-sql", kind: "course", minutes: 400 },
    ],
    styles: { visual: 0.5, reading: 0.6, hands: 0.7, auditory: 0.2 },
  },
  {
    id: "fullstack-projects", domain: "web", name: "Full-Stack Project Lab",
    level: 3, estHours: 60,
    prereqs: ["react-frontend", "node-backend", "databases-sql"],
    keywords: ["fullstack", "portfolio project", "capstone"],
    concepts: [
      { name: "architecture-and-planning", weight: 1.0 }, { name: "crud-application", weight: 1.1 },
      { name: "auth-and-security", weight: 1.2 }, { name: "deployment", weight: 1.0 },
      { name: "testing", weight: 0.9 },
    ],
    resources: [
      { title: "Build a CRUD app (roadmap.sh)", url: "https://roadmap.sh/full-stack", kind: "article", minutes: 200 },
      { title: "NetNinja Full Stack Course", url: "https://www.youtube.com/@NetNinja", kind: "video", minutes: 700 },
    ],
    styles: { visual: 0.6, reading: 0.4, hands: 0.9, auditory: 0.3 },
  },

  // ---------------- Data & Analytics ----------------
  {
    id: "python-for-data", domain: "data", name: "Python for Data Analysis",
    level: 2, estHours: 40,
    prereqs: ["programming-basics"],
    keywords: ["python data", "pandas", "numpy", "data analysis"],
    concepts: [
      { name: "pandas-dataframes", weight: 1.3 }, { name: "numpy-arrays", weight: 1.0 },
      { name: "data-cleaning", weight: 1.2 }, { name: "data-visualization", weight: 1.0 },
      { name: "eda-reporting", weight: 1.0 },
    ],
    resources: [
      { title: "Kaggle Learn Python + Pandas", url: "https://www.kaggle.com/learn", kind: "course", minutes: 400 },
      { title: "Python for Data Analysis (book)", url: "https://wesmckinney.com/book/", kind: "book", minutes: 800 },
      { title: "Corey Schafer Pandas", url: "https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS", kind: "video", minutes: 300 },
    ],
    styles: { visual: 0.7, reading: 0.5, hands: 0.8, auditory: 0.3 },
  },
  {
    id: "statistics-foundations", domain: "data", name: "Statistics Foundations",
    level: 1, estHours: 30,
    prereqs: [],
    keywords: ["statistics", "probability", "stats"],
    concepts: [
      { name: "descriptive-statistics", weight: 1.0 }, { name: "probability", weight: 1.1 },
      { name: "distributions", weight: 1.1 }, { name: "hypothesis-testing", weight: 1.3 },
      { name: "correlation-regression", weight: 1.1 },
    ],
    resources: [
      { title: "Khan Academy Statistics", url: "https://www.khanacademy.org/math/statistics-probability", kind: "course", minutes: 600 },
      { title: "Seeing Theory (visual)", url: "https://seeing-theory.brown.edu/", kind: "interactive", minutes: 120 },
      { title: "StatQuest YouTube", url: "https://www.youtube.com/@statquest", kind: "video", minutes: 400 },
    ],
    styles: { visual: 0.8, reading: 0.4, hands: 0.5, auditory: 0.5 },
  },
  {
    id: "business-analytics", domain: "data", name: "Business Analytics & Dashboards",
    level: 2, estHours: 35,
    prereqs: ["databases-sql"],
    keywords: ["power bi", "tableau", "analytics", "dashboards", "kpis", "bi"],
    concepts: [
      { name: "kpi-definition", weight: 1.0 }, { name: "visual-dashboards", weight: 1.1 },
      { name: "sql-for-reporting", weight: 1.0 }, { name: "storytelling-with-data", weight: 1.0 },
    ],
    resources: [
      { title: "Tableau Starter", url: "https://www.tableau.com/learn", kind: "course", minutes: 300 },
      { title: "Mode SQL Analytics", url: "https://mode.com/sql-tutorial/", kind: "article", minutes: 400 },
    ],
    styles: { visual: 0.9, reading: 0.4, hands: 0.7, auditory: 0.2 },
  },

  // ---------------- Machine Learning & AI ----------------
  {
    id: "ml-basics", domain: "ml", name: "Machine Learning Fundamentals",
    level: 2, estHours: 60,
    prereqs: ["statistics-foundations", "python-for-data"],
    keywords: ["machine learning", "ml", "supervised learning", "scikit-learn", "ai"],
    concepts: [
      { name: "supervised-learning", weight: 1.2 }, { name: "classification-regression", weight: 1.1 },
      { name: "model-evaluation", weight: 1.2 }, { name: "overfitting-regularization", weight: 1.2 },
      { name: "feature-engineering", weight: 1.0 },
    ],
    resources: [
      { title: "Andrej Karpathy's Zero to Hero", url: "https://karpathy.ai/zero-to-hero.html", kind: "video", minutes: 600 },
      { title: "Stanford CS229", url: "https://cs229.stanford.edu/", kind: "course", minutes: 900 },
      { title: "Scikit-learn Tutorials", url: "https://scikit-learn.org/stable/tutorial/", kind: "article", minutes: 300 },
    ],
    styles: { visual: 0.5, reading: 0.6, hands: 0.8, auditory: 0.3 },
  },
  {
    id: "deep-learning", domain: "ml", name: "Deep Learning",
    level: 3, estHours: 70,
    prereqs: ["ml-basics", "statistics-foundations"],
    keywords: ["deep learning", "neural networks", "pytorch", "tensorflow", "cnn", "transformer"],
    concepts: [
      { name: "neural-network-arch", weight: 1.1 }, { name: "backpropagation", weight: 1.4 },
      { name: "cnn-vision", weight: 1.1 }, { name: "transformers", weight: 1.5 },
      { name: "training-and-tuning", weight: 1.1 },
    ],
    resources: [
      { title: "fast.ai Practical DL", url: "https://course.fast.ai/", kind: "course", minutes: 800 },
      { title: "3Blue1Brown Neural Networks", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", kind: "video", minutes: 120 },
      { title: "Stanford CS224N NLP", url: "https://web.stanford.edu/class/cs224n/", kind: "course", minutes: 900 },
    ],
    styles: { visual: 0.7, reading: 0.5, hands: 0.8, auditory: 0.3 },
  },
  {
    id: "llm-applications", domain: "ml", name: "LLM & GenAI Applications",
    level: 3, estHours: 50,
    prereqs: ["ml-basics", "python-for-data"],
    keywords: ["llm", "gpt", "rag", "prompt engineering", "langchain", "genai", "agents"],
    concepts: [
      { name: "prompt-engineering", weight: 1.0 }, { name: "rag-retrieval", weight: 1.3 },
      { name: "agents-and-tools", weight: 1.2 }, { name: "evaluation", weight: 1.0 },
      { name: "fine-tuning-basics", weight: 1.1 },
    ],
    resources: [
      { title: "OpenAI Cookbook", url: "https://cookbook.openai.com/", kind: "article", minutes: 300 },
      { title: "LangChain docs", url: "https://python.langchain.com/docs", kind: "article", minutes: 400 },
      { title: "Aaron Fransciscus ~ generate", url: "https://www.youtube.com/@ai_makerspace", kind: "video", minutes: 400 },
    ],
    styles: { visual: 0.4, reading: 0.7, hands: 0.9, auditory: 0.2 },
  },
  {
    id: "mlops", domain: "ml", name: "MLOps & Model Deploy",
    level: 4, estHours: 40,
    prereqs: ["ml-basics", "docker-systems"],
    keywords: ["mlops", "model serving", "mlflow", "deploy ml"],
    concepts: [
      { name: "experiment-tracking", weight: 1.0 }, { name: "model-registry", weight: 1.0 },
      { name: "serving-apis", weight: 1.2 }, { name: "monitoring-drift", weight: 1.3 },
    ],
    resources: [
      { title: "Made With ML MLOps", url: "https://madewithml.com/", kind: "course", minutes: 500 },
      { title: "MLOps Zoomcamp", url: "https://github.com/DataTalksClub/mlops-zoomcamp", kind: "course", minutes: 600 },
    ],
    styles: { visual: 0.4, reading: 0.6, hands: 0.9, auditory: 0.2 },
  },

  // ---------------- Cloud & DevOps ----------------
  {
    id: "linux-basics", domain: "cloud", name: "Linux & Shell Basics",
    level: 1, estHours: 20,
    prereqs: [],
    keywords: ["linux", "shell", "command line", "terminal", "bash"],
    concepts: [
      { name: "filesystem-navigation", weight: 1.0 }, { name: "shell-commands", weight: 1.0 },
      { name: "permissions-ownership", weight: 1.0 }, { name: "process-management", weight: 1.0 },
      { name: "bash-scripting", weight: 1.2 },
    ],
    resources: [
      { title: "Linux Journey", url: "https://linuxjourney.com/", kind: "interactive", minutes: 300 },
      { title: "The Missing Semester (MIT)", url: "https://missing.csail.mit.edu/", kind: "course", minutes: 300 },
      { title: "OverTheWire Bandit", url: "https://overthewire.org/wargames/bandit/", kind: "interactive", minutes: 200 },
    ],
    styles: { visual: 0.3, reading: 0.7, hands: 0.9, auditory: 0.1 },
  },
  {
    id: "docker-systems", domain: "cloud", name: "Docker & Containers",
    level: 2, estHours: 25,
    prereqs: ["linux-basics"],
    keywords: ["docker", "containers", "kubernetes", "devops"],
    concepts: [
      { name: "images-vs-containers", weight: 1.0 }, { name: "dockerfile", weight: 1.1 },
      { name: "compose-networking", weight: 1.0 }, { name: "volumes-persistence", weight: 1.0 },
    ],
    resources: [
      { title: "Docker docs (play with Docker)", url: "https://docs.docker.com/get-started/", kind: "course", minutes: 300 },
      { title: "KodeKloud Docker", url: "https://kodekloud.com/courses/docker-for-the-absolute-beginner/", kind: "course", minutes: 400 },
    ],
    styles: { visual: 0.6, reading: 0.4, hands: 0.9, auditory: 0.2 },
  },
  {
    id: "aws-cloud", domain: "cloud", name: "AWS Cloud Foundations",
    level: 2, estHours: 40,
    prereqs: ["linux-basics"],
    keywords: ["aws", "cloud", "ec2", "s3", "lambda", "devops"],
    concepts: [
      { name: "compute-ec2-lambda", weight: 1.1 }, { name: "storage-s3", weight: 1.0 },
      { name: "networking-vpc", weight: 1.1 }, { name: "iam-security", weight: 1.2 },
      { name: "serverless-patterns", weight: 1.0 },
    ],
    resources: [
      { title: "AWS Skill Builder", url: "https://explore.skillbuilder.aws/", kind: "course", minutes: 500 },
      { title: "FreeCodeCamp AWS CCP", url: "https://www.youtube.com/watch?v=3hLmDS179YE", kind: "video", minutes: 780 },
    ],
    styles: { visual: 0.5, reading: 0.6, hands: 0.8, auditory: 0.3 },
  },
  {
    id: "ci-cd", domain: "cloud", name: "CI/CD & Automation",
    level: 3, estHours: 25,
    prereqs: ["docker-systems", "git-version-control"],
    keywords: ["ci/cd", "github actions", "pipelines", "devops"],
    concepts: [
      { name: "pipeline-stages", weight: 1.0 }, { name: "github-actions", weight: 1.2 },
      { name: "testing-in-cicd", weight: 1.0 }, { name: "deployment-automation", weight: 1.1 },
    ],
    resources: [
      { title: "GitHub Actions docs", url: "https://docs.github.com/en/actions", kind: "article", minutes: 300 },
      { title: "CI/CD pipeline course (KodeKloud)", url: "https://kodekloud.com/courses/", kind: "course", minutes: 400 },
    ],
    styles: { visual: 0.4, reading: 0.6, hands: 0.9, auditory: 0.2 },
  },

  // ---------------- Cybersecurity ----------------
  {
    id: "security-basics", domain: "security", name: "Security Fundamentals",
    level: 1, estHours: 20,
    prereqs: ["linux-basics", "networking-basics"],
    keywords: ["cybersecurity", "security", "hacking", "infosec"],
    concepts: [
      { name: "threat-models", weight: 1.0 }, { name: "network-security", weight: 1.0 },
      { name: "cryptography-basics", weight: 1.2 }, { name: "web-attacks", weight: 1.1 },
    ],
    resources: [
      { title: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/", kind: "article", minutes: 120 },
      { title: "Cybrary Intro", url: "https://www.cybrary.it/", kind: "course", minutes: 300 },
    ],
    styles: { visual: 0.4, reading: 0.7, hands: 0.7, auditory: 0.2 },
  },
  {
    id: "penetration-testing", domain: "security", name: "Penetration Testing",
    level: 2, estHours: 50,
    prereqs: ["security-basics", "linux-basics"],
    keywords: ["pentest", "hacking", "bughunting", "kali"],
    concepts: [
      { name: "reconnaissance", weight: 1.0 }, { name: "vulnerability-scanning", weight: 1.0 },
      { name: "exploitation-basics", weight: 1.2 }, { name: "privilege-escalation", weight: 1.2 },
      { name: "reporting", weight: 0.9 },
    ],
    resources: [
      { title: "TryHackMe", url: "https://tryhackme.com/", kind: "interactive", minutes: 600 },
      { title: "Hack The Box Academy", url: "https://academy.hackthebox.com/", kind: "course", minutes: 500 },
      { title: "PortSwigger Web Security", url: "https://portswigger.net/web-security", kind: "interactive", minutes: 500 },
    ],
    styles: { visual: 0.5, reading: 0.5, hands: 0.9, auditory: 0.3 },
  },

  // ---------------- Game Development ----------------
  {
    id: "game-dev-basics", domain: "game", name: "Game Development Fundamentals",
    level: 1, estHours: 35,
    prereqs: ["programming-basics"],
    keywords: ["game dev", "game design", "unity", "godot"],
    concepts: [
      { name: "game-loop", weight: 1.2 }, { name: "sprite-rendering", weight: 1.0 },
      { name: "input-handling", weight: 1.0 }, { name: "physics-basics", weight: 1.1 },
      { name: "scenes-game-states", weight: 1.0 },
    ],
    resources: [
      { title: "Godot Official Docs", url: "https://docs.godotengine.org/", kind: "course", minutes: 400 },
      { title: "Brackeys Unity (archived)", url: "https://www.youtube.com/@Brackeys", kind: "video", minutes: 300 },
    ],
    styles: { visual: 0.8, reading: 0.3, hands: 0.9, auditory: 0.3 },
  },
  {
    id: "game-design", domain: "game", name: "Game Design & Prototyping",
    level: 1, estHours: 25,
    prereqs: [],
    keywords: ["game design", "level design", "mechanics"],
    concepts: [
      { name: "core-mechanics", weight: 1.2 }, { name: "level-design", weight: 1.1 },
      { name: "player-motivation", weight: 1.0 }, { name: "prototyping-iteration", weight: 1.1 },
    ],
    resources: [
      { title: "Game Design Concepts (GDC vault)", url: "https://www.gdcvault.com/", kind: "video", minutes: 500 },
      { title: "Extra Credits Essays", url: "https://www.youtube.com/@ExtraCredits", kind: "video", minutes: 200 },
    ],
    styles: { visual: 0.8, reading: 0.5, hands: 0.7, auditory: 0.4 },
  },

  // ---------------- Mobile ----------------
  {
    id: "react-native-mobile", domain: "mobile", name: "React Native / Mobile Apps",
    level: 2, estHours: 50,
    prereqs: ["javascript-core"],
    keywords: ["react native", "mobile app", "flutter", "ios", "android"],
    concepts: [
      { name: "native-components", weight: 1.0 }, { name: "navigation", weight: 1.0 },
      { name: "state-and-async", weight: 1.1 }, { name: "device-apis", weight: 1.0 },
      { name: "app-store-release", weight: 0.9 },
    ],
    resources: [
      { title: "React Native official docs", url: "https://reactnative.dev/docs/getting-started", kind: "course", minutes: 400 },
      { title: "Expo docs", url: "https://docs.expo.dev/", kind: "article", minutes: 200 },
    ],
    styles: { visual: 0.6, reading: 0.5, hands: 0.9, auditory: 0.2 },
  },

  // ---------------- Product & Design ----------------
  {
    id: "ux-design", domain: "product", name: "UX Design & Research",
    level: 1, estHours: 30,
    prereqs: [],
    keywords: ["ux", "ui design", "figma", "user research", "design"],
    concepts: [
      { name: "user-research", weight: 1.1 }, { name: "wireframing", weight: 1.0 },
      { name: "prototyping-figma", weight: 1.1 }, { name: "usability-testing", weight: 1.1 },
      { name: "visual-hierarchy", weight: 1.0 },
    ],
    resources: [
      { title: "Nielsen Norman Group", url: "https://www.nngroup.com/articles/", kind: "article", minutes: 300 },
      { title: "Figma Learn", url: "https://www.figma.com/learn/", kind: "course", minutes: 400 },
      { title: "Google UX Certificate", url: "https://www.coursera.org/professional-certificates/google-ux-design", kind: "course", minutes: 800 },
    ],
    styles: { visual: 0.9, reading: 0.4, hands: 0.7, auditory: 0.2 },
  },
  {
    id: "product-management", domain: "product", name: "Product Management",
    level: 1, estHours: 30,
    prereqs: [],
    keywords: ["product manager", "pm", "product", "roadmap", "agile"],
    concepts: [
      { name: "problem-definition", weight: 1.0 }, { name: "roadmapping", weight: 1.1 },
      { name: "stakeholder-management", weight: 1.0 }, { name: "metrics-and-analytics", weight: 1.1 },
      { name: "agile-scrum", weight: 1.0 },
    ],
    resources: [
      { title: "Lenny's Newsletter", url: "https://www.lennysnewsletter.com/", kind: "article", minutes: 300 },
      { title: "Product School", url: "https://productschool.com/", kind: "course", minutes: 300 },
    ],
    styles: { visual: 0.5, reading: 0.7, hands: 0.5, auditory: 0.4 },
  },
];

// Networking topic referenced by security topic. Add it under cloud-neutral.
TOPICS.push({
  id: "networking-basics", domain: "cloud", name: "Networking Basics",
  level: 1, estHours: 20,
  prereqs: ["linux-basics"],
  keywords: ["networking", "tcp/ip", "dns", "http", "network"],
  concepts: [
    { name: "osI-model", weight: 1.0 }, { name: "tcp-ip", weight: 1.2 },
    { name: "dns-naming", weight: 1.0 }, { name: "http-apis", weight: 1.1 },
    { name: "subnetting", weight: 1.1 },
  ],
  resources: [
    { title: "Khan Academy Computer Networking", url: "https://www.khanacademy.org/computing/computer-science/networking", kind: "course", minutes: 300 },
    { title: "Beacon: Computer Networking", url: "https://networklessons.com/", kind: "article", minutes: 300 },
  ],
  styles: { visual: 0.6, reading: 0.6, hands: 0.6, auditory: 0.3 },
});

// Build topic index.
const TOPIC_INDEX = new Map();
for (const t of TOPICS) TOPIC_INDEX.set(t.id, t);

const removeById = (id, list) => {
  const i = list.indexOf(id);
  if (i !== -1) list.splice(i, 1);
  return list;
};

// Validate graph integrity: every prereq must exist. Hard fail on build errors.
for (const t of TOPICS) {
  for (const p of t.prereqs) {
    if (!TOPIC_INDEX.has(p)) throw new Error(`ontology: prereq "${p}" of "${t.id}" does not exist`);
  }
}

// Detect cycles (defensive; prune any to keep the graph a DAG).
function detectAndBreakCycles() {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  for (const t of TOPICS) color.set(t.id, WHITE);
  const stack = [];
  const cycleFound = (nodeId) => {
    const idx = stack.indexOf(nodeId);
    return idx >= 0 ? stack.slice(idx).concat(nodeId) : null;
  };
  const visit = (id, trail) => {
    const c = color.get(id);
    if (c === BLACK) return;
    if (c === GRAY) {
      const cyc = cycleFound(id);
      if (cyc) throw new Error("ontology cycle: " + cyc.join(" -> "));
      return;
    }
    color.set(id, GRAY);
    trail.push(id);
    for (const p of TOPIC_INDEX.get(id).prereqs) visit(p, trail);
    trail.pop();
    color.set(id, BLACK);
  };
  for (const t of TOPICS) visit(t.id, []);
  return true;
}
try {
  detectAndBreakCycles();
} catch (e) {
  console.error("Ontology integrity failure:", e.message);
  throw e;
}

function getTopic(id) { return TOPIC_INDEX.get(id); }
function allTopics() { return TOPICS; }
function domains() { return Object.entries(DOMAIN_META).map(([id, m]) => ({ ...m, id })); }

// Expose cross-domain keyword->topic lookup used by the profiler.
const KEYWORD_INDEX = new Map(); // keyword -> [topicId...]
for (const t of TOPICS) {
  for (const kw of t.keywords) {
    if (!KEYWORD_INDEX.has(kw)) KEYWORD_INDEX.set(kw, []);
    KEYWORD_INDEX.get(kw).push(t.id);
  }
}
function topicsForKeyword(kw) {
  const direct = KEYWORD_INDEX.get(kw) || [];
  const results = new Set(direct);
  for (const [key, ids] of KEYWORD_INDEX) {
    if (kw.length >= 3 && new RegExp(`(^|[^a-z0-9+#_-])${kw}([^a-z0-9+#_-]|$)`).test(key)) {
      for (const id of ids) results.add(id);
    }
  }
  return [...results];
}

module.exports = {
  DOMAIN_META, TOPICS, TOPIC_INDEX,
  getTopic, allTopics, domains, topicsForKeyword,
};