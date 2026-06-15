export type ViewerMode = "guest" | "member";

export type Viewer = {
  mode: ViewerMode;
  isMember: boolean;
  name: string;
  displayName: string;
  email: string;
  provider: string;
};

type AuthSearchParams = {
  auth?: string;
};

export function getViewer(searchParams?: AuthSearchParams): Viewer {
  const isMember = searchParams?.auth === "member";

  return {
    mode: isMember ? "member" : "guest",
    isMember,
    name: isMember ? "제석" : "손님",
    displayName: isMember ? "제석님" : "손님",
    email: isMember ? "jeseok@example.com" : "",
    provider: isMember ? "Google" : "",
  };
}

export function withAuthMember(path: string) {
  return `${path}${path.includes("?") ? "&" : "?"}auth=member`;
}
