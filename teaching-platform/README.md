# Department of Agricultural Statistics — AgStat Academy

**AI teacher: STAT MAASH — Mentor AI for Academic Success and Help.**

Firebase project: `kau-agstat-teaching` (created 16 October 2026).

Hosting URL: https://kau-agstat-teaching.web.app

The initial course imports the author's approved Quarto textbook. The book itself remains editable in the parent directory. This platform adds a course library, 14 chapter paths, 84 overview lecture slides, narration clips and transcripts, 14 downloadable editable PowerPoints, runnable webR exercises, chapter self-assessment, and account-linked student progress. Browser-local progress remains available for guests.

## Activation status

On 16 October 2026 the owner approved Blaze activation. The teaching project now uses the existing billing account shared by RAISINS and RAISINS-AI. Email/password Firebase Authentication is enabled. All nine Cloud Functions are ACTIVE in `asia-south1`, and the Vertex AI teacher is connected to `gemini-3.8-flash` through the global endpoint.

Nineteen live integration checks passed using isolated QA students, including sign-in, chapter-grounded teaching, server marks, private-record isolation, exam eligibility, answer persistence, deadline enforcement, repeat-submission handling, and student/instructor access boundaries. The script removed its synthetic users and records afterward. Local browser tests passed for registration through the rate-limited endpoint, sign-in, live tutoring, chapter feedback, and saved progress. The published classroom loads, but sign-in on both Firebase hosting domains still returns auth/network-request-failed in the Codex in-app browser. The cause is unresolved; do not declare public student enrolment ready until a normal-browser sign-in is verified. Changing Firebase app names and persistence modes did not fix that public-browser failure.

The initial instructor identity is the verified owner email in `public/platform-config.json`. The owner should register with that email, verify it, and open Teaching desk. No password or human account was created on the owner's behalf.

An optional seven-day Artifact Registry image-deletion policy was rejected by automatic approval review because that retention period lacked explicit authorization. No image-deletion policy was applied. Existing deployment images are preserved. This does not stop the running functions.

## Deployment and instructor administration

1. Enable the Cloud Functions, Cloud Run, Artifact Registry, Cloud Build, and Vertex AI APIs in this project. Use the CLI to deploy `functions` after installing its dependencies.
2. Set the `INSTRUCTOR_EMAIL`, `AI_MODEL`, and `EXAMS_OPEN` function parameters. The prepared model is `gemini-3.8-flash` through the Vertex AI global endpoint; confirm provider availability before activation. The runtime service account needs Vertex AI user access. Credentials stay on the server through Application Default Credentials; the browser never receives an AI provider secret.
3. Initialize Email/Password Firebase Authentication and verify a teacher account using the configured instructor email. The Firebase CLI owner's email is the initial instructor identity. Change both Firestore rules and function configuration if the departmental owner changes.
4. Test real sign-in, progress isolation, teaching responses, a timed examination, late submissions, and instructor release before opening student assessments. The server grader's pure tests pass, and the live student integration checks are recorded in `qa/live-integration.json`.
5. Review the starter question bank for academic suitability. It contains 28 practice questions and 14 private final questions. The final is a short objective assessment, not a complete R programming practical examination or proctored exam. The current app does not automatically grade arbitrary student R programs.
6. Set `authenticationReady`, `backendReady`, and `aiReady` only after their checks pass. Set `EXAMS_OPEN=true` and the matching `examsOpen` UI flag only after instructor approval. Keep `false` flags for services that are not active.

## Data and grading

- Student profiles, completion, and practice scores are private to that student and the verified instructor. Browser-local preview progress is a convenience, not a trusted grade.
- Only server functions can write `attempts`. Final answer keys ship inside the Functions source, never in Hosting. Public practice answers are intentionally available for learning.
- The server issues an exam deadline, saves answers, marks submissions, and makes marks provisional. An instructor releases results. One final attempt per student/course is enforced with a transactional lock. Additional attempts currently require instructor administration of that lock.
- Completion flags are self-reported. They do not independently prove learning or attendance. The platform does not claim to prevent outside AI assistance or provide proctoring.
- AI tutoring requires verified authentication, uses approved chapter context, and refuses service during an active exam. Limits: 30 requests per student/day, 300 project requests/day, 1,000 output tokens per response, max 2 function instances. These are usage controls, not a guaranteed monetary spending cap. Billing budget alerts do not cap expenditure.

## More books

Verified instructors can import a JSON course manifest or a selection of chapter `.qmd` files through Teaching desk. A manifest example is `public/book-template.json`. QMD import extracts text and a first R example; instructors must review the lesson slides and provide questions. PDF/DOCX conversion and automatic generation of high-quality full lectures for arbitrary uploads are not implemented. Imported books remain in Firestore, readable by signed-in students. The original static course stays intact.

## Narration and PowerPoint

The lesson player uses generated WAV files, with transcripts and speed controls. Narration uses the installed Microsoft Zira Desktop voice and is synthetic. PowerPoints contain editable slide text and speaker notes; the WAV tracks play in the web platform, rather than being embedded in the PPTX. Original author prose remains in the complete textbook; overview lectures do not replace all chapter detail.

## Local checks

Serve `public` with an HTTP server. Run `python scripts/check-platform.py`, `node --check public/app.js`, and `node --test functions/test/grading.test.js`. Dependencies for server deployment are in `functions/package.json`. Presentation validation reports and previews are under ignored `qa/`. Browser checks cover routes, practice feedback, local persistence, code execution, lecture playback, retrieval, access states, and mobile layout. Live student API integration passed; the owner must complete their own instructor registration and email verification.

Deployment: `firebase deploy --only hosting,firestore:rules --project kau-agstat-teaching`. Keep credentials out of source and logs. The public Firebase web configuration is not an administrative secret; Firestore rules enforce access.

Student registration uses a rate-limited callable endpoint (100 registrations per network/day, 500 project/day). Passwords travel over TLS to the Firebase registration service and are never logged or stored in Firestore. Firebase Authentication manages password storage. Newly registered users must verify their email before AI tutoring and assessed learning.

If a restrictive browser prevents token refresh after email verification, the app asks the student to sign in again to obtain a fresh verified session. Authentication uses local browser persistence and Firestore uses long polling for network compatibility.
