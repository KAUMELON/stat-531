# Department of Agricultural Statistics — AgStat Academy

**AI teacher: STAT MAASH — Mentor AI for Academic Success and Help.**

Firebase project: `kau-agstat-teaching` (created 16 October 2026).

Hosting URL: https://kau-agstat-teaching.web.app

The initial course imports the author's approved Quarto textbook. The book itself remains editable in the parent directory. This platform adds a course library, 14 chapter paths, 84 overview lecture slides, narration clips and transcripts, 14 downloadable editable PowerPoints, runnable webR exercises, chapter self-assessment, and browser-local preview progress.

## Activation status

The project starts without billing. Hosting and restrictive Firestore rules are deployed. The default Firestore database uses `asia-south1` (Mumbai).

Student authentication is not activated. The Firebase console returned an account/terms-status loading error in this session. The public Identity Platform initialization API requires billing and was not used to upgrade the project. Basic Firebase Authentication can be initialized through Authentication → Get started in the Firebase console, followed by enabling Email/Password. That console step must be completed before setting `authenticationReady: true` in `public/platform-config.json`.

Generative tutoring and formal exam marking are implemented as Cloud Functions but are not deployed. Cloud Functions requires a billing-enabled project. No billing account was linked, no paid plan was enabled, and no AI provider requests were sent. Configure billing only with the project owner's authorization. The current fallback retrieves chapter passages and explicitly labels them as book references rather than AI answers.

## Server activation after billing authorization

1. Enable the Cloud Functions, Cloud Run, Artifact Registry, Cloud Build, and Vertex AI APIs in this project. Use the CLI to deploy `functions` after installing its dependencies.
2. Set the `INSTRUCTOR_EMAIL`, `AI_MODEL`, and `EXAMS_OPEN` function parameters. The prepared model is `gemini-3.8-flash` through the Vertex AI global endpoint; confirm provider availability before activation. The runtime service account needs Vertex AI user access. Credentials stay on the server through Application Default Credentials; the browser never receives an AI provider secret.
3. Initialize Email/Password Firebase Authentication and verify a teacher account using the configured instructor email. The Firebase CLI owner's email is the initial instructor identity. Change both Firestore rules and function configuration if the departmental owner changes.
4. Test real sign-in, progress isolation, teaching responses, a timed examination, late submissions, and instructor release before opening student assessments. The server grader's pure tests pass, but production function integration is pending.
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

Serve `public` with an HTTP server. Run `python scripts/check-platform.py`, `node --check public/app.js`, and `node --test functions/test/grading.test.js`. Dependencies for server deployment are in `functions/package.json`. Presentation validation reports and previews are under ignored `qa/`. Browser checks cover routes, practice feedback, local persistence, code execution, lecture playback, retrieval, access states, and mobile layout. Live authenticated student/instructor integration remains pending authentication activation.

Deployment: `firebase deploy --only hosting,firestore:rules --project kau-agstat-teaching`. Keep credentials out of source and logs. The public Firebase web configuration is not an administrative secret; Firestore rules enforce access.
