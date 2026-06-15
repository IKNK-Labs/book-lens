export function getSafeNext(value: string | null | undefined, fallback = "/settings") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function appendLoginNext(path: string, next: string) {
  const params = new URLSearchParams({ next });
  return `${path}?${params.toString()}`;
}

export function getLoginRedirect(message: string, next: string) {
  const params = new URLSearchParams({ message, next });
  return `/login?${params.toString()}`;
}
