# Munachiama | Chiama21 Hommie Foods 🍷✨

A full-stack, production-grade web application for **Munachiama | Chiama21 Hommie Foods** — Port Harcourt's premier luxury culinary brand offering cold-pressed natural drinks, gourmet small chops finger foods, fresh fruit parfaits, event catering, and bespoke VIP gift hampers.

---

## 🚀 System Features & Architecture

- **React 19 & Vite**: Ultra-fast, responsive single-page application with Tailwind CSS styling and Motion animations.
- **Node.js Express Backend**: Secure server proxy for Gemini AI, payment submission reviews, installment management, and API routes.
- **Firebase Firestore Database**: Production cloud-hosted persistence replacing legacy file-system database files. Auto-seeds initial catalog, categories, gallery, FAQs, and business settings.
- **Server-Side Gemini AI Concierge**: Server-proxied text concierge powered by Gemini 3.6 Flash for instant text chat inquiries.
- **Vapi AI Voice Assistant**: Real-time spoken voice conversation using `@vapi-ai/web` SDK connected to Munachiama AI Concierge (Assistant ID: `6e55432f-bc43-4c84-9519-9876bc3fb0cf`).
- **Admin Management Dashboard**: Secured staff portal with live email notification badge (`chiama21hommiefoods@gmail.com`), payment verification audit trail, order management, and volume-buyer installment plan configurations.
- **Manual Bank Transfer Verification**: Customer bank-transfer submissions are set to `Under Review` and require explicit admin verification or rejection.
- **Vercel Production Ready**: Out-of-the-box support for Vercel serverless function deployment via `vercel.json` and `api/index.ts`.

---

## 📋 Required Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

```env
# Server-Side Gemini API Key (Required for Text AI Chat)
GEMINI_API_KEY=your_gemini_api_key_here

# Admin Authentication Secret Token (Required for Admin Security)
ADMIN_SECRET_TOKEN=ChiamaAdminSecretTokenKey2026

# Admin Credentials (Optional for Admin Dashboard Login)
ADMIN_USERNAME=chiama_admin
ADMIN_PASSWORD=your_admin_password_here
ADMIN_EMAIL=admin@chiama21foods.com

# Firebase Client Configuration (Matched with firebase-applet-config.json)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Vapi AI Voice Assistant Configuration (Frontend)
# IMPORTANT: Use ONLY your Vapi Public API Key in browser code.
VITE_VAPI_PUBLIC_KEY=your_vapi_public_api_key_here
VITE_VAPI_ASSISTANT_ID=6e55432f-bc43-4c84-9519-9876bc3fb0cf
```

> ⚠️ **Security Warning**: Never expose your Vapi Private API Key or `GEMINI_API_KEY` in frontend code. Only `VITE_VAPI_PUBLIC_KEY` is designed for client-side use.

---

## 🛠️ Installation & Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Local Development Command
Runs the full-stack Express server with Vite middleware on `http://localhost:3000`:
```bash
npm run dev
```

### 3. Production Build Command
Bundles the React frontend into `dist/` and compiles the Express server into `dist/server.cjs`:
```bash
npm run build
```

### 4. Production Start Command
Launches the bundled CommonJS backend server:
```bash
npm run start
```

---

## 🗄️ Database Setup & Migration (Firebase Firestore)

The application uses **Firebase Firestore** for durable production persistence.

1. **Automatic Seeding**:
   Upon initial server launch, if the Firestore collections (`products`, `categories`, `gallery`, `faqs`, `business_settings`) are empty, `src/lib/firestoreDb.ts` automatically populates the database with initial brand records.

2. **Security Rules (`firestore.rules`)**:
   Deploy `firestore.rules` to your Firebase project:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Database Schema Blueprint**:
   The full schema definition is maintained in `firebase-blueprint.json`.

---

## 🎙️ Vapi AI Voice Assistant Integration

- **Voice SDK**: Powered by `@vapi-ai/web` Web SDK.
- **Assistant ID**: `6e55432f-bc43-4c84-9519-9876bc3fb0cf`
- **Features**:
  1. Opens when customer clicks "Talk to Munachiama AI".
  2. Prompts user for microphone permissions with visual listening/speaking indicators.
  3. Displays real-time AI transcriptions in the voice interface.
  4. Supports mute/unmute and clean call termination.
  5. Displays clear error messages if permissions are blocked or public key is missing.

---

## ☁️ Vercel Deployment Instructions

1. **Connect GitHub Repository to Vercel**.
2. **Framework Preset**: Select **Vite**.
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**: Add `GEMINI_API_KEY`, `ADMIN_SECRET_TOKEN`, `VITE_VAPI_PUBLIC_KEY`, `VITE_VAPI_ASSISTANT_ID`, and Firebase credentials in Vercel Project Settings.
6. Deploy! Vercel automatically routes `/api/*` through `api/index.ts` and serves the React single-page frontend.

---

## 📞 Support & Business Info

- **Brand**: Munachiama | Chiama21 Hommie Foods
- **Phone**: +234 806 512 4134
- **WhatsApp**: +234 806 512 4134
- **Email**: chiama21hommiefoods@gmail.com
- **Bank**: Access Bank | 0093177004 | Ama Chioma Gloria
