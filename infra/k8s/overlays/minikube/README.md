# Minikube overlay

This overlay runs the starter stack on Minikube:

- NGINX Service exposed by NodePort `30080`
- Next.js frontend image: `book-lens-frontend:local`
- NGINX config generated from `infra/nginx/default.conf`

## Commands

```bash
minikube start

eval $(minikube docker-env)
docker build -t book-lens-frontend:local ./frontend

kubectl apply -k infra/k8s/overlays/minikube
kubectl get all -n book-lens
minikube service nginx -n book-lens --url
```

Windows PowerShell:

```powershell
minikube start
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
docker build -t book-lens-frontend:local ./frontend
kubectl apply -k infra/k8s/overlays/minikube
kubectl get all -n book-lens
minikube service nginx -n book-lens --url
```

Delete:

```bash
kubectl delete -k infra/k8s/overlays/minikube
```
