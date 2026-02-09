# TAGSCI QR-CATS - Hybrid Offline+Online Attendance System

A modern attendance tracking system built for educational institutions. QR-CATS (Quick Response - Classroom Attendance Tracking System) supports both online and offline operation, making it perfect for classrooms with unreliable internet connectivity.

## ✨ Features

- **📱 Hybrid Offline+Online Architecture**

  - Works seamlessly with or without internet connection
  - Automatic synchronization when connection is restored
  - Visual online/offline status indicators

- **📊 QR Code Attendance**

  - Scan QR codes to mark attendance
  - Real-time QR code generation for students
  - Offline scanning with automatic sync

- **👥 Student Management**

  - Comprehensive student database
  - Section and group organization
  - Student progress tracking

- **📅 Session & Timetable Management**

  - Create and manage class sessions
  - Timetable scheduling
  - Daily pool management

- **📈 Analytics & Reporting**

  - Attendance logs with filtering
  - Student progress visualization
  - Export capabilities

- **🔐 Authentication**

  - Secure login system
  - Role-based access control

- **📲 Mobile App (Android)**
  - Native Android APK available
  - Built with Capacitor
  - PWA support for web installation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Android Studio (for mobile builds)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd qr-cats-attendance-system

# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev
```

### Environment Setup

Create a `.env.local` file with your Convex configuration:

```env
VITE_CONVEX_URL=your_convex_url
```

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Convex (serverless backend)
- **Database**: Convex + SQLite (offline)
- **Mobile**: Capacitor 7
- **Styling**: Tailwind CSS 3
- **Authentication**: Convex Auth
- **Charts**: Chart.js
- **QR Scanning**: html5-qrcode

## 📁 Project Structure

```
├── src/
│   ├── pages/           # React page components
│   ├── services/        # Database and sync services
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility functions
├── convex/             # Backend functions
│   ├── schema.ts       # Database schema
│   ├── auth.ts         # Authentication
│   └── *.ts            # API functions
├── android/            # Capacitor Android project
└── dist/               # Build output
```

## 🏗️ Build & Deployment

### Web Deployment

```bash
# Deploy backend
npx convex deploy

# Build frontend
npm run build
```

### Android Build

```bash
# Build and sync
npm run build:android

# Or manually:
npm run build
npx cap sync android
npx cap open android
```

## 🔄 Offline Capabilities

| Feature                 | Online | Offline |
| ----------------------- | ------ | ------- |
| QR Scanning             | ✅     | ✅      |
| Attendance Logging      | ✅     | ✅      |
| View Today's Attendance | ✅     | ✅      |
| Attendance Logs         | ✅     | ✅      |
| Student Data            | ✅     | ✅      |
| QR Generation           | ✅     | ❌      |
| Authentication          | ✅     | ❌      |

## 🧪 Development

### Lint & Type Check

```bash
npm run lint
```

### Available Scripts

- `npm run dev` - Start both frontend and backend
- `npm run dev:frontend` - Frontend only
- `npm run dev:backend` - Backend only
- `npm run build` - Build for production
- `npm run build:android` - Build for Android

## 📱 Mobile App

The Android app is built with Capacitor and provides native functionality including:

- Camera access for QR scanning
- Local SQLite database
- Push notifications
- Offline-first architecture

## 🔒 Security

- Authentication powered by Convex Auth
- Secure data transmission
- Role-based access control
- Environment variable protection

## 📚 Documentation

- [Convex Documentation](https://docs.convex.dev/)
- [Convex Auth Guide](https://auth.convex.dev/)
- [Capacitor Documentation](https://capacitorjs.com/)
- [Vite Documentation](https://vitejs.dev/)
