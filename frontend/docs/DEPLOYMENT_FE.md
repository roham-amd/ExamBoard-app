# Frontend Deployment

This phase packages the Next.js app as a standalone Node.js server and runs it behind an Nginx reverse proxy on the same domain as the Django backend.

## Docker Images

- **frontend** — Multi-stage build using `node:20-alpine` that performs `npm ci` and `npm run build`, then copies the `.next/standalone` output into a slim runtime served by a non-root user.
- **backend** — External Django/DRF image. Override the `BACKEND_IMAGE` environment variable (defaults to `backend:latest`).
- **proxy** — `nginx:1.27-alpine` forwarding traffic and adding caching headers for static assets.

## docker-compose

```bash
docker compose up -d
```

The compose file builds the frontend, starts the provided backend image, and exposes port 80 on the proxy. Requests flow as:

```
Client ─▶ Nginx (proxy) ─▶ frontend (Next.js standalone)
                      └▶ backend (Django/DRF @ :8000)
```

Environment defaults keep the frontend and backend on the same origin, so CORS is unnecessary.

## Environment Variables


| Variable                                                              | Service  | Description                                                 |
| --------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`                                            | frontend | Points requests to the backend via `/api`.                  |
| `FEATURE_REGISTER` / `FEATURE_PASSWORD_RESET`                         | frontend | Server-side toggles for optional auth features.             |
| `NEXT_PUBLIC_FEATURE_REGISTER` / `NEXT_PUBLIC_FEATURE_PASSWORD_RESET` | frontend | Client-exposed mirrors (auto-populated from server values). |
| `BACKEND_IMAGE`                                                       | compose  | Overrides the backend container image.                      |


Create a `.env` file alongside `docker-compose.yml` to override defaults.

## Nginx Configuration

The proxy configuration at `deploy/nginx/default.conf`:

- Proxies `/` to the frontend container.
- Proxies `/api/` to the backend container (no CORS required).
- Adds immutable cache headers for `/_next/static` assets.

Adjust TLS termination or additional headers as needed for production.
