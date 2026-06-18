# LinkedIn Campaign — Solo Ledger

**Goal:** position you as a first-year CS student who *ships*. Build credibility,
attract people in tech, start conversations. LinkedIn rewards genuine story + value,
not hype.

**Voice:** humble-confident, reflective, specific. Write like a smart junior who
learned real things. Short paragraphs, lots of line breaks (LinkedIn is skim-first).

**Cadence:** 5 posts over ~2.5 weeks — Mon/Thu rhythm. Don't dump them all at once;
let each breathe and reply to every comment within the first 2 hours (the algorithm
weighs early engagement heavily).

**Hashtags:** keep to 3–5, professional. Reuse a core set:
`#BuildInPublic #WebDevelopment #ComputerScience #ReactJS #SoftwareEngineering`

**Format tips:**
- The first 2 lines are the hook — everything after "…see more" must earn the click.
- A **document (PDF) post** swipes natively → upload `tutorial/Solo-Ledger-User-Guide.pdf`
  for a high-reach carousel.
- Native video (a screen recording) outperforms links. Put any link in the **first
  comment**, not the body (link-in-body suppresses reach).

---

## Post 1 — The launch story (Day 1, document or image post)

> **I'm a first-year Computer Science student. I just shipped my first real app.**
>
> It's called Solo Ledger — a personal finance tracker that does something unusual:
> it keeps **none** of your data.
>
> No account. No server. No cloud. Everything you type lives on your own device, in
> your browser. Close the tab, come back next week, it's all still there — and it never
> left your machine.
>
> I didn't set out to build "another finance app." I set out to learn what it actually
> takes to ship one: how data persists, how state flows through a UI, why offline-first
> is hard, and how to make something feel finished instead of like a class project.
>
> A few things it does:
> → A rolling monthly ledger — last month's leftover becomes this month's starting point
> → Net-worth tracking (cash + investments) on a 12-month chart
> → Investment tracking that separates *real growth* from money you just deposited
> → 14 fully distinct visual themes, because software should have personality
>
> Built with React, TypeScript and Vite, as a PWA you can install like a real app.
>
> I learned more in this one project than in a semester of tutorials. Building the
> thing teaches you the thing.
>
> Demo in the comments. Would genuinely love feedback from people further down this road. 🙏
>
> #BuildInPublic #ComputerScience #ReactJS #WebDevelopment #SoftwareEngineering

*First comment:* `Live demo 👉 [LIVE LINK]  ·  Happy to answer anything about how it works.`
*(only if public)* add: `Code: [GITHUB LINK]`

**Visual:** upload the **PDF guide** as a document post, OR `tutorial/shots/dashboard.png`.

---

## Post 2 — Technical deep-dive: offline-first (Day 4)

> **"Where does the data live?" is the most interesting question I had to answer.**
>
> Most apps answer it with: a database, on a server, behind a login.
>
> Solo Ledger answers it with: **your browser.**
>
> All the data sits in IndexedDB (via Dexie) — a real database that ships inside every
> browser, on the user's device. That one decision changed everything:
>
> • No backend to build, host or pay for
> • No privacy policy to write, because I never receive your data
> • It works fully offline — installable, opens instantly, no network needed
> • The trade-off: if you clear your browser or switch devices, it's gone — so I built
>   a one-file export/import backup to solve that
>
> The surprising part: removing the server made the app *simpler and better*, not
> weaker. For a single-user finance tool, "your data never leaves your device" isn't a
> limitation — it's the feature.
>
> Constraints make better products. Who knew. 😄
>
> #BuildInPublic #WebDevelopment #ReactJS #SoftwareEngineering #ComputerScience

**Visual:** a simple diagram (You → Browser → IndexedDB, no server) or `shots/settings.png`
(shows the Backup section).

---

## Post 3 — Design as a feature: the 14 themes (Day 8, carousel)

> **I gave my finance app 14 personalities. Here's why that wasn't a waste of time.**
>
> A budget app is the kind of thing you open with a sigh. I wanted one you'd actually
> *want* to look at.
>
> So instead of one theme, Solo Ledger has fourteen — and they're not just colour
> swaps. Each is a full "world": its own palette, its own animated background, its own
> little signature ornament on the dashboard, even its own typography.
>
> A hand-brushed Japandi ensō. A rain-slick cyberpunk neon sign. A printed manga page
> with screentone. A Swiss-industrial spec sheet. A pencil-on-graph-paper sketch.
>
> Switching is instant and remembered on your device.
>
> What I learned: **polish is a skill you practise, not a thing you add at the end.**
> Getting these right taught me more about CSS, animation and design systems than any
> amount of theory.
>
> Swipe through a few 👉
>
> #BuildInPublic #WebDevelopment #UIDesign #ReactJS #FrontEnd

**Visual:** a carousel of 4–6 dashboards in different themes. *(Ask me to generate the
multi-theme screenshot set.)*

---

## Post 4 — Building with AI, honestly (Day 12)

> **I built this with an AI pair-programmer. Here's the honest version of what that's like.**
>
> As a first-year student, I paired with Claude Code through the whole build of Solo Ledger.
>
> What it did NOT do: think for me. I still had to decide what to build, understand
> every piece, and make the calls when there was a fork in the road.
>
> What it DID do: collapse the gap between "I have an idea" and "I can see it running."
> I learned faster because I could ask *why*, not just *how* — and I read every line
> that went in.
>
> The risk people warn about is real: you can ship code you don't understand. My rule
> was simple — if I couldn't explain it, it didn't go in.
>
> The result is an app I can defend line by line, built faster than I could have alone.
> That feels like the actual future of learning to code, not a shortcut around it.
>
> #BuildInPublic #ComputerScience #AI #SoftwareEngineering #LearningToCode

**Visual:** `shots/dashboard.png` or a candid "my setup" photo.

---

## Post 5 — Reflection + soft CTA (Day 16)

> **Three things this project taught me that no tutorial did:**
>
> 1. **Finishing is the hard 20%.** Anyone can build a dashboard. Edge cases, empty
>    states, backups, "what happens on a fresh install" — that's where real software lives.
>
> 2. **Data modelling is the whole game.** Once I got the shapes of income, expenses and
>    investments right, the UI almost wrote itself. Get it wrong and you fight it forever.
>
> 3. **Taste is a technical skill.** Caring how it looks made me better at the code, not worse.
>
> Solo Ledger is live and I'm proud of it — but mostly I'm proud of how much I didn't
> know three months ago.
>
> If you're early in your dev journey: pick something real and finish it. It compounds.
>
> Demo's in the comments. On to the next one. 🚀
>
> #BuildInPublic #ComputerScience #SoftwareEngineering #WebDevelopment

*First comment:* `Try it 👉 [LIVE LINK]`

---

## Engagement playbook
- Reply to every comment in the first 2 hours; ask a follow-up question back.
- Spend 10 min before posting commenting genuinely on others' posts (warms reach).
- DM 5–10 people who'd find it interesting with a personal note, not a copy-paste.
- Repost Post 1 as a "in case you missed it" ~3 weeks later with one new learning.
