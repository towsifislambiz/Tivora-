# Tivora Android — Release Guide

## Architecture

```
GitHub Push (to main)  →  Vercel  →  🌐 Website auto-updated
Git Tag (v1.0.0)        →  GitHub Actions  →  📱 Signed APK  →  GitHub Releases
```

---

## How to Release a New Android Version

### Step 1: Update version in package.json
```bash
# Patch update (bug fixes): 1.0.0 → 1.0.1
npm version patch

# Minor update (new features): 1.0.0 → 1.1.0
npm version minor

# Major update: 1.0.0 → 2.0.0
npm version major
```
This automatically:
- Updates `package.json` version
- Creates a git commit
- Creates a git tag (e.g., `v1.0.1`)

### Step 2: Push tag to GitHub
```bash
git push
git push --tags
```

### Step 3: Wait for GitHub Actions
GitHub Actions will automatically:
1. Build the React app
2. Set up Java JDK 17 & Android SDK
3. Run `cap sync android`
4. Build a signed release APK
5. Validate the APK (size, signature, package name)
6. Upload `Tivora.apk` to GitHub Releases

**Build time:** ~10–15 minutes

### Step 4: Share the download link
The APK is always available at:
```
https://github.com/towsifislambiz/Tivora-/releases/latest/download/Tivora.apk
```

---

## First-Time GitHub Secrets Setup

Before the first release, configure these secrets in your GitHub repo:

**Go to:** GitHub → Your Repo → Settings → Secrets and variables → Actions → New repository secret

### Generate a Keystore (do this ONCE)
```bash
# Run this on your PC in any directory
keytool -genkeypair -v \
  -keystore tivora-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias tivora-key \
  -dname "CN=Tivora, OU=App, O=Tivora, L=Dhaka, ST=Dhaka, C=BD"
```
You will be prompted to set passwords.

**⚠️ CRITICAL: Back up `tivora-release.jks` immediately!**
- Copy to PC (encrypted folder)  
- Copy to USB/external drive
- **Losing this file = cannot update the app for existing users**

### Convert keystore to base64
```bash
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("tivora-release.jks")) | Out-File -FilePath keystore-base64.txt -NoNewline
```

### Add GitHub Secrets
| Secret Name | Value |
|-------------|-------|
| `KEYSTORE_BASE64` | Contents of keystore-base64.txt |
| `KEY_ALIAS` | `tivora-key` (or whatever alias you used) |
| `KEY_PASSWORD` | Password you set for the key |
| `STORE_PASSWORD` | Password you set for the keystore |

---

## Update Strategy

### UI / React / CSS / JS changes
1. Make changes to code
2. `git push` → Website updates automatically on Vercel
3. When you're ready to push to Android users too:
   - `npm version patch` → `git push --tags`
   - New APK built and released
   - Installed apps will show update notification on next launch

### Native changes (permissions, plugins, Gradle)
Always requires new APK release. Same flow as above.

---

## How the In-App Update Checker Works

1. App starts → waits 3 seconds (non-blocking)
2. Checks GitHub API for latest release version
3. Result cached in localStorage for 24 hours
4. If new version > installed version → shows update dialog
5. User taps "Update Now" → opens APK download URL
6. User installs new APK → data preserved ✅

**Manual check:** Settings → "Check for Updates"

---

## Package Information

| Field | Value |
|-------|-------|
| App Name | Tivora |
| Package ID | com.tivora.app |
| Min Android | 7.0 (API 24) |
| Target Android | 14 (API 34) |
| Version (initial) | 1.0.0 |

---

## Files Added to Project

```
android/                          ← Capacitor Android project
├── app/
│   ├── build.gradle              ← Version, signing config
│   └── src/main/
│       ├── AndroidManifest.xml   ← Permissions
│       └── res/
│           ├── mipmap-*/         ← App icons (all sizes)
│           ├── drawable/         ← Splash screen
│           └── values/
│               ├── colors.xml    ← Brand colors
│               └── strings.xml   ← App name
│
.github/
├── workflows/
│   ├── website-check.yml         ← Build test on every push
│   └── android-release.yml       ← APK build on version tags

src/
├── hooks/useAppUpdateChecker.js  ← Update check logic
└── components/common/
    ├── InstallAppModal.jsx        ← Updated: real APK URL
    └── UpdateAvailableModal.jsx   ← New: update notification UI

capacitor.config.json              ← Capacitor config (bundled assets)
scripts/generate-icons.cjs         ← Icon generation utility
public/icons/                      ← PWA web icons (all sizes)
```
