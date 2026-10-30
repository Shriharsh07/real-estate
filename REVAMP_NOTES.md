# EstateHub refresh

## Run locally

Install frontend dependencies with `npm ci`. Start the Go API with `go run .` and the Angular frontend with `npm start`. The existing proxy targets port 8080. Copy `.env.example` to `.env` and provide MongoDB, JWT, and Cloudinary credentials.

Additional environment variables:
- `WHATSAPP_NUMBER`: admin WhatsApp number, including country code, digits only.
- `PUBLIC_APP_URL`: canonical public application origin for enquiry links.

## Accounts and publication

Public signup creates regular users only. Passwords use bcrypt; confirmation is validated but never stored. Emails are normalized and protected by a unique MongoDB index. No verification or password recovery is provided in this release. Admin login is `/admin/login`, using the existing seeded admin. Existing admin tokens must be replaced by signing in again because authorization now requires an explicit admin role.

Existing properties without `published: true` remain private. Review each property in Manage listings and explicitly publish it. Only published properties with `for-sale` or `for-rent` availability are returned to non-admin callers, including direct detail requests. Anonymous responses expose a field allowlist and only the first image URL. Registered detail responses exclude private owner data. Owner management, writes, upload signing, KPI counts, and enquiry records require an admin token.

WhatsApp uses a free click-to-chat link. The server records an enquiry attempt before returning the link; the visitor presses Send in WhatsApp. Records do not confirm sent messages. Enquiry records show the latest 500 attempts.

## Media

Up to 15 photos and 2 videos per property. Original input limits: 10 MiB per image and 100 MiB per video. Images are resized to a maximum 2560-pixel long edge, encoded as WebP at quality 0.92, and only replace the source when smaller. Videos use browser MediaRecorder with VP9/VP8, up to 1080p, 30fps, 8Mbps video and 192kbps audio; only a smaller result replaces the source. This targets high visual quality, not mathematically lossless output. Review video results before saving, especially footage containing fine text or rapid movement. Optimization can run in real time; keep the tab open. Unsupported browsers report an actionable error rather than silently uploading an unoptimized video.

Optimized files upload directly to Cloudinary with an admin-authorized, server-generated signature, bypassing serverless request-size limits. Upload progress is visible. Completed uploads are retained for retry if saving the property fails. Cover selection, ordering, and removal update the property references; removing a reference does not permanently delete the underlying Cloudinary asset. Full images/videos already shared as ordinary Cloudinary URLs are not access-revoked by logging out or unpublishing; this release gates API disclosure, not Cloudinary delivery.

## Validation

- `npm run build`
- `npm test -- --watch=false`
- `go test ./...`

Frontend tests cover INR formatting, missing imagery, empty results, locked/unlocked details, return links, and signup password mismatch. Backend tests cover summary-field privacy, publication/availability, media-count validation, JWT expiration, and admin endpoint role boundaries.

Live MongoDB signup/login, Cloudinary uploads, video quality across target browsers, and WhatsApp handoff require configured services and a final staging smoke test. No production data migration or external upload is performed by the implementation.
