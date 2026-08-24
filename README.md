# Hamdan AI

Global AI video generation platform — GitHub Pages frontend.

## Included
- Modern responsive dashboard
- Text → Video
- Image → Video
- Audio → Video
- Video → Video
- Avatar → Video
- Script → Video
- 3D → Video
- Multi-input workflow
- Global language selection
- Templates and projects UI
- AI Services Center UI
- AI Assistant UI
- Security Center UI
- Credits, billing and Pro plan UI
- Mobile responsive layout

## Hamdan Developer

Hamdan Developer follows a controlled engineering lifecycle:

**Understand → Inspect → Plan → Approve → Change → Test → Deploy → Verify**

The workflow is deterministic: requests are classified into an explicit engineering stage and the next allowed stages are returned to the interface.

### Repository inspection

`POST /api/project-inspect` provides a read-only inspection authorization response for approved repositories. The current foundation explicitly approves `Hamdan852/hamdan-ai` and does not perform writes.

Inspection is intentionally separated from code changes and production deployment.

## Important
This repository is a **frontend prototype**. GitHub Pages can host the interface, but real video generation, authentication, payments, storage, AI model calls and production security require a backend.

Never commit API keys or payment secrets to GitHub.

## GitHub Pages
1. Upload `index.html`, `styles.css`, `app.js`, and this README to the repository root.
2. Open repository **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Choose `main` and `/ (root)`.
5. Save and wait for deployment.

## Production architecture
Recommended backend services:
- Authentication + user database
- Secure API gateway
- Video job queue and worker system
- Object storage/CDN
- AI video/image/audio providers
- Stripe or another payment provider where legally available
- Rate limiting, WAF/DDoS protection, monitoring and audit logs

The owner account can be configured with a separate owner entitlement server-side; do not make the browser trust an "unlimited" flag.
