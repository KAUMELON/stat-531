# STAT MAASH — interactive agricultural statistics classroom

Live: https://kau-agstat-teaching.web.app/

Department of Agricultural Statistics. STAT MAASH means **Mentor AI for Academic Success and Help**.

## Current build — 16 October 2026

The classroom has replaced the original public narration-first preview. The student interface has a colourful learning pathway and a three-panel laboratory: activity, real R workspace, and STAT MAASH. The original Quarto textbook is retained.

- 14 chapters, 726 activities: 391 explanations, 218 original R code blocks, 70 interleaved self-assessment questions, 14 practical coding challenges, 14 reflections, 14 server-marked chapter checkpoints, and 5 adjustable R simulations.
- The importer follows all chapter prose and preserves nested R examples inside Quarto document demonstrations. The complete rendered book remains available for original formatting, figures, tables, and cross-references. This is a paced adaptation of the author's chapters, not a claim that every card has undergone a separate instructional-design review.
- Syntax-coloured script editor, real R console, plot gallery, environment inspection, CSV import, supported webR package installation, script download, and session stop/reset. R is webR 0.6.0, executed in a browser worker. Browser R cannot execute desktop installers, Quarto/LaTeX rendering, arbitrary native packages, or local disk paths without adaptation. CSV files and R objects exist in that running session; scripts, progress, chapter marks and recent tutor conversations are saved to the account.
- STAT MAASH receives the current approved activity, the student's code, actual client-reported execution transcript, and recent conversation. It gives guidance rather than claiming to execute R. Data shared with the AI are disclosed next to the question box. Never use confidential field/student data in an AI prompt.
- Learning XP and local R challenge checks are formative. They are not official examination marks and do not independently prove attendance or prevent cheating.

## Registration and administration

1. Student requests an account with name, email and password.
2. Firebase sends an email verification link on registration or an explicit resend request. Ordinary sign-ins do not issue competing links. The verification email includes a return link to the classroom.
3. The student remains in a waiting room until the department approves the account.
4. Verified administrators **pratheesh.pg@kau.in** and **statoberry@gmail.com** have the Admin navigation item and can approve or suspend students. The requested Pratheesh account was provisioned through Firebase Authentication with an approved profile. Its supplied password was handled only in memory and verified by a password sign-in; it is never stored in source or logs. Email verification remains required.
5. Approval checks use the current Firestore profile on every protected request. An email-verified account alone is insufficient. An approved student cannot approve others, import books, or release examination grades.

The admin desk supports an approval queue, suspensions, provisional examination review/release and importing prepared JSON book manifests. Imported books are private departmental reading material. Rich interactive activities, practical checks, narration and slides for additional books still need preparation and academic review; arbitrary PDF/DOCX ingestion is not implemented.

## Authentication and private content

The landing page renders immediately while session validation happens in the background. Unverified accounts show separate email-verification and department-approval states, a Check email verification button, and an explicit resend action requiring password confirmation.

The old public Firebase browser-SDK sign-in failure was resolved by moving the app to same-origin Firebase session endpoints. Email/password authentication remains Firebase Authentication. Passwords pass over TLS to Identity Toolkit, are not logged or saved in Firestore, and are never written into project files.

The gateway sets the Firebase `__session` cookie with Secure, HttpOnly and SameSite=Strict for five days. Mutating requests require the classroom's exact Origin and a custom request header. Registration and login have server-side request limits. Reset responses do not disclose whether an email exists. Account revocation, current verification and approval state are checked on the server.

Firebase Hosting serves only the application shell and public configuration. It excludes `course.json`, `practice.json`, `books/**`, `audio/**`, and `decks/**`. Protected resources are delivered through `/learning-assets/**`; lesson data use `/api/classroom`. Anonymous requests return 401; pending/suspended students receive 403. The old public resource routes return 404. Private responses use `Cache-Control: private, no-store`.

Firestore client rules deny profile/status/progress/grade writes. The authenticated gateway saves learning records. The original callable tutor and assessment endpoints also enforce approval. Browser code cannot grant itself admission by changing a UI flag. Previously downloaded material cannot be recalled from a student's device.

## Exams and chapter marks

Each chapter ends with a server-marked practice checkpoint. Ratings persist in the student's private practice records. Learners can retry these formative checks.

The final exam has 14 objective questions, a 25-minute server-issued deadline, saved answers, resume support, and one attempt per student/course. Late submissions use only answers saved before the deadline. AI tutoring is blocked during an active examination. Marks remain provisional until instructor release. This is not a proctored exam or automatic marking of arbitrary R programs; an instructor-led R practical is still appropriate.

Completion and learning XP are self-reported/formative. The final answer key is in Functions source, never in public hosting. Additional final attempts require instructor administration of the attempt lock.

## Firebase and costs

Project: `kau-agstat-teaching`; functions and Firestore: `asia-south1`. The owner approved Blaze billing. The project uses the existing billing account associated with RAISINS/RAISINS-AI. Vertex AI uses `gemini-3.8-flash` through its global endpoint, with server credentials only. The runtime has project-scoped access for Auth, Firestore, and Vertex AI.

Tutor limits are 30 requests per learner/day and 300 per project/day, at most 1,000 output tokens per response. Functions have maxInstances=2, minInstances=0. These are usage controls, not a guaranteed monetary cap.

An optional seven-day deployment-image deletion policy was previously rejected by automatic approval review; no retention/deletion policy was applied. Images are preserved. Firebase CLI reports the successful function deployments before exiting with that optional cleanup-policy warning. Use API tests and function status to distinguish this from a deployment failure. Do not use `--force` to bypass the decision.

## Build and verify

From the book root, render the original Quarto book when the source changes. Existing scripts prepare the original book, PPTX and narration assets. From this directory:

```text
python scripts/build-course.py
python scripts/build-learning.py
python scripts/prepare-private-assets.py
python scripts/check-learning.py
node --check public/classroom.js
node --test functions/test/*.test.js
```

`build-course.py` refreshes the original six-slide overview decks' source manifest; the new interactive pathway comes from `build-learning.py`. Generated books/audio/PPTX are ignored by Git and must be regenerated or retained locally for a full deployment. The editable overview PowerPoints do not embed audio. The interactive classroom offers browser narration per explanation; protected WAV files remain available as original lecture resources.

Publish functions and Firestore rules, then publish Hosting separately. Keeping hosting separate allows its release after the optional function-image cleanup warning. Keep `.env*`, credentials, debug logs, generated media, and QA accounts out of version control.

## Verification evidence

- Seventeen unit tests cover approval, suspension, instructor identity, origin checks, asset traversal, answer validation and grading.
- Seventeen live classroom checks cover secure registration/session cookies, verification and approval gating, private assets, student/admin boundaries, saved drafts/conversations, live activity-grounded AI, persistent chapter ratings, exam eligibility, suspension and logout. Synthetic users are removed afterward.
- Nineteen exam regression checks passed, including private record isolation, deadlines, saved answers, repeat submission and result-release restrictions.
- All 14 practical challenge solutions passed their checks in real browser R; the transcript is `qa/r-practical-verification.txt`.
- `check-learning.py` verifies all 218 original R blocks, unique activity IDs, the checkpoint bank and Hosting exclusions. Browser QA verifies registration, the waiting room, approval, actual plots, tutor feedback, question retry, practical checks, adjustable simulations, saved work and responsive layout.

QA reports and screenshots are under ignored `qa/`. The requested administrator account must complete email verification before approving real students. The existing owner can still register and verify their own administrator account. Instructor release of real grades was not performed on anyone's behalf.


## Email action pages

An optional custom handler is deployed at `/account-action.html`. Firebase rejected the template callback update with `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`; outgoing emails still use the default Firebase handler. The page sends the one-time code to a same-origin endpoint for inspection. The server derives the action type from Firebase's validated code, so an absent or invalid URL `mode` does not cause Firebase's generic selected-page-mode error. It supports email verification, password reset and restoring an email address. A missing code displays guidance and a return-to-classroom link. Expired/used codes receive a clear recovery message.

Inspection and merely opening the link never consume it. The user confirms the action explicitly. Account actions are rate-limited, require the classroom Origin/header, and use only the configured project's API key. The page has no external resources, removes action parameters from the address bar after reading them, and uses no-referrer/no-store headers. Passwords and one-time codes stay out of source and logs. Email verification is never simulated or bypassed for a human account.

`node scripts/test-email-actions.cjs` checks actual one-time-code inspection, verification, reuse rejection and password reset with a disposable synthetic account, then removes that account. The seven action-handler unit tests cover malformed links, type inference, inspect-only behavior, mismatched actions and password validation.

## WINE-inspired chapter study desk — 17 October 2026

Reviewed the author's local WINE source (`D:\STATOBERRY\Training-APP`, including `ui.R`, `dir/train_ui.R` and lesson/quiz flow in `dir/train_server.R`). STAT MAASH now has a searchable lecture catalogue and a study desk for each chapter, with a topic contents sidebar, continuous topic explanations, worked code, copy buttons, links to the real R workspace and contextual tutor, and inline formative questions with immediate explanations. Fourteen individually written chapter briefs supply an agricultural investigation, prerequisites, a practical task and a misconception to examine. Original prose is grouped into 231 topic sections; it has not been replaced with short slide summaries.

The full original rendered book opens inside the platform with persistent chapter navigation, introduction, course guide, dictionary, glossary and references. The original edition preserves figures, tables, cross-references and appendices; the study desk is a reading-and-practice companion. Existing approved-student access, real R, assessment and saved progress endpoints are unchanged. No narration starts automatically.

`node scripts/check-study.cjs` renders every topic view and checks all 218 original R examples and chapter-reader links. This checks coverage and rendering, not a claim that every original passage has received a new academic review. The editable six-slide overview PPTX decks remain overview resources; they were not expanded into complete lecture decks in this update.
