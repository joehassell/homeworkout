# Handoff — SimpleWorkoutGen / homeworkout

**Repo:** [`joehassell/homeworkout`](https://github.com/joehassell/homeworkout)
**Last touched:** 2026-04-27
**Author of this handoff:** Claude (Opus 4.7)
**Owner:** Joe Hassell (`joehassell@icloud.com`)

This document is everything a new operator needs to pick up the project on a fresh machine and continue toward an App Store submission.

---

## 1. What this project is

A workout-builder web app that's also being packaged as a native iOS app for App Store submission.

- **Web app**: a single-page HTML/CSS/vanilla-JS application at the repo root (`index.html` + `js/`). Deployable as a PWA via GitHub Pages. The exercise database, generator, timer, and history are all in `index.html` (currently ~2200 lines including the inline `<script>` block).
- **iOS shell**: a [Capacitor 8](https://capacitorjs.com) wrapper around the same `index.html`. Lives in `ios/`. Identity is **`com.nomaen.homeworkout`** / display name **`SimpleWorkoutGen`**.

The web app and iOS shell ship the *same* `index.html`. Native-only behaviour (haptics, audio session, native fullscreen) is gated on `window.Capacitor.isNativePlatform()`.

---

## 2. State of the work

### Shipped to `main`

| PR | Branch | What |
|---|---|---|
| #1 | `docs/pdr-v2-features` | Consolidated v2 PDR document |
| #2 | `worktree-v2-pdr` | Full v2 PDR implementation: warmup, cooldown, focus areas, theme picker, font stepper, fullscreen, set rest, single-sided exercises, total-time math, data model |
| #3 | `feat/ios-native` | Capacitor scaffolding, native polish, icon + splash, `IOS_BUILD.md` |
| #4 | `fix/cta-clearance` | Switched setup screen to `100dvh` and bumped nav clearance |

### Open / unresolved bug

**The Generate Workout button is still reported as inaccessible on iPhone portrait** after PR #4. The user reported this twice and the second fix (`100dvh` + `120px + safe-area` padding-bottom) did not resolve it. **No further fix has been attempted; this is the top priority for the next operator.**

What's been tried so far:

1. v2 first attempt: `position: sticky` footer above nav. Rejected — sticky inside a flex column behaves unreliably on iOS.
2. PR #3 attempt: `position: fixed` footer with gradient fade. Rejected — overlaid the bottom of the equipment section permanently.
3. PR #4 (current `main`): in-flow with `margin-top: auto`, `min-height: 100dvh`, `.has-nav { padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px)); }`. **Still reported broken.**

### How to investigate next

I was working blind — I could not see the rendered iPhone layout. The next operator should:

1. Open the deployed PWA on a real iPhone (or iOS Simulator after Xcode is installed) and **screenshot the setup screen** scrolled to the bottom.
2. Use Safari on macOS → **Develop → \[device\] → \[page\]** to inspect computed styles. Specifically check:
   - The `.bottom-nav` actual rendered height (likely 84-100px on devices with a home indicator).
   - The `.screen.has-nav` actual `padding-bottom` (should be 120 + safe-area-inset-bottom; look for any rule overriding it).
   - The `.generate-section` position and dimensions.
   - Whether `min-height: 100dvh` is being applied (check Computed → min-height).
3. If the button is still being obscured, the cleanest fix is probably to **hide the bottom nav on the setup screen entirely**: the user is on the setup screen *because* they pressed Build; they don't need the nav while configuring. Add `body.setup-active .bottom-nav { display: none; }` and bring it back on history/settings.
4. Alternative: introduce a separate `.screen.setup-cta-fixed` rule that uses `position: sticky; bottom: calc(...)` *with* `align-self: stretch; flex-shrink: 0;` and compensating padding-bottom. iOS Safari's flex+sticky combo is fiddly but works if the parent has `display: flex; flex-direction: column;` and the sticky child is the LAST child.

**Don't ship another "should work" fix without verifying on a real iPhone first.**

### Other known-good behavior worth re-verifying

After any setup-screen layout change, verify:

- All 5 themes still render correctly (the heatmap colours are CSS custom properties; check History tab).
- Font stepper at 1.5× does not clip controls on iPhone SE.
- Workout generation in all 4 types × 5 durations × 4 sets still produces sane workouts. Smoke test command in §6 below.

---

## 3. Setting up a fresh machine

### Required

- **macOS** (Apple Silicon or Intel). Anything Sonoma+ is fine.
- **Xcode** — full IDE, not just CLI tools. ~12 GB. Install from the Mac App Store.
  ```bash
  open "macappstore://apps.apple.com/app/xcode/id497799835"
  ```
  After install:
  ```bash
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  sudo xcodebuild -license accept
  ```
  Note: `mas install 497799835` does not work for Xcode unless your Apple ID has previously downloaded it.
- **Homebrew** (`brew --version` should print something).
- **Node** (any current LTS or newer). The repo was built against Node 24.
- **CocoaPods** — `brew install cocoapods`. Capacitor 8 itself uses Swift Package Manager, but several iOS toolchain bits still expect `pod` to exist.
- **GitHub CLI** — `brew install gh` then `gh auth login`. The owner uses SSH for git operations (`git remote -v` should show `git@github.com:joehassell/homeworkout.git`).

### Apple Developer Program

Required only before App Store submission, NOT for local simulator/device builds. $99/year. Sign up at <https://developer.apple.com/programs/>.

In Xcode → Settings → Accounts, sign in with the Apple ID that owns the developer account. Xcode will manage signing certificates automatically.

### Clone and bootstrap

```bash
cd ~/where/you/keep/code
git clone git@github.com:joehassell/homeworkout.git
cd homeworkout
npm install
npm run sync:ios
npm run open:ios          # launches Xcode
```

Then in Xcode: ⌘R to run on the iOS Simulator. First run on a real device requires connecting it and trusting the developer profile in **Settings → General → VPN & Device Management** on the device.

---

## 4. Repository layout

```
homeworkout/
├── index.html                        # The web app — entire UI + generator + timer
├── js/
│   ├── builder.js                    # Work/rest interval helper (used by index.html)
│   ├── storage.js                    # localStorage wrapper for sessions + JSON backup
│   └── history.js                    # History view rendering
├── PDR.md                            # The v2 product requirements document
├── sprint-plan.md                    # Original 3-sprint roadmap
├── README.md
├── CLAUDE.md                         # Working agreement for AI agents (branch rules, commit style, things never to do)
├── HANDOFF.md                        # ← this file
├── IOS_BUILD.md                      # iOS build setup, day-to-day workflow, submission checklist
├── package.json                      # npm scripts: build:web, sync:ios, open:ios, serve
├── capacitor.config.json             # Capacitor identity + plugin config
├── assets/
│   ├── icon-1024.png                 # App icon (1024×1024)
│   └── splash-2732.png               # Launch splash (2732×2732)
├── scripts/
│   ├── make-icon.py                  # Regenerate icon (Pillow)
│   └── make-splash.py                # Regenerate splash (Pillow)
├── ios/
│   ├── App/App.xcodeproj/            # Xcode project — open this with `npm run open:ios`
│   ├── App/App/AppDelegate.swift     # AVAudioSession config for background-safe audio
│   ├── App/App/Info.plist            # arm64, light status bar, healthcare-fitness category
│   ├── App/App/Base.lproj/LaunchScreen.storyboard  # Dark navy background to match the app
│   └── App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png  # The icon, copied from assets/
└── .claude/                          # Per-session worktrees and memory (gitignored at runtime)
```

Generated and gitignored: `node_modules/`, `www/`, `package-lock.json`, `**/xcuserdata/`, `**/DerivedData/`, `ios/App/Pods/`, `ios/App/App/public/`, `ios/App/App/capacitor.config.json`, `ios/App/App/config.xml`.

---

## 5. The day-to-day loop

```bash
# After editing index.html, js/*, capacitor.config.json, assets, etc.
npm run sync:ios          # rebuilds www/ and copies into ios/App/App/public
npm run open:ios          # opens Xcode (if not already open)
```

In Xcode: ⌘R to build and run. Web changes show up after `npm run sync:ios`; native changes (Swift, Info.plist, asset catalogs) require an Xcode rebuild.

To preview the web app standalone (PWA mode):

```bash
npm run serve             # http://localhost:8080
```

Or just `open index.html` for the simplest case.

---

## 6. Generator smoke test

The workout generator has 80 viable configurations (4 types × 5 durations × 4 sets). Before merging any change to `index.html`'s generator, run:

```bash
cd /path/to/repo
python3 -c "
import re
with open('index.html') as f: html=f.read()
ext = open('js/builder.js').read()
m = re.search(r'<script>(.*?)</script>\s*</body>', html, re.S)
inline = m.group(1)
harness = '''
const window = globalThis;
const localStorage = { _d:{}, getItem(k){return this._d[k]||null;}, setItem(k,v){this._d[k]=String(v);}, removeItem(k){delete this._d[k];} };
const document = { addEventListener(){}, documentElement: { setAttribute(){}, removeAttribute(){}, classList:{add(){}}, style: { setProperty(){} } }, querySelector(){return null;}, querySelectorAll(){return [];}, getElementById(){ return { textContent:'', innerHTML:'', value:'', classList:{add(){},remove(){},toggle(){},contains(){}}, dataset:{}, style:{display:''}, disabled:false, files:[], offsetWidth:0 }; }, body:{appendChild(){},removeChild(){}}, fullscreenElement:null };
const navigator = { userAgent:'node', standalone:false };
const speechSynthesis = { speak(){}, cancel(){} };
class SpeechSynthesisUtterance { constructor(t){this.text=t;} }
class AudioContext { constructor(){ this.state='running'; this.currentTime=0; this.destination={}; } resume(){} createBuffer(){return{};} createBufferSource(){return{connect(){},start(){}};} createOscillator(){return{connect(){},frequency:{value:0},start(){},stop(){},type:''};} createGain(){return{connect(){},gain:{value:0,exponentialRampToValueAtTime(){}}};} }
const URL = { createObjectURL: function(){return '';}, revokeObjectURL: function(){} };
const FileReader = class { readAsText(){} };
const Blob = class { constructor(){} };
const alert = ()=>{}; const confirm = ()=>true;
const crypto = { randomUUID:()=>'test-id' };
'''
tail = '''
selectedEquipment = new Set(['bodyweight','mat','dumbbell','kettlebell','barbell','bench','chinup bar','medicine ball','skipping rope']);
let pass=0, fail=0, refused=0;
for (const t of ['strength','hiit','conditioning','functional'])
for (const d of [15,20,30,45,60])
for (const s of [1,2,3,4]) {
  try {
    config = { type:t, duration:d, intensity:'moderate', sets:s };
    generateWorkout();
    if (workout.length===0) { refused++; continue; }
    const target = d*60, sched = workoutScheduledSec();
    if (t!=='strength' && Math.abs(sched-target)>30) throw new Error('time off: '+sched+' vs '+target);
    pass++;
  } catch(e) { fail++; console.error('FAIL', t, d, s, e.message); }
}
console.log('PASS', pass, 'FAIL', fail, 'REFUSED', refused);
'''
import subprocess
src = harness + ext + chr(10) + inline + chr(10) + tail
r = subprocess.run(['node','-'], input=src, capture_output=True, text=True)
print(r.stdout); print(r.stderr[:1500] if r.stderr else '')
"
```

Expected output: `PASS 80 FAIL 0 REFUSED 0` — or 79+1 refused for very tight configs (15min × 4 sets HIIT historically refuses).

---

## 7. App identity and metadata

| Field | Value |
|---|---|
| Bundle ID | `com.nomaen.homeworkout` |
| Display name | SimpleWorkoutGen |
| Marketing version | 1.0 |
| Build | 1 |
| App Store category | Health & Fitness (`public.app-category.healthcare-fitness`) |
| Minimum iOS | 14.0 |
| Required capability | arm64 |
| Status bar | Light content on dark navy `#0a0a0f` |
| Orientations | Portrait + landscape (both, on iPhone and iPad) |

---

## 8. Submission checklist (Phase 7 — once Xcode is installed and a build runs)

- [ ] Apple Developer Program active (joehassell's Apple ID enrolled)
- [ ] App Store Connect record created with bundle ID `com.nomaen.homeworkout`
- [ ] Screenshots taken from the simulator at the required Apple-mandated sizes:
  - 6.7" (iPhone 15 Pro Max): 1290×2796
  - 6.5" (iPhone 14 Plus): 1284×2778 or 1242×2688
  - 5.5" (iPhone 8 Plus): 1242×2208
  - 12.9" (iPad Pro): 2048×2732
- [ ] App Store description, keywords, support URL drafted
- [ ] Privacy policy URL hosted somewhere (the app collects only `localStorage`-scoped session history; a short policy stating "no data leaves your device" suffices)
- [ ] Privacy questionnaire answered: no data collected
- [ ] Archive build: Xcode → Product → Archive → Distribute App → App Store Connect → Upload
- [ ] Submit for review in App Store Connect

---

## 9. Working conventions

From `CLAUDE.md` (project root):

- **Never commit directly to `main`.** Always work on a feature branch (`feat/`, `fix/`, `chore/`, `refactor/`, `docs/`).
- Conventional Commits format: `feat(uploads): add retry on 5xx`. One logical change per commit.
- Things to **never** do without explicit approval: `git push --force`, `git reset --hard` on shared branches, `git rebase` onto main, deleting branches with unpushed commits, modifying CI / Dockerfiles / migrations.
- Adding new dependencies: ask first, list alternatives.

The owner generally approves push and merge after seeing a PR. PR via `gh pr create`, merge via `gh pr merge <n> --merge`.

---

## 10. Open questions / nice-to-haves left on the floor

- **Generator picks Close-Grip Bench Press as a warmup move sometimes.** The warmup pool filter is `cat in ['cardio','mobility','lower-squat','lower-hinge','core','push-h']` and `diff <= 2`. Tightening `push-h` to bodyweight-only (`equip` includes `bodyweight` only) would fix this without bloating the DB.
- **History view shows only main exercises**, not warmup/cooldown. Sessions store `warmup[]`, `exercises[]` (main), `cooldown[]` separately since v2; `js/history.js` only renders `exercises[]`. A small enhancement could show all three.
- **Strength sessions skip the total-time reconcile** because count-up work duration is unknown. The total-time field on the preview shows just rest+warmup+cooldown for strength; the user might find this confusing.
- **Settings_snapshot in saved sessions** is captured but not used. Future enhancement: render past sessions in the theme they were performed in.
- **The fullscreen toggle in the timer header is hidden in the native shell** (`html.is-native .fs-toggle { display: none }`) because the WKWebView is always fullscreen. It's left in the DOM for the PWA path. Could be removed entirely if PWA support is dropped.

---

## 11. If you're an AI agent reading this

- The owner appreciates careful planning before destructive or large-scope changes — they explicitly said "plan carefully" before greenlighting the v2 build.
- They are direct when something is broken ("doesn't seem right", "still not working", "fix this once and for all") — take it seriously, and **stop guessing if a fix doesn't land**. Get screenshots or DOM inspection before another attempt.
- They authorize `git push` and `gh pr merge` per task. Do not assume blanket authorization across sessions.
- The `CLAUDE.md` working agreement is binding — re-read it before starting.
- The Capacitor + iOS shell decisions in this repo (Capacitor 8, SPM-based plugins, `com.nomaen.homeworkout`, dark-themed launch screen) are settled. Don't re-litigate without a reason.
