# Chat

_Started 2026-08-11 08:49 UTC_

---

## User

Continuing from "Krachttraining app met progressie-tracking".

## Assistant

We're building a strength-training app for a 50+ client with three separate trainer features: client-facing workout execution, trainer dashboard for monitoring, and a program editor for customization.

**What we've built so far:**

The app has three trainings—each with Warming up / Main / Cooldown blocks. Training 1–2 contain fixed exercises (bench press, squats, etc.); Training 3 adds a 15-min stability block plus auto-progressive rowing (starts at user-set duration, grows 10% per week). Clients log weight/time per set (previous value shown in gray), adjust reps and delete sets, tick off sets, start rest timers manually, and end with effort + notes + pain checks. Everything auto-saves to localStorage.

The trainer editor manages one client at a time from a switcher (Tania, Koen & Ann, Jens). Per client: add/remove training days, name each day, add exercises from two open sources (free-exercise-db + wger, 800+ + 862+ items, merged and deduplicated), set their block (warming up / main / cooldown), rearrange with ▲/▼ buttons, adjust sets/reps/kg/rest, delete exercises, and toggle auto-rotation and rowing. Exercises pull from a curated database of ~873 items (Mobiliteit & rekken, Stabiliteit & evenwicht, Core, Kracht, Explosiviteit, Cardio); new ones get sensible defaults. Video links (custom or fallback) open in new tabs.

The trainer dashboard shows per-client KPIs: weight progression graphs per exercise, volume per session, notes and pain flags.

Data model is localStorage-ready for 1:1 swapout to a real backend; API sketch is in the file.

**Current state:** prototype fully interactive with all features live; both open-source libraries (free-exercise-db + wger) integrated with deduplication and attribution.

**Open next steps:** real backend hookup, "+ Add Client" flow with templates, and confirmation guards on destructive actions.

**Files:** BoedtCamp Krachttraining App.dc.html, support.js

