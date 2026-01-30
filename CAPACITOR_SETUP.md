# Capacitor Remote WebView Setup

This guide explains how to use Capacitor with Remote WebView for your Next.js SSR application.

## Overview

Your app is now configured to run as a native mobile app that loads content from a remote URL (your deployed Next.js application). This setup works perfectly with SSR.

## Configuration Files

### capacitor.config.ts

The main configuration file where you specify:

- **appId**: Your app's unique identifier (`com.ai4m.app`)
- **appName**: Display name (`AI4M`)
- **server.url**: The remote URL where your app is hosted

## Two Operating Modes

### 1. Remote Mode (Production) - **RECOMMENDED FOR SSR**

Load your app from a deployed URL. This is ideal for SSR applications.

**Edit [capacitor.config.ts](capacitor.config.ts):**

```typescript
server: {
  url: 'https://your-production-url.com',
  cleartext: false,
}
```

**Benefits:**

- ✅ Full SSR support
- ✅ Instant updates without app store releases
- ✅ No need to rebuild native apps for content changes
- ✅ Server-side rendering works perfectly

### 2. Development Mode (Local Testing)

Test with your local development server.

**Edit [capacitor.config.ts](capacitor.config.ts):**

```typescript
server: {
  url: 'http://localhost:3000',  // or your local IP
  cleartext: true,
}
```

## Scripts Available

```bash
# Sync web assets with native projects
npm run cap:sync

# Open Android Studio
npm run cap:android

# Open Xcode
npm run cap:ios

# Run on Android device/emulator
npm run cap:run:android

# Run on iOS device/simulator
npm run cap:run:ios
```

## Setup Instructions

### For Production (Remote WebView)

1. **Deploy your Next.js app** to your hosting platform (Vercel, Netlify, etc.)

2. **Update [capacitor.config.ts](capacitor.config.ts)** with your production URL:

   ```typescript
   server: {
     url: 'https://your-app.vercel.app',
     cleartext: false,
   }
   ```

3. **Sync the configuration:**

   ```bash
   npm run cap:sync
   ```

4. **Build and run:**

   ```bash
   # For Android
   npm run cap:android

   # For iOS
   npm run cap:ios
   ```

### For Development (Local Testing)

1. **Start your Next.js dev server:**

   ```bash
   npm run dev
   ```

2. **Update [capacitor.config.ts](capacitor.config.ts):**

   ```typescript
   server: {
     url: 'http://192.168.x.x:3000',  // Use your computer's IP
     cleartext: true,
   }
   ```

3. **Sync and run:**
   ```bash
   npm run cap:sync
   npm run cap:run:android
   ```

## Platform Requirements

### Android

- Android Studio
- Java Development Kit (JDK) 17+
- Android SDK

### iOS

- macOS
- Xcode 14+
- CocoaPods

## Important Notes

### Network Configuration

For remote WebView, ensure your server allows connections from mobile apps:

**Add to your Next.js headers (if needed):**

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
      ],
    },
  ];
}
```

### iOS Specific

For iOS, you might need to configure App Transport Security in `ios/App/App/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### Android Specific

Network security is configured in `android/app/src/main/res/xml/network_security_config.xml`

## Troubleshooting

### Issue: White screen on app launch

**Solution:** Verify your remote URL is accessible and returns valid HTML.

### Issue: "net::ERR_CLEARTEXT_NOT_PERMITTED"

**Solution:** Set `cleartext: true` in capacitor.config.ts for HTTP URLs (development only).

### Issue: API calls fail

**Solution:** Ensure your API endpoints have proper CORS configuration.

## Next Steps

1. Update the `appId` in [capacitor.config.ts](capacitor.config.ts) to match your organization
2. Deploy your Next.js app to production
3. Update the `server.url` with your production URL
4. Test on real devices
5. Configure app icons and splash screens
6. Submit to app stores

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Android Studio](https://developer.android.com/studio)
- [Xcode](https://developer.apple.com/xcode/)
