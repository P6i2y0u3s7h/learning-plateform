# Firebase Integration Guide — Brainstorm Academy 🚀

This document provides a comprehensive guide for connecting, configuring, and testing Firebase services in the **Brainstorm Academy** application.

---

## 🔒 Security Principles (Mandatory)

1. **Client-Side Scope Only:** This application uses the **Firebase Web Modular SDK (v10+)**. The **Firebase Admin SDK** must **never** be imported into browser/client code.
2. **No Secret Keys in Environment:** Variables prefixed with `VITE_` are bundled directly into public client JavaScript. **Never** put Service Account JSON keys, database secret tokens, or payment secret keys in `.env` files.
3. **No Unrestricted Access:** Never deploy permissive development security rules (e.g. `allow read, write: if true;`). Use strict, role-aware security rules in Firestore and Storage.
4. **Environment Variables:** All project credentials must be supplied via `.env.local` (ignored by git).

---

## 🛠️ Step-by-Step Firebase Console Setup

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `Brainstorm Academy` (or your preferred identifier).
3. Toggle Google Analytics as desired and complete project creation.

### 2. Register Web Application
1. On your Project Overview page, click the **Web icon (`</>`)** to register a web app.
2. Enter the app nickname (e.g., `brainstorm-academy-web`).
3. Click **Register app**.
4. Firebase will display your `firebaseConfig` object. Keep this open to copy values into `.env.local`.

### 3. Enable Authentication
1. Navigate to **Build > Authentication > Sign-in method**.
2. Click **Get Started**.
3. Enable **Email/Password** provider (Email link is optional).
4. Enable **Google** provider by entering your project support email.

### 4. Enable Cloud Firestore
1. Navigate to **Build > Firestore Database**.
2. Click **Create database**.
3. Choose a region closest to your primary users (e.g., `asia-south1` for India or `us-central1`).
4. Select **Start in production mode** (all reads and writes denied by default until security rules are configured).

### 5. Enable Firebase Storage
1. Navigate to **Build > Storage**.
2. Click **Get Started**.
3. Select **Start in production mode**.
4. Confirm your default storage bucket.

### 6. Cloud Functions (2nd Gen) Preparation
1. 2nd Generation Cloud Functions are powered by Google Cloud Run.
2. When deploying server-side functions, ensure your Google Cloud billing is active (Blaze plan).
3. Default client region is configured to `us-central1` (customizable via `VITE_FIREBASE_FUNCTIONS_REGION`).

### 7. Firebase Cloud Messaging (Web Push Notifications)
1. Navigate to **Project Settings > Cloud Messaging**.
2. Under **Web configuration > Web Push certificates**, click **Generate key pair**.
3. Copy the public **Key pair (VAPID key)** into `VITE_FIREBASE_VAPID_KEY`.

---

## 📋 Configuring Local Environment (`.env.local`)

Create a `.env.local` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your actual values obtained from Firebase Console:

```env
# Application Branding
VITE_APP_NAME="Brainstorm Academy"
VITE_APP_TAGLINE="Learn Today. Lead Tomorrow."

# Firebase Web Client Configuration
VITE_FIREBASE_API_KEY="AIzaSyYourActualApiKeyHere"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef1234567890"
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"

# Cloud Functions 2nd Gen
VITE_FIREBASE_FUNCTIONS_REGION="us-central1"

# Cloud Messaging VAPID Key
VITE_FIREBASE_VAPID_KEY="YourPublicVapidKeyHere"

# Emulator Suite (Leave false for live cloud, true for local testing)
VITE_USE_FIREBASE_EMULATOR="false"
VITE_FIREBASE_EMULATOR_HOST="127.0.0.1"
```

> [!IMPORTANT]
> Until `.env.local` is provided with real project credentials, Firebase services will remain uninitialized. The frontend will safely detect this and prevent unhandled exceptions.

---

## 🛡️ Recommended Production Security Rules

### Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // User profiles: Only user can update their profile; anyone authenticated can read
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update: if isOwner(userId);
      allow delete: if false; // Deletion handled by cloud function or admin
    }

    // Courses: Public read for published courses; only educators/admin can write
    match /courses/{courseId} {
      allow read: if resource.data.isPublished == true || isAuthenticated();
      allow write: if isAuthenticated() && request.auth.token.role == 'admin';
    }

    // Chapters & Lessons
    match /chapters/{chapterId} {
      allow read: if true;
      allow write: if isAuthenticated() && request.auth.token.role == 'admin';
    }
    match /lessons/{lessonId} {
      allow read: if true;
      allow write: if isAuthenticated() && request.auth.token.role == 'admin';
    }

    // Enrollments: Only the enrolled student can read their own enrollment
    match /enrollments/{enrollmentId} {
      allow read, write: if isAuthenticated() && request.auth.uid == resource.data.userId;
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
    }

    // Test attempts: Only the student can view their attempts
    match /testAttempts/{attemptId} {
      allow read, create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
      allow update, delete: if false;
    }

    // Notifications: User owns their notifications
    match /notifications/{notificationId} {
      allow read, update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if false; // Created via backend / Cloud Functions
    }
  }
}
```

### Storage Security Rules (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Profile photos: Users can read all, upload their own avatar up to 2MB
    match /users/{userId}/avatar/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 2 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Course study materials: Public read for published files, admin write
    match /courses/{courseId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

---

## 🧪 Testing with Firebase Local Emulator Suite

You can test Authentication, Firestore, Storage, and Functions locally without incurring cloud costs or requiring live credentials.

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase CLI
```bash
firebase login
```

### 3. Initialize Emulators in Workspace
```bash
firebase init emulators
```
Select:
- Authentication Emulator (Port: 9099)
- Firestore Emulator (Port: 8080)
- Storage Emulator (Port: 9199)
- Functions Emulator (Port: 5001)
- Emulator UI (Port: 4000)

### 4. Start the Emulators
```bash
firebase emulators:start
```

### 5. Point Application to Emulators
In your `.env.local`:
```env
VITE_USE_FIREBASE_EMULATOR="true"
VITE_FIREBASE_EMULATOR_HOST="127.0.0.1"
```

When you start `npm run dev`, you will see:
`[Firebase] Connected to local Firebase Emulators (Auth: 9099, Firestore: 8080, Storage: 9199, Functions: 5001).`

---

## 👑 Super Admin Promotion Procedure (Trusted Server-Side)

### Security Requirement:
Public registration for the `admin` role is completely blocked. Admins must be provisioned via trusted server-side administration.

1. Download a service account private key from **Firebase Console > Project Settings > Service accounts > Generate new private key**.
2. Save it as `serviceAccountKey.json` in your local project root (`.gitignore` protects it).
3. Promote an existing user:
   ```bash
   node scripts/setSuperAdmin.js admin@brainstormacademy.in
   ```
4. This script sets custom claims `{ role: 'admin', admin: true }` on the user token and sets `role: 'admin'` in their Firestore profile document.
5. Upon their next sign-in, the user will be automatically granted Super Admin dashboard access.

---

## 🎓 Teacher Account Approval Procedure

When teachers sign up, their account is flagged with `approvalStatus: 'pending'`.
To approve a teacher:
```bash
node scripts/approveTeacher.js teacher@brainstormacademy.in
```
Once approved, the teacher gains access to `/dashboard/teacher` and course management features.
