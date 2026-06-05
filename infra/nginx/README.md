# NGINX configuration

- `default.conf`: active starter configuration. Routes `/` to the Next.js `frontend:3000` service.
- `default.full.example.conf`: future full-stack example. Routes `/api/` and `/admin/` to Django.
- `default.ssl.conf.example`: HTTPS/HTTP2/HTTP3-oriented example. It is not active by default.

Docker Compose mounts `default.conf` into `/etc/nginx/conf.d/default.conf`.
Kubernetes/Kustomize turns the same file into a ConfigMap and mounts it into the NGINX Pod.
