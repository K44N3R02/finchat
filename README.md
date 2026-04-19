# FinChat — AI-Powered Financial Assistant

FinChat is a mobile-first, WhatsApp-style financial assistant web application. It combines a conversational AI interface with real-time market data from CoinGecko, rendering interactive price charts directly inside chat messages.

Try at [finchat-iota.vercel.app](https://finchat-iota.vercel.app/).

## Project Summary

**What I Built:** I developed a full-stack financial assistant using FastAPI and React that leverages OpenAI's Function Calling to fetch live crypto data from CoinGecko. The application features a streaming "typing" effect for AI responses and dynamically renders Recharts line graphs inline when price history is requested.

**Tradeoffs:** To ensure a smooth mobile-first experience, I opted for client-side JSON extraction from the AI stream to render charts immediately without waiting for a secondary backend request. I also prioritized robust regex-based "fuzzy" parsing of AI output to handle minor formatting inconsistencies.

**What I would improve next:** I would implement persistent chat history using a database (like PostgreSQL or MongoDB) rather than just LocalStorage, and add a "Portfolio" feature allowing users to track their holdings' total value in real-time. Also giving AI the ability to fetch data from time spans would make charts more clear. Additionally, adding unit tests for the regex parsing logic would increase system reliability against diverse AI response styles.

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 20+
- OpenAI API Key

### 2. Backend Setup (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   # Open .env and add your OPENAI_API_KEY
   ```
5. Start the server:
   ```bash
   python main.py
   ```
   Backend will be running at `http://localhost:8000`

### 3. Frontend Setup (React + Vite)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Ensure VITE_BACKEND_URL points to your backend (default: http://localhost:8000/api)
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Frontend will be running at `http://localhost:5173`

---

## Environment Variables

### Backend (`/backend/.env`)
- `OPENAI_API_KEY`: Your OpenAI secret key.

### Frontend (`/frontend/.env`)
- `VITE_BACKEND_URL`: The URL of the running FastAPI backend
