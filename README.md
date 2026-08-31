# AI-Powered Personalized Learning Path Recommender

Pathlight is a closed-loop adaptive recommender engine designed to convert learner goals, baseline proficiencies, and continuous performance signals into a personalized prerequisite learning roadmap.

## Key Features

- Closed-Loop Adaptive Engine: Reranks recommendations continuously based on learner mastery and real-time feedback.
- Bayesian Knowledge Tracing (BKT): Updates belief probabilities for concepts as learners answer assessments.
- Adaptive Pathbuilder: Dynamically modifies weekly learning plans and inserts targeted review, practice, and quiz actions when mastery drops below threshold.
- Next Best Action Engine: Evaluates concept gaps and recommends the single highest-impact next step.
- Explainable Recommendations: Provides multi-factor decision transparency explaining why topics were selected and why now.
- Zero External Dependencies: Operates out of the box with built-in HTTP server, JSON persistence, and deterministic fallbacks.

## Prerequisites

- Node.js 18.0.0 or higher
- Git

## Local Setup and Execution Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/rushdarshan/path.git
cd path
```

### 2. Start the Server

```bash
npm start
```

Alternatively, you can run:

```bash
node server.js
```

The server starts on port 4317 by default.

Access the application in your web browser at:
`http://localhost:4317`

### 3. Optional Environment Variables

To enable optional Gemini-powered chat and career suggestion features:

```bash
PORT=4317
GEMINI_API_KEY=your_api_key_here
```

## API Reference

### 1. Create Session
- URL: `/api/new`
- Method: `GET`
- Description: Initializes a new learner session.

### 2. Load Demo Trajectory
- URL: `/api/demo/:type`
- Method: `GET`
- Params: `type` can be `ml`, `fullstack`, or `cyber`.
- Description: Seeds a realistic session with initial mastery states.

### 3. Adaptive Recommendation Endpoint
- URL: `/api/session/:id/adaptive`
- Method: `GET`
- Description: Returns reranked recommendations based on mastery gap, goal relevance, and feedback.

### 4. Next Best Action Endpoint
- URL: `/api/session/:id/next-action`
- Method: `GET`
- Description: Returns the recommended next learning action (learn, review, practice, quiz, advance).

### 5. Feedback Endpoint
- URL: `/api/session/:id/feedback`
- Method: `POST`
- Body:
  ```json
  {
    "topicId": "statistics-foundations",
    "type": "too_difficult",
    "rating": 2
  }
  ```
- Description: Logs learner feedback (too_difficult, not_relevant, already_know, liked) and recalculates scores and paths.

### 6. Quiz Generation and Submission
- URL: `/api/quiz/:id`
- Method: `POST` (Pick Quiz), `PUT` (Submit Answers)
- Description: Submitting answers updates BKT mastery, recalculates adaptive recommendations, and regenerates the learning path.

## Demo Sequence for Evaluation

1. Start the server via `node server.js`.
2. Open `http://localhost:4317` or issue `GET /api/demo/ml` to load the Machine Learning Engineer scenario.
3. Submit poor answers on the Statistics quiz via `PUT /api/quiz/:id`.
4. Observe mastery score drop for Statistics.
5. Issue `GET /api/session/:id/next-action` to see the system recommend Statistics practice.
6. Issue `GET /api/session/:id/adaptive` to see the path regenerate with Statistics Fundamentals, Practice, and Quiz steps before Machine Learning.

## Architecture & File Structure

```text
server.js           - Zero-dependency HTTP server & REST route handler
lib/adaptive.js     - Adaptive recommendation engine with feedback scoring
lib/nextaction.js   - Next Best Action decision engine
lib/pathbuilder.js  - Prerequisite DAG pathbuilder and adaptive path regenerator
lib/mastery.js      - Bayesian Knowledge Tracing & adaptive quiz generator
lib/recommender.js  - Multi-factor candidate scoring engine
lib/profiler.js     - Natural language profiler & skill extractor
lib/gaps.js         - Prerequisite gap analysis engine
lib/explain.js      - Recommendation explainability layer
lib/ontology.js     - Domain topic knowledge graph & concept index
lib/store.js        - JSON file persistence engine
public/             - Single Page Application frontend
```

## License

MIT
