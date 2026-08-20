# Security Notes

- Do not place API keys, Stripe secret keys, database passwords, or provider tokens in frontend files.
- Use server-side environment variables.
- Verify payment webhooks server-side.
- Apply authentication and authorization to every protected API.
- Rate-limit generation endpoints.
- Validate uploaded files and enforce file-size/type limits.
- Use signed URLs for private media.
- Add WAF/DDoS protection and monitoring before public launch.
- Keep audit logs for security-sensitive actions.
