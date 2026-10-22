# Brainstorm Academy 🎓

> **Tagline:** *Learn Today. Lead Tomorrow.*

**Brainstorm Academy** is a modern, student-focused educational platform built for school students (Classes 6–12), competitive exam aspirants (JEE, NEET, Olympiads), and university entrance candidates (AMU, Jamia Millia Islamia).

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (ESNext / Strict Type Safety)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with dedicated design tokens
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **Backend / Cloud Integration:** [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage ready for later phases)

---

## 📁 Project Structure

```text
src/
├── assets/                 # Static visual assets (illustrations, logos, images)
├── components/
│   ├── ui/                 # Atomic reusable UI components (Button, Card, Input, Loading, ErrorMessage)
│   ├── layout/             # Application shell components (Navbar, Footer)
│   ├── common/             # Higher-order reusable components (PageHeader, EmptyState)
│   ├── DashboardSidebar.jsx# Responsive sidebar navigation for user roles
│   ├── CourseCard.jsx      # Reusable academic course display card
│   ├── DataTable.jsx       # Tabular data grid with pagination
│   └── Modal.jsx           # Accessible dialog overlays
├── pages/
│   ├── public/             # Public landing, courses, mock tests, auth, and 404 pages
│   ├── student/            # Student portal views (courses, tests, results, analytics)
│   ├── teacher/            # Educator portal views (batches, lessons, assignments)
│   └── admin/              # Administrative control center (users, curriculum, payments)
├── layouts/
│   ├── MainLayout.jsx      # Public layout with responsive Navbar and Footer
│   └── DashboardLayout.jsx # Authenticated portal layout with sidebar and breadcrumbs
├── routes/
│   ├── AppRoutes.tsx       # Centralized React Router configuration
│   └── index.ts            # Route barrel export
├── hooks/
│   ├── useMediaQuery.ts    # Responsive breakpoint observer
│   ├── useDebounce.ts      # Input debouncing for fast search
│   ├── useDocumentTitle.ts # Dynamic page titles
│   └── index.ts            # Hooks barrel export
├── services/
│   ├── api.ts              # Typed API HTTP client foundation
│   └── index.ts            # Services barrel export
├── firebase/
│   ├── config.ts           # Modular Firebase SDK initialization (Auth, DB, Storage)
│   ├── firebaseService.ts  # Future service contracts
│   └── index.ts            # Firebase barrel export
├── types/
│   ├── common.ts           # Shared UI, API response, and pagination types
│   ├── user.ts             # Student, Teacher, and Admin models
│   ├── course.ts           # Courses, study materials, and mock test contracts
│   └── index.ts            # Types barrel export
├── utils/
│   ├── cn.ts               # Tailwind class name merger
│   ├── formatters.ts       # Currency (₹ INR), date, and number formatters
│   └── index.ts            # Utilities barrel export
├── constants/
│   ├── app.ts              # Global branding, contact info, and app configuration
│   ├── routes.ts           # Type-safe routing dictionary
│   └── index.ts            # Constants barrel export
├── context/
│   ├── AppContext.tsx      # Global app state & preferences provider
│   └── index.ts            # Context barrel export
├── styles/
│   ├── globals.css         # Tailwind theme definitions, brand colors & scrollbar styles
│   └── index.css           # Global CSS imports
├── App.tsx                 # Root application wrapper (Router & Providers)
└── main.tsx                # Typed application entry point
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9+ or later

### 2. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` or `.env`:
```bash
cp .env.example .env
```
Fill in your API and Firebase credentials when ready to connect cloud services. If Firebase variables are left blank, the platform functions seamlessly in offline/preview mode.

### 4. Running the Development Server
Start the local Vite dev server with hot module replacement (HMR):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR. |
| `npm run build` | Runs TypeScript type checking (`tsc`) and compiles the production bundle via Vite. |
| `npm run preview` | Locally serves the compiled production build from `dist/`. |
| `npm run lint` | Performs type validation across all TypeScript and React files without emitting files. |

---

## 🎨 Design System & Colors

The platform uses a tailored academic color palette defined in `src/styles/globals.css`:

- **Navy (`#17365D`)**: Primary brand identity, footer, and deep headings.
- **Academic Blue (`#2457A7`)**: Primary CTA buttons, active links, and progress bars.
- **Gold (`#F4B942`)**: Accents, highlight badges, star ratings, and celebratory states.
- **Neutral Dark (`#172033`)**: High-contrast body text and typography.
- **Light Slate (`#F7F9FC`)**: Clean background surface.

---

## 🔒 Firebase Integration (Phase 2 Ready)

Firebase has been configured using modular imports in `src/firebase/config.ts`.
- **Firebase Auth**: Prepared for email/password and social login.
- **Cloud Firestore**: Prepared for persistent student progress, courses, and doubts.
- **Firebase Storage**: Prepared for study materials, PDF notes, and profile pictures.
- **Safe Fallback**: If `.env` credentials are not yet supplied, the system avoids throwing unhandled crashes, allowing the UI and static workflows to be developed and tested immediately.

---

## 📄 License
Private & Proprietary — Brainstorm Academy.
