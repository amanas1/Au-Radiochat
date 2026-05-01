# Google Play Release Checklist

## Store Assets
- App name ready
- Short description ready
- Full description ready
- App icon ready
- Feature graphic ready
- Minimum 2 phone screenshots ready

## Console Content
- Support email
- Privacy policy URL
- Data safety form
- App access details if any login is required
- Content rating questionnaire
- Ads declaration
- Target audience declaration

## Technical Release
- Android app package required: `.aab`
- Unique application ID required
- Version code and version name required
- Release signing configured
- Play App Signing enabled
- Min SDK and target SDK reviewed
- Network/audio permissions reviewed
- Background behavior reviewed for audio playback

## Risks Found In Current Repo
- Current project is a web app, not a complete Android app
- No Android folder
- No Gradle setup
- No signed `.aab`
- Branding is mixed between `Au-Radiochat` and `StreamFlow`
- Camera and microphone permissions exist, so privacy policy and data safety must be accurate

## What Must Be Done Before Upload
1. Wrap the app for Android using Capacitor or TWA.
2. Generate a signed Android App Bundle.
3. Test streaming, background playback, and install flow on real Android devices.
4. Finalize privacy policy and support page on a public URL.
5. Upload screenshots, icon, feature graphic, and store text to Play Console.
