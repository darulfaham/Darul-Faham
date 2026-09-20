# DARULFAHAM — Educational Study Space & Competitive Examination Ecosystem

An all-in-one educational platform featuring:
- **Study Space (Seat Map)**: Real-time sanctum seat reservations with cubicle mapping.
- **Biometric & Geofenced Attendance**: GPS radius validation (100m) and camera-verified check-in.
- **Online Examination Engine**: Timed mock tests, negative marking, instant grading, and rank evaluation.
- **Cashfree Payment Gateway Integration**: Membership renewals, test series packages, and digital book checkout.
- **Digital Library & E-Books**: DRM-compliant reading portal with offline reading capability.
- **Institutional Results & Hall of Rankers**: Public leaderboards and toppers' verification.
- **Promotional Coupon Management**: Discount engine with flat and percentage vouchers.
- **Aadhaar Vault & Student Governance**: Role-based access control with UIDAI-compliant privacy masking.
- **Smart Digital ID Cards**: Student & staff verification badges with QR codes and barcode generation.
- **Security Audit Logs**: Cryptographic access tracking for all administrative actions.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### 2. Installation
Clone or extract the archive into your desired folder, open a terminal in the root directory, and run:

```bash
npm install
```

### 3. Running Development Server
To launch the development server on `http://localhost:3000`:

```bash
npm run dev
```

### 4. Building for Production
To generate a production-ready optimized build in `dist/`:

```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

---

## 📁 Project Structure

```
├── public/                 # Static assets & public resources
├── src/
│   ├── components/         # Modular React UI components
│   │   ├── AadhaarSecurity/# Student directory & encrypted Aadhaar vault
│   │   ├── Attendance/     # Attendance console & verification modals
│   │   ├── AuditLogs/      # Immutable audit trail tables
│   │   ├── Coupons/        # Coupon management & validation
│   │   ├── DigitalBooks/   # Digital library & PDF compendiums
│   │   ├── IdCards/        # Student & staff smart ID card generator
│   │   ├── Payments/       # Cashfree checkout modal & transactions
│   │   ├── Privacy/        # Data privacy testing lab
│   │   ├── Registration/   # New student onboarding forms
│   │   ├── Results/        # Hall of rankers & examination achievements
│   │   ├── StudySpace/     # Interactive floor seat reservation map
│   │   └── TestEngine/     # Online testing interface & timer
│   ├── firebase/           # Database configurations, models & mock data
│   ├── services/           # Data services & authentication utilities
│   ├── types.ts            # Global TypeScript definitions & interfaces
│   ├── App.tsx             # Main application orchestrator & routing
│   ├── index.css           # Global Tailwind CSS styling
│   └── main.tsx            # React application entry point
├── server.ts               # Custom backend server (Express + Vite)
├── firestore.rules         # Security & database authorization rules
├── metadata.json           # Application permissions & capabilities
├── package.json            # Dependencies & scripts
└── tsconfig.json           # TypeScript compilation config
```

---

## 🛡️ License & Institutional Attribution
Crafted for **DARULFAHAM Sanctum Study & Examination Infrastructure**.
All rights reserved.
