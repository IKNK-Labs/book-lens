# NGINX

## 역할 / Role

**한국어**

NGINX는 외부 HTTP 요청을 받는 reverse proxy다. 호스트의 80번 포트는 NGINX 컨테이너에만 매핑되고, Next.js와 Django는 내부 서비스 이름으로만 접근된다.

**English**

NGINX is the reverse proxy that receives external HTTP requests. Host port 80 is mapped only to the NGINX container, while Next.js and Django are reached by internal service names.

## 라우팅 / Routing

**한국어**

`default.conf`는 `/` 요청을 `frontend:3000`으로 보내고, `/api/`와 `/admin/` 요청을 `django:8000`으로 보낸다.

**English**

`default.conf` routes `/` to `frontend:3000`, and routes `/api/` plus `/admin/` to `django:8000`.

```text
/        -> frontend:3000
/api/    -> django:8000
/admin/  -> django:8000
```

## 연결 방식 / How It Is Mounted

**한국어**

Docker Compose는 `infra/nginx/default.conf`를 NGINX 컨테이너의 `/etc/nginx/conf.d/default.conf`에 읽기 전용으로 마운트한다.

**English**

Docker Compose mounts `infra/nginx/default.conf` into the NGINX container at `/etc/nginx/conf.d/default.conf` as read-only.
