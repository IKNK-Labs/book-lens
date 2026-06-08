# Minikube Overlay

## 목적 / Purpose

**한국어**

이 overlay는 Minikube에서 `book-lens`의 `nginx`, `frontend`, `django` 리소스를 로컬 이미지로 실행하기 위한 설정이다.

**English**

This overlay runs the `book-lens` `nginx`, `frontend`, and `django` resources on Minikube with local images.

## 실행 / Run

**한국어**

Minikube Docker 환경에서 frontend와 django 이미지를 빌드한 뒤 overlay를 적용한다. Django는 외부 PostgreSQL 접속 정보를 담은 `app-secret` Secret이 필요하다.

**English**

Build the frontend and django images inside the Minikube Docker environment, then apply the overlay. Django requires an `app-secret` Secret with external PostgreSQL connection settings.

```powershell
minikube start
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
docker build -t book-lens-frontend:local ./frontend
docker build -t book-lens-django:local ./backend
kubectl apply -k infra/k8s/overlays/minikube
kubectl get all -n book-lens
minikube service nginx -n book-lens --url
```

## 삭제 / Delete

**한국어**

Minikube 리소스는 overlay 기준으로 삭제한다.

**English**

Delete Minikube resources through the overlay.

```powershell
kubectl delete -k infra/k8s/overlays/minikube
```
