# Sunrise 2025 - Mobile App Setup

This guide explains how to build and run the Sunrise 2025 app as a native mobile application using Capacitor.js.

## Overview

The mobile app is built using:
- **Next.js 15** with static export
- **Capacitor.js** for native mobile functionality
- **Supabase** for backend services
- **Tailwind CSS** for styling
- **React** for the UI framework

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Android Studio** (for Android development)
3. **Xcode** (for iOS development, macOS only)
4. **Java Development Kit (JDK)** 11 or higher
5. **Android SDK** (installed via Android Studio)
6. **CocoaPods** (for iOS, macOS only)

## Quick Start

### 1. Build the Mobile App

```bash
# Build the mobile version
npm run build:mobile

# Build the web assets
npm run mobile:build

# Sync with Capacitor
npm run mobile:sync
```

### 2. Run on Android

```bash
# Make sure you have an Android device connected or emulator running
npm run mobile:android
```

### 3. Run on iOS (macOS only)

```bash
# Make sure you have Xcode installed
npm run mobile:ios
```

## Project Structure

```
sunrise-2025/
├── app/
│   └── mobile/           # Mobile-specific routes
│       ├── layout.tsx    # Mobile layout
│       ├── page.tsx      # Mobile home page
│       └── dashboard/    # Mobile dashboard
├── mobile-build/         # Generated mobile build
│   ├── android/         # Android project
│   ├── ios/            # iOS project
│   ├── out/            # Static web assets
│   └── capacitor.config.ts
├── scripts/
│   └── build-mobile.js  # Mobile build script
└── package.json
```

## Mobile Features

### Current Features
- ✅ User authentication (login/register)
- ✅ Mobile-optimized dashboard
- ✅ Contact management
- ✅ Event management
- ✅ Message sending
- ✅ Responsive design
- ✅ Native mobile navigation

### Planned Features
- 📱 Push notifications
- 📱 Offline support
- 📱 Camera integration
- 📱 Contact import from device
- 📱 Biometric authentication
- 📱 Deep linking

## Development Workflow

### 1. Making Changes

1. Edit files in the main `app/` directory
2. Run `npm run build:mobile` to rebuild
3. Run `npm run mobile:sync` to sync changes
4. Test on device/emulator

### 2. Adding New Mobile Routes

1. Create new pages in `app/mobile/`
2. Update the mobile build script if needed
3. Rebuild and sync

### 3. Adding Capacitor Plugins

```bash
cd mobile-build
npm install @capacitor/plugin-name
npx cap sync
```

## Environment Variables

Make sure you have the following environment variables set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Common Issues

1. **Build fails with environment variable errors**
   - Make sure `.env.local` exists in the mobile-build directory
   - Copy it from the main project: `cp .env.local mobile-build/`

2. **Android build fails**
   - Make sure Android Studio is installed
   - Check that ANDROID_HOME is set correctly
   - Verify JDK 11+ is installed

3. **iOS build fails**
   - Make sure Xcode is installed (macOS only)
   - Install CocoaPods: `sudo gem install cocoapods`
   - Run `pod install` in the ios directory

4. **Capacitor sync issues**
   - Delete the mobile-build directory and rebuild
   - Run `npm run build:mobile` again

### Debug Commands

```bash
# Check Capacitor status
cd mobile-build && npx cap doctor

# List installed plugins
cd mobile-build && npx cap ls

# Open Android Studio
cd mobile-build && npx cap open android

# Open Xcode
cd mobile-build && npx cap open ios
```

## Deployment

### Android
1. Build the app: `npm run mobile:build`
2. Sync: `npm run mobile:sync`
3. Open Android Studio: `cd mobile-build && npx cap open android`
4. Build APK/AAB in Android Studio

### iOS
1. Build the app: `npm run mobile:build`
2. Sync: `npm run mobile:sync`
3. Open Xcode: `cd mobile-build && npx cap open ios`
4. Archive and upload to App Store Connect

## Performance Optimization

### Web Assets
- Images are optimized for mobile
- CSS is minified
- JavaScript is bundled and optimized
- Static export reduces server dependencies

### Native Features
- Capacitor plugins provide native performance
- Haptic feedback for better UX
- Status bar integration
- Keyboard handling

## Security Considerations

- Environment variables are properly configured
- Supabase authentication is client-side
- No sensitive data in static assets
- HTTPS required for production

## Support

For issues related to:
- **Capacitor**: Check the [Capacitor documentation](https://capacitorjs.com/docs)
- **Next.js**: Check the [Next.js documentation](https://nextjs.org/docs)
- **Supabase**: Check the [Supabase documentation](https://supabase.com/docs)

## Contributing

When contributing to the mobile app:

1. Test on both Android and iOS
2. Ensure responsive design works
3. Test offline functionality
4. Verify authentication flows
5. Check performance on low-end devices 