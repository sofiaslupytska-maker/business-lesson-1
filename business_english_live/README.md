# Live Business English Classroom

Two Business English units: **The Economy** and **The Business Cycle**. Features original/adapted readings, English–Ukrainian vocabulary flashcards, interactive sentence ordering by drag-and-drop OR tapping, definitions matching, short writing, and a graded comprehension test. Teacher dashboard receives student activity and typing previews with Server-Sent Events (SSE).

## Run locally

Requires Node.js 18+. No npm dependencies.

```bash
cd business_english_live
TEACHER_PASSWORD='choose-a-long-secret-password' STUDENT_PIN='2007' npm start
```

Then open `http://localhost:3000` in a browser. Select **I'm a student** and use `2007`, or **I'm the teacher** and use your secret password. Open two different browsers or incognito windows to test the live view.

## Deploy

Deploy this folder as a **Node web service** on a host that runs a continuously active Node server (e.g. Render or Railway): build command blank, start command `npm start`, root directory this folder. Set environment variables `TEACHER_PASSWORD` (long private value), `STUDENT_PIN=2007`, `NODE_ENV=production`. The host assigns `PORT` automatically. Use the resulting **HTTPS URL** for both student and teacher; do not share the teacher password. A static-only host such as a plain Netlify static file upload **will not** provide live updates.

## Privacy and limitations

- The code `2007` is a shared classroom access code, **not strong authentication**. Students can reuse that code. For stronger security, use individual student accounts or one-time invitation links.
- Teacher requires a separate secret password (minimum 12 characters). Passwords are compared using timing-safe hashes; authentication cookies are HttpOnly and marked Secure in production.
- This collects students' names, in-lesson answers, short writing, typing previews, and navigation events after login. **It does not capture the keyboard outside the website or stream their screen.** Tell students before use.
- Data are held only **in server memory** and disappear if the server restarts. A free hosting tier may sleep or restart. This is suitable for a demo or small supervised lesson, not permanent records or production-grade high-sensitivity data. Export teacher activity to CSV before ending the lesson.
- A malicious person with the shared student PIN can impersonate a student; names are not independently verified. Restrict who receives the classroom link. Activity is not cryptographically audit-proof.
- The service should be run behind HTTPS; no local HTTP exposure to the internet. Login attempts are rate-limited per IP on a best-effort basis.
- One process only: in-memory sessions and events do not synchronize across multiple server replicas.
- Mobile users can **tap** words to move them instead of dragging.

## Content

Reading passages are newly written summaries inspired by the supplied economics pages, not word-for-word copies. English–Ukrainian flashcards include 36 key terms. The interactive quiz contains 15 conceptual comprehension questions and the practice page includes 4 word-order builders, 6 matching tasks, and 2 writing prompts.
