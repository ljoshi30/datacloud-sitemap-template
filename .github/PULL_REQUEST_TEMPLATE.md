<!-- This template forces the "who/why/what" that the Data Cloud UI can't record. -->

## What changed in the sitemap?
<!-- Which page types / events / captures were added, changed, or removed? -->

## Why?
<!-- Business reason. Link the ticket/request. -->

## Testing
- [ ] Validated locally with the Interactions SDK Launcher Chrome extension (Sitemap Editor) on the target site
- [ ] `npm run build` run and `build/sitemap.js` committed
- [ ] `npm run validate` passes
- [ ] Verified events fire as expected in the SDK debug console

## Deployment
- [ ] I understand this must be pasted into Data Cloud via **Upload | Replace Sitemap** after merge (there is no deploy API)
- [ ] After deploy, I will confirm the drift-check passes (live == this PR's `build/sitemap.js`)

## Rollback plan
<!-- Which commit/tag to redeploy if this misbehaves. -->
