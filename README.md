# TAGSCI QR-CATS - Hybrid Offline+Online Attendance System

## ✅ DEPLOYMENT FIXED
App now deploys successfully with no schema validation or TypeScript errors.

## Features
- ✅ Hybrid offline+online database system
- ✅ Real-time QR scanning works offline  
- ✅ Automatic sync when connection restored
- ✅ Visual online/offline indicators
- ✅ Android APK ready

## Quick Start
```bash
npm install
npm run dev          # Starts both frontend and backend
```

## Production Deployment
```bash
npx convex deploy    # Deploy backend
npm run build        # Build frontend
```

## Android Build
```bash
npm run build
npx cap sync android
npx cap open android
```

## Offline Capabilities
✅ QR scanning & attendance logging  
✅ View today's attendance  
✅ Attendance logs with filtering  
✅ Student data caching  
❌ QR generation (requires internet)  
❌ Authentication (requires internet)