# Android Build Next Steps

## What Is Already Done
- Capacitor Android project created
- App ID set to `com.auradiochat.app`
- App name set to `Au Radio Chat`
- Play assets prepared
- Release signing template added
- Android permissions and cleartext traffic enabled for radio streams

## What You Need On This Mac To Build `.aab`
1. Install Java 17 or newer
2. Install Android Studio
3. Install Android SDK platform and build tools
4. Set SDK path inside Android Studio
5. Create release keystore
6. Copy `android/keystore.properties.example` to `android/keystore.properties`
7. Fill real keystore values

## Commands
Build web and sync Android:

```bash
npm run build:mobile
```

Open Android Studio project:

```bash
npm run cap:open
```

Inside Android Studio:
- `Build`
- `Generate Signed Bundle / APK`
- `Android App Bundle`
- Select release keystore
- Build bundle

## Expected Output
Final bundle path:

`android/app/release/app-release.aab`
