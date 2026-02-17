#Sudoku 

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://sudoku-228.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

A premium, high-performance Sudoku experience built for the Elite ecosystem. Featuring advanced logic-based hints, real-time PvP matchmaking, and a stunning "Glassmorphic" interface.

[**Live Demo »**](https://sudoku-228.vercel.app)

---

## ✨ Key Features

### 🏁 Real-Time PvP Multiplayer
- **No-Login Matchmaking:** Jump straight into a match with just a nickname.
- **Short Room Codes:** Generate and share 6-character alphanumeric codes (e.g., `X7K9P2`) for instant battles.
- **Live Progress Tracking:** See your opponent's completion percentage and status in real-time with an animated progress bar.
- **Synced Puzzles:** Competitive fairness with identical board generation for both players.

### 💡 Smart Hint System
- **Pure Logic:** No "cheating" AI. Our solver uses advanced Sudoku techniques like *Naked Singles* and *Hidden Singles*.
- **Educational UI:** Every hint comes with a detailed toast explanation of the logic applied.
- **Visual Guidance:** Hinted cells glow with a temporary golden aura for quick identification.

### 🎨 Premium UI/UX
- **Aura Aesthetics:** A clean, classy white-themed interface with indigo and violet gradient accents.
- **Tactile Gameplay:** Smooth animations powered by **Framer Motion**, featuring glassmorphic effects and responsive tactile feedback.
- **Smart Highlighting:** Intelligent conflict detection and related cell highlighting to aid focus.
- **Drag-and-Drop Eraser:** Intuitive tool for cleaning up your board on the fly.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + Vanilla CSS
- **Animations:** Framer Motion
- **State Management:** Zustand
- **Backend:** Firebase Realtime Database
- **Language:** TypeScript

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mew228/sudoku.git
   cd sudoku
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root and add your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_url
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the result.

---

## 📄 License
Designed and developed for the **Aura Elite** ecosystem. All rights reserved.

---

<p align="center">Made with ❤️ for the Sudoku community.</p>
