# Publish Blockers

## Current Status
Marketing package is ready to prepare, but direct Google Play upload is blocked by missing Android release files.

## Blocking Items
1. No native Android project in repository.
2. No `.aab` bundle to upload.
3. No signed release.
4. No public privacy policy URL yet.
5. No final PNG screenshots exported in Play Store dimensions yet.

## Fastest Practical Path
1. Wrap the current app with Capacitor.
2. Configure Android package name and app icon.
3. Build release `.aab`.
4. Export screenshots and feature graphic to PNG.
5. Upload package and store assets to Play Console.
