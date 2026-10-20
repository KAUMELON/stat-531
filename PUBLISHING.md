# Published reading edition

## GitHub Pages — current public book

- Reading URL: https://kaumelon.github.io/stat-531/
- Published: 20 October 2026 (IST).
- Repository: https://github.com/KAUMELON/stat-531
- Editable Quarto sources: branch `codex/quarto-undergraduate-book`.
- Rendered reading site: branch `gh-pages`, root `/`, with `.nojekyll`.
- Initial revised-book publication commit: `14e6ebf`.
- Validation: 20 HTML pages, 64 images, no broken local links or anchors.

GitHub previously served the older bookdown edition from `main/docs`. Pushing the revised sources to a different branch did not update that publication. Pages now uses the rendered Quarto edition on `gh-pages`. The original `main/docs` files remain in repository history and have not been overwritten by this publication.

The public book contains the detailed retained chapters, current installation screenshots, the RAISINS software section, the final AI/vibe-coding section, copyable examples, and 14 browser R laboratories. It includes only textbook reading resources, not the teaching platform, authentication files, student records or local Site checkouts. STAT MAASH remains separately hosted at https://kau-agstat-teaching.web.app/ with its approved-student access controls.

## Updating the public edition

1. Edit the QMD sources and run `quarto render --to html`.
2. Run `python scripts/prepare-github-pages.py output/github-pages-NEW-RELEASE`, choosing a new folder inside `output/`. The packager copies only public reading resources.
3. Run `python scripts/check-book.py output/github-pages-NEW-RELEASE` and fix any reported errors before publishing.
4. Commit the staged reading files to `gh-pages`, retaining its existing history, and push that branch. Do not merge the generated branch into the source branch.
5. Check deployment with `node scripts/github-pages.cjs build`. The helper uses the KAUMELON account in Git Credential Manager and never writes or prints its token. `status` reports the Pages configuration; `rebuild` requests a build when needed.
6. Confirm the latest publication commit is built and open the public reading URL. Pushing only source changes does not render or publish a new edition.

## Earlier private Site deployment

A separate owner-private reading edition was published using the Sites plugin on 16 October 2026:

- URL: https://r-agricultural-data-analysis.deepfrog8.chatgpt.site
- Site ID: appgprj_6ad20240ee148191894fe747aa4609fe
- Deployment ID: appgdep_6ad21af637c88191aa2042d086432d62
- Saved version: appgprj_6ad20240ee148191894fe747aa4609fe~appgver_54fcc91bedd48191adf02e409375b2ce

That Site remains separate from GitHub Pages. Its local checkout is `sites/agri-r`; reuse its existing identity if updating it. The public GitHub Pages URL above is the reading link to share with students.
