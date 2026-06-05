# Kubernetes manifests

Structure:

```text
infra/k8s/base/
  Common Kubernetes resources.

infra/k8s/overlays/minikube/
  Minikube-specific overlay. Apply this, not the base directly.
```

Apply:

```bash
kubectl apply -k infra/k8s/overlays/minikube
```

The base uses `infra/nginx/default.conf` through Kustomize `configMapGenerator`.
