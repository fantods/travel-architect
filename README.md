# Trip Architect: Agentic Travel Itinerary Planner

### **Overview**

**Trip Architect** is a full-stack agentic AI application that generates personalized, feasible travel itineraries with automatic place linking. It uses a multi-agent architecture where specialized AI agents work together to create travel plans and enhance them with contextual information.

This project is built entirely in **TypeScript**, leveraging **Ollama** for local LLM inference, **Prisma** for database management, and **Redis** for caching.

---

### **Core Features**

1. **Conversational Planning:** Collects user preferences (budget, interests, dietary restrictions) via natural chat.
2. **Autonomous Tool Use:** Dynamically queries external APIs for weather, points of interest, and logistics.
3. **Multi-Agent Architecture:** Specialized agents handle different tasks (itinerary generation, place extraction, linking).
4. **Conversation History:** Sidebar with full conversation history stored in PostgreSQL.
5. **Automatic Place Linking:** AI-powered extraction of place names with Google Maps links.
6. **Smart Caching:** Redis-based caching for place URLs to reduce API calls and improve performance.

---

### **Tech Stack**

| Component         | Technology                        | Purpose                                                       |
| :---------------- | :-------------------------------- | :------------------------------------------------------------ |
| **Language**      | `TypeScript`                      | Type safety across the full stack.                            |
| **Framework**     | `Next.js (App Router)`            | Full-stack framework (API Routes + UI).                       |
| **AI Models**     | `Ollama` (qwen2.5:7b, llama3.2)   | Local LLM inference for travel planning and place extraction. |
| **Database**      | `PostgreSQL` + `Prisma`           | Persistent storage for conversations and messages.            |
| **Caching**       | `Redis` + `ioredis`               | Caching place URLs and API responses.                         |
| **UI Components** | `Tailwind CSS` + `React Markdown` | Modern, responsive chat interface with markdown rendering.    |
| **External APIs** | `Google Places API`               | Fetches real-world place data and maps URLs.                  |

---

### **Multi-Agent Architecture**

Trip Architect uses a sophisticated multi-agent pipeline to deliver rich, actionable travel plans:

#### **Agent Flow:**

```
User Request
     ↓
┌─────────────────────────────────────┐
│  Agent 1: Travel Planner            │
│  Model: qwen2.5:7b                  │
│  Task: Generate detailed itinerary  │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│  Agent 2: Place Extractor           │
│  Model: llama3.2 (faster)           │
│  Task: Extract places with          │
│        confidence scores            │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│  Parallel Processing                │
│  - Filter by confidence (>= 0.7)    │
│  - Fetch Google Maps URLs           │
│  - Cache results in Redis           │
└─────────────────────────────────────┘
     ↓
Final Response with Linked Places
```

#### **Detailed Flow:**

1. **User Input:** User sends a travel request via the Next.js frontend.

2. **Travel Planning Agent (qwen2.5:7b):**
   - Generates a detailed, day-by-day itinerary
   - Uses proper markdown formatting with spacing
   - Includes activities for morning, afternoon, and evening
   - Extracts destination context from user messages

3. **Place Extraction Agent (llama3.2):**
   - Analyzes the itinerary text
   - Identifies place names (attractions, restaurants, hotels, etc.)
   - Assigns confidence scores (0.0-1.0) to each place
   - Returns structured JSON with filtered results
   - Falls back to regex extraction if AI fails

4. **Parallel Place Linking:**
   - Filters places by confidence >= 0.7
   - Searches Google Places API in parallel for each place
   - Includes destination context for accurate results (e.g., "Hyde Park, Tokyo" vs "Hyde Park, London")
   - Caches results in Redis (7-day TTL)
   - Replaces place names with markdown links

5. **Final Output:** Enhanced itinerary with clickable Google Maps links for all mentioned places.

---

### **Agent Specifications**

#### **Agent 1: Travel Planner**

- **Model:** `qwen2.5:7b`
- **Purpose:** Generate comprehensive travel itineraries
- **System Prompt:** Enforces proper markdown formatting with blank lines
- **Output:** Day-by-day schedule with activities and descriptions

#### **Agent 2: Place Extractor**

- **Model:** `llama3.2:latest` (faster, specialized)
- **Purpose:** Extract place names from itinerary text
- **Temperature:** 0.1 (low for consistency)
- **Output:** Structured JSON array:
  ```json
  [
    { "name": "Meiji Shrine", "confidence": 0.95 },
    { "name": "Shibuya Crossing", "confidence": 0.9 }
  ]
  ```
- **Fallback:** Regex pattern matching if AI extraction fails

---

### **Caching Strategy**

**Redis Caching (7-day TTL):**

```
place:Meiji Shrine, Tokyo → https://www.google.com/maps/place/...
place:Louvre Museum, Paris → https://www.google.com/maps/place/...
```

- Reduces Google Places API calls by ~90% for common places
- Improves response time for repeat requests
- Automatic cache invalidation after 7 days

---

### **Data Models**

#### **Conversation Model**

```typescript
model Conversation {
  id        String     @id @default(cuid())
  title     String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  messages  Message[]
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  role           String       // "user" or "assistant"
  content        String       // Markdown content with links
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(...)
}
```

#### **Extracted Place Schema**

```typescript
interface ExtractedPlace {
  name: string; // "Meiji Shrine"
  confidence: number; // 0.0 - 1.0
}
```

---

### **API Endpoints**

#### **Chat API**

```
POST /api/chat
Body: { messages: Array<{role, content}> }
Response: { message: { content: "itinerary with links" } }
```

#### **Conversation Management**

```
GET    /api/conversations              # List all conversations
POST   /api/conversations              # Create new conversation
GET    /api/conversations/:id          # Get conversation with messages
PATCH  /api/conversations/:id          # Update conversation title
DELETE /api/conversations/:id          # Delete conversation
POST   /api/conversations/:id/messages # Add message to conversation
```

---

### **Environment Setup**

Required environment variables (see `.env.example`):

```bash
# AI Provider
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# Database
DATABASE_URL=postgresql://triparchitect:triparchitect@localhost:5432/triparchitect

# Cache
REDIS_URL=redis://localhost:6379

# External APIs
GOOGLE_PLACES_API_KEY=your-key-here
```

---

### **Performance Optimizations**

1. **Two-Model Strategy:**
   - Heavy planning: qwen2.5:7b (quality)
   - Place extraction: llama3.2 (speed)

2. **Parallel Processing:**
   - All Google Places API calls happen in parallel
   - Reduces latency from O(n) to O(1)

3. **Redis Caching:**
   - Place URLs cached for 7 days
   - Eliminates redundant API calls

4. **Confidence Filtering:**
   - Only links high-confidence places (>= 0.7)
   - Reduces false positives

---

### **Future Enhancements**

- [ ] Weather API integration for contextual recommendations
- [ ] Multi-day trip optimization with travel time calculations
- [ ] Budget tracking and cost estimation
- [ ] Export to calendar (ICS format)
- [ ] Collaborative planning with shared conversations
- [ ] Image recognition for place identification
