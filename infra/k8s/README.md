# Kubernetes

## 구성 / Structure

**한국어**

Kubernetes 설정은 공통 리소스인 `base`와 로컬 검증용 `overlays/minikube`로만 구성한다. 별도 예시 디렉터리는 사용하지 않는다.

**English**

Kubernetes configuration is organized only into the shared `base` resources and the local validation overlay at `overlays/minikube`. A separate samples directory is not used.

```text
infra/k8s/base/
infra/k8s/overlays/minikube/
```

## 서비스 / Services

**한국어**

`base`는 `frontend`, `django`, `nginx` 리소스를 포함한다. PostgreSQL workload는 포함하지 않으며, Django는 외부 PostgreSQL 접속 정보를 Kubernetes Secret으로 받아야 한다.

**English**

`base` includes `frontend`, `django`, and `nginx` resources. PostgreSQL is not included as a workload, and Django should receive external PostgreSQL connection settings through a Kubernetes Secret.

## 적용 / Apply

**한국어**

Minikube에서는 overlay를 적용한다. 적용 전에 `app-secret` Secret과 필요한 이미지를 준비해야 한다. `app-secret`에는 Django 설정과 외부 PostgreSQL 접속 정보가 들어간다.

**English**

Apply the Minikube overlay. Prepare the `app-secret` Secret and the required images before applying it. `app-secret` contains Django settings and external PostgreSQL connection settings.

```text
DJANGO_SECRET_KEY
DJANGO_DEBUG
DJANGO_ALLOWED_HOSTS
DJANGO_CSRF_TRUSTED_ORIGINS
DB_ENGINE
DB_NAME
DB_USER
DB_PASSWORD
DB_HOST
DB_PORT
```

```powershell
kubectl apply -k infra/k8s/overlays/minikube
```
