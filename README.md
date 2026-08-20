# TRAINING.LOG — Android build

This is the workout web app wrapped with [Capacitor](https://capacitorjs.com)
so it can be built and run as a real Android app (via WebView). The web
assets are already built and copied into `android/app/src/main/assets/public`,
so the `android/` folder is ready to build as-is — no `npm install` needed
just to produce an APK.

## Option A — build in the cloud with GitHub Actions (no Android Studio needed)

This repo already includes `.github/workflows/build-apk.yml`, which builds
the APK on GitHub's own servers. Your computer does nothing but push code.

1. Create a new repo on GitHub (public is fine — free unlimited Actions
   minutes; private also works, just has a monthly minutes cap).
2. Push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Training log Android project"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. Go to the **Actions** tab on GitHub. A "Build Android APK" run should
   already be in progress (it triggers automatically on push). Wait for
   the green checkmark (a few minutes).
4. Click into the finished run → scroll to **Artifacts** → download
   **training-log-debug-apk**. That's a zip containing `app-debug.apk`.
5. Transfer the `.apk` to your phone (Google Drive, LINE to yourself,
   USB — anything) and install it. You'll need to allow "install from
   unknown sources" since it isn't signed for the Play Store.

If you change `src/App.jsx` later, you'll need to rebuild the web bundle
and re-embed it before pushing again (see "If you edit the app code
later" below) — the CI job only packages whatever is already sitting in
`android/app/src/main/assets/public`, it doesn't run `npm run build`
itself.

## Option B — build in Android Studio (if your machine can run it)

1. Open **Android Studio**.
2. **File → Open** → select the `android/` folder inside this project.
3. Wait for Gradle sync to finish.
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
5. Find the APK at
   `android/app/build/outputs/apk/debug/app-debug.apk`.

## Option C — CLI only, no IDE, but still local

Requires just the Android **command-line tools** (much lighter than full
Android Studio — a few hundred MB instead of several GB) plus a JDK 17.
Install via `sdkmanager`, set `ANDROID_HOME`, then:

```bash
cd android
./gradlew assembleDebug
```

## If you edit the app code later

The actual UI code lives in `src/App.jsx` (this is the same file as the
`workout-app.jsx` artifact from the chat). After changing it:

```bash
npm install        # first time only
npm run build       # rebuilds the web bundle into dist/
npx cap sync android # copies the new build into the android project
```

Then rebuild the APK from Android Studio (or `./gradlew assembleDebug`)
again.

## Notes

- **App icon / splash screen** are Capacitor's defaults right now. To swap
  in your own, drop a 1024×1024 source icon at `resources/icon.png` and a
  splash at `resources/splash.png`, then run
  `npx @capacitor/assets generate --android`.
- **Persistence**: in the Claude.ai artifact, the app used `window.storage`
  (a Claude-only API) to save workout history. Outside that sandbox this
  build automatically falls back to the browser's `localStorage` via
  `src/storagePolyfill.js` — no extra setup needed, it just works inside
  the WebView.
- **Signing for the Play Store**: this build is a debug APK, fine for
  installing on your own device. If you want to publish it, you'd need to
  generate a signing keystore and configure `android/app/build.gradle`
  with a release signing config — happy to help with that when you're
  ready.
