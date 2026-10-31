# Gathbandhan — AI-Powered Luxury Wedding Consultation Platform

**Gathbandhan** is an AI-powered wedding consultation platform designed to help couples explore, customise, and budget their dream weddings across diverse Indian traditions. 

Built as an independent, modular system intended for seamless future integration into **The Royal Knot** luxury wedding planning agency.

---

## 🌟 What Groq AI Does in Gathbandhan

Groq acts as the **Senior Cultural Wedding Consultant & Advisor** via ultra-fast server-side inference (`llama-3.3-70b-versatile`):

1. **Ritual & Cultural Explanation**:
   - Understands 7 distinct wedding traditions (Hindu, Sikh, Muslim, Christian, Jain, Interfaith, and Custom).
   - Explains the spiritual significance, historical context, and modern arrangements of rituals (e.g., *Anand Karaj, Nikah, Pheras, Sangeet, Roce, Haldi*).
2. **Context-Aware Consultation**:
   - In Step 3 (*Discover Ceremonies*), couples can click **"Ask AI Advisor"** or ask custom questions.
   - Groq provides advice on event sequencing across 1 to 5 days, rest intervals, and ceremony logistics tailored to the couple's selected traditions and guest scale.
3. **Prompt Guard & Architectural Boundaries**:
   - **AI advises — Application controls**: Groq never calculates prices, invents vendor tariffs, or modifies the database.
   - Financial estimation is handled strictly by Gathbandhan's deterministic paise-based budget engine.
   - **Graceful Fallback**: If `GROQ_API_KEY` is not provided or rate limits are hit, the application falls back seamlessly to the curated local wedding knowledge base without disruption.

---

## 🏗️ Architecture & Key Features

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS design tokens (`ivory`, `cream`, `gold`, `maroon`).
- **Consultation State Machine**: 14-step guided wizard managing selections (traditions, venue, guests, catering, decor, photography, entertainment, budget).
- **Deterministic Budget Engine**: Integer paise calculations (1 INR = 100 paise) preventing floating point errors. Accurately calculates line items, 18% GST, and 5% contingency.
- **Proposal Generation**: Real-time itemized cost summary and browser print / PDF export.
- **Lead Capture & Vendor Matching**: Validated Zod schemas ready for CRM sync with *The Royal Knot*.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.18+ or v20+)
- npm or pnpm

### 2. Environment Setup
Open the `.env` (or `.env.local`) file in the project root and add your Groq API key:

```env
# === Groq AI Inference Configuration ===
# Get your API key from https://console.groq.com/keys
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# === Application ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the landing page and start planning.

### 4. Production Build & Test
```bash
npm run build
npm run start
```

---

## 📂 Project Structure

```
gathbandhan/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Luxury landing page
│   │   ├── plan-your-wedding/          # 14-Step consultation wizard
│   │   ├── globals.css                 # Gathbandhan design tokens
│   │   └── api/
│   │       ├── wedding-ai/chat/        # Groq AI consultation route
│   │       ├── budget/                 # Deterministic budget calculation
│   │       ├── consultations/          # Session save & restore
│   │       ├── services/               # Verified service catalogue
│   │       ├── vendors/                # Vendor recommendations
│   │       └── leads/                  # Concierge lead capture
│   ├── components/
│   │   ├── consultation/               # Wizard step components (Steps 1–14)
│   │   └── ui/                         # Selection cards, chips, progress bars
│   ├── data/
│   │   ├── wedding-knowledge/          # Hindu, Sikh, Muslim, Christian, Jain, Interfaith
│   │   └── service-catalogue/          # Realistic indicative vendor pricing
│   ├── hooks/
│   │   └── useConsultation.tsx         # Central state machine hook & reducer
│   ├── lib/
│   │   ├── groq.ts                     # Server-only Groq SDK client
│   │   ├── money.ts                    # Paise integer arithmetic
│   │   └── services/budget-calculator.ts
│   ├── types/wedding.ts                # TypeScript domain models
│   └── validations/wedding.ts          # Zod validation schemas
├── .env                                # Environment variables (add your keys here)
└── package.json
```

---

## 💍 Integration with The Royal Knot

Gathbandhan is built with decoupled integration points:
1. **Lead & Consultation Handoff**: `POST /api/leads` and `POST /api/consultations` allow The Royal Knot CRM to receive qualified inquiries and full wedding specifications.
2. **Embeddable**: Can be mounted inside an iframe or nested route under The Royal Knot website domain without style collision.
