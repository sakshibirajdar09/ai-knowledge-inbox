# AI Knowledge Inbox (RecallAI) - Complete Project Documentation

## 🎯 Project Overview
**AI Knowledge Inbox** is a production-grade, full-stack personal "second-brain" web application. It allows users to save notes and URLs into a local vector database and query that knowledge graph using natural language. The system synthesizes answers based purely on the saved data (Retrieval-Augmented Generation), citing specific sources to guarantee hallucination-free responses.

---

## 🧠 AI Models & Architecture

### 1. Large Language Model (LLM) - Synthesis
- **Model Used:** Google Gemini (`gemini-1.5-flash` or `gemini-pro`)
- **API Key Required:** `GEMINI_API_KEY` (in `backend/.env`)
- **Why it is best:** The Gemini Flash model offers industry-leading speed (TTFT) and an enormous context window, making it perfect for rapid RAG synthesis. It is highly capable of following strict system instructions, such as our "Strict Refusal" prompt which forces the AI to say "The saved knowledge does not contain enough information" when retrieval yields no results.

### 2. Embeddings Model - Vector Search
- **Model Used:** `Xenova/all-MiniLM-L6-v2` (Local HuggingFace Transformers.js)
- **Why it is best:** 
  - **Zero Cost & Zero Latency:** Embeddings run locally entirely within the Node.js backend. No network calls to OpenAI or external providers are needed.
  - **Privacy:** User notes and scraped URLs never leave the machine for embedding generation.
  - **Efficiency:** Produces dense 384-dimensional vectors that are incredibly fast to compare.

### 3. Database & Storage Strategy
- **Tech Stack:** Embedded SQLite with BLOB storage for Vectors.
- **Why it is best for this project:** 
  - We store the `float32` embeddings directly as binary BLOBs in SQLite and compute **Cosine Similarity** locally using JavaScript. 
  - *No heavy infrastructure:* This eliminates the need for complex external vector databases like Pinecone, Qdrant, or Postgres/pgvector. It guarantees that anyone pulling this repository can run `yarn install` and `yarn dev` to immediately have a working application without spinning up Docker containers.

---

## ⚙️ Core Approaches & Algorithms

### 1. Robust Retrieval-Augmented Generation (RAG) Pipeline
1. **Ingestion:** When a user submits a Note or URL, the backend strips HTML, cleans the text, and splits it into semantic chunks (Fixed-window chunking: 600 characters with 100 character overlap).
2. **Embedding:** Each chunk is passed through the `Xenova` model to generate a 384D vector.
3. **Retrieval (Cosine Similarity):** When the user asks a question, the query is embedded. We compare the query vector against all chunk vectors in SQLite using Cosine Similarity.
4. **Filtering:** We enforce a strict **Similarity Threshold** (currently `0.25` / 25%). Any chunk that falls below this threshold is dropped entirely. This prevents irrelevant data from being fed to the LLM.
5. **Synthesis:** The surviving chunks are injected into the LLM prompt. The Gemini model synthesizes a readable answer and embeds specific `[1]`, `[2]` citation markers pointing directly to the chunks used.

### 2. UI / UX Design System (Apple Light Theme & Dark Mode)
- **Tech Stack:** React 18, Vite, Tailwind CSS v4, Lucide React.
- **Design Philosophy:** We implemented a highly polished, Apple-inspired UI. 
  - **Dynamic Theme Toggle:** Supports both a sleek, Perplexity-inspired Dark Mode (mesh gradients, pure blacks) and an airy Apple-style Light Mode (frosted glass, bright whites, `#F5F5F7` backgrounds).
  - **Micro-interactions:** Uses subtle hover states, focus rings, and smooth transitions (fade-ins, scroll-into-view) to create a premium, native-app feel.
  - **Persistent Chat History:** Uses `localStorage` state management to let users switch back and forth between recent conversations seamlessly.

---

## 📂 Codebase Structure & Rules
Per strict global directives in this environment, this project enforces the following:
- **No `npm`:** Exclusively uses `yarn`.
- **No `README.md` files:** This `CLAUDE.md` acts as the primary documentation hub.
- **Centralized Errors & Logging:** Enforces `ApiError` utility classes for HTTP status codes and a custom centralized `logger` rather than raw `console.log`.

### Start the Application (Local Development)
\`\`\`bash
# Terminal 1: Backend
cd backend
yarn install
yarn dev

# Terminal 2: Frontend
cd frontend
yarn install
yarn dev
\`\`\`
