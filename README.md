# 🤫 Hush — Beauty Dupe Finder

> *psst, I know a secret*

Hush is an AI-powered beauty dupe finder that helps users discover affordable alternatives to high-end cosmetics and fragrances. Built with a focus on the Indian beauty market.

**Live Demo:** [hush-coral-zeta.vercel.app](https://hush-coral-zeta.vercel.app)

---

## ✨ Features

- **AI-Powered Dupe Discovery** — Search any luxury product and get an affordable dupe instantly, powered by Google Gemini 2.5 Flash
- **Smart Caching** — AI results are automatically saved to the database so future searches are instant (no repeat API calls)
- **Community Validation** — Users can upvote or downvote dupes to surface the most trusted recommendations
- **Real-time Search** — Filter existing dupes by name as you type
- **Category Filtering** — Browse by lipstick, perfume, concealer, eyeshadow, foundation, skincare, primer
- **AI vs Community badges** — Every card shows whether it was AI-discovered or community-verified
- **India-first pricing** — All prices in INR, focused on products available on Nykaa, Purplle, and Myntra

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│                                                         │
│   Next.js 15 App Router + React                        │
│   ┌─────────────┐    ┌──────────────────────────────┐  │
│   │  Home Page  │    │       Search Page            │  │
│   │  /          │───▶│       /search                │  │
│   └─────────────┘    │                              │  │
│                      │  1. Type → filter DB dupes   │  │
│                      │  2. Enter → AI search        │  │
│                      │  3. Upvote/Downvote           │  │
│                      └──────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────┘
                              │ fetch('/api/findDupe')
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  SERVER (Next.js API Route)              │
│                  /app/api/findDupe/route.js              │
│                                                         │
│   Step 1: Text search in Supabase                      │
│        ↓ not found?                                     │
│   Step 2: Call Gemini API for AI dupe                  │
│        ↓ got result?                                    │
│   Step 3: Save to Supabase (cache for future)          │
│        ↓                                               │
│   Return result to client                              │
└──────────┬─────────────────────────┬───────────────────┘
           │                         │
           ▼                         ▼
┌──────────────────┐    ┌────────────────────────────┐
│   Supabase DB    │    │     Google Gemini API       │
│   PostgreSQL     │    │     gemini-2.5-flash        │
│                  │    │                            │
│   dupes table:   │    │  Prompt: find dupe for     │
│   - original     │    │  "{query}" in India,       │
│   - dupe         │    │  return structured JSON    │
│   - category     │    │                            │
│   - prices       │    └────────────────────────────┘
│   - similarity   │
│   - upvotes      │
│   - downvotes    │
│   - ai_generated │
└──────────────────┘
```

---

## 🔄 Search Flow

```
User types query
      │
      ▼
Filter existing Supabase data (instant, client-side)
      │
      │ User presses Enter
      ▼
POST /api/findDupe
      │
      ├─── Found in DB? ──────────────────▶ Return instantly ✅
      │
      └─── Not found?
                │
                ▼
          Call Gemini API
                │
                ▼
          Parse JSON response
                │
                ▼
          Save to Supabase ──────────────▶ Cache for future searches ✅
                │
                ▼
          Return AI result card
          (shown separately with ✨ badge)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15, React | UI, routing, server components |
| Styling | CSS (custom) | Dark luxury aesthetic |
| Database | Supabase (PostgreSQL) | Dupe storage, real-time updates |
| AI | Google Gemini 2.5 Flash | Dupe discovery, product knowledge |
| Deployment | Vercel | Hosting, CI/CD |
| Version Control | GitHub | Source control |

---

## 📁 Project Structure

```
hush-next/
├── app/
│   ├── page.jsx              # Landing page
│   ├── search/
│   │   └── page.jsx          # Search + results page
│   ├── api/
│   │   └── findDupe/
│   │       └── route.js      # AI search API route
│   ├── globals.css           # Global styles
│   └── layout.js             # Root layout
├── lib/
│   └── supabaseClient.js     # Supabase connection
├── public/
│   └── download.jpg          # Hero background image
├── .env.local                # Environment variables (not in repo)
└── README.md
```

---

## 🗄️ Database Schema

```sql
create table dupes (
  id              bigint primary key generated always as identity,
  original        text not null,        -- luxury product name
  dupe            text not null,        -- affordable alternative
  category        text,                 -- lipstick, perfume, etc.
  original_price  int4,                 -- price in INR
  dupe_price      int4,                 -- price in INR
  similarity      int4,                 -- match percentage (0-100)
  upvotes         int4 default 0,       -- community upvotes
  downvotes       int4 default 0,       -- community downvotes
  ai_generated    bool default false,   -- AI vs manual entry
  original_image  text,                 -- product image URL
  dupe_image      text,                 -- dupe image URL
  created_at      timestamptz default now()
);
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free tier)
- Google Gemini API key (free at aistudio.google.com)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOURUSERNAME/hush.git
cd hush

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your keys in .env.local

# Run development server
npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🔮 Roadmap

- [ ] User authentication (Supabase Auth)
- [ ] User profiles with credibility scores
- [ ] Dupe submission form for community contributions
- [ ] Vector similarity search (semantic search by description)
- [ ] Product images via Google Custom Search API
- [ ] Price tracking and alerts
- [ ] Mobile app (React Native)
- [ ] Browser extension — show dupes on Nykaa/Sephora product pages
- [ ] Affiliate links integration

---

## 💡 Key Technical Decisions

**Why Next.js over Vite/React?**
API routes allow server-side Gemini calls, keeping the API key secure and never exposed to the browser. Also enables SEO-friendly product pages.

**Why Supabase over Firebase?**
PostgreSQL gives real SQL querying power. The `.ilike` operator enables fuzzy text matching out of the box. Free tier is generous for early stage.

**Why Gemini over OpenAI?**
Free tier with generous limits (1500 requests/day). Gemini has strong knowledge of Indian beauty brands and products available on Nykaa and Purplle.

**The caching strategy:**
Every AI-generated result is saved to Supabase immediately. This means the database grows with every search — the app gets faster and smarter over time without additional API costs. Classic data flywheel.

---

## 👩‍💻 Author

Built by [Your Name] — 3rd year CS student building at the intersection of AI and beauty tech.

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)

---

*Hush is an independent project. Not affiliated with any beauty brand.*
