import { createClient } from "./supabase/server";

export type ViewerMode = "guest" | "member";

export type Viewer = {
  mode: ViewerMode;
  isMember: boolean;
  name: string;
  displayName: string;
  email: string;
  provider: string;
  isPreview: boolean;
};

type AuthSearchParams = {
  auth?: string;
};

const guestViewer: Viewer = {
  mode: "guest",
  isMember: false,
  name: "손님",
  displayName: "손님",
  email: "",
  provider: "",
  isPreview: false,
};

const mockMemberViewer: Viewer = {
  mode: "member",
  isMember: true,
  name: "제석",
  displayName: "제석님",
  email: "jeseok@example.com",
  provider: "Google",
  isPreview: true,
};

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getGuestViewer(): Viewer {
  return guestViewer;
}

export async function getViewer(searchParams?: AuthSearchParams): Promise<Viewer> {
  if (searchParams?.auth === "member") {
    return mockMemberViewer;
  }

  if (!hasSupabaseEnv()) {
    return guestViewer;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return guestViewer;
  }

  const metadata = data.user.user_metadata ?? {};
  const appMetadata = data.user.app_metadata ?? {};
  const metadataName = readString(metadata.nickname) || readString(metadata.name) || readString(metadata.full_name);
  const emailName = data.user.email?.split("@")[0] ?? "제석";
  const name = metadataName || emailName || "제석";
  const provider = readString(appMetadata.provider) || "Google";

  return {
    mode: "member",
    isMember: true,
    name,
    displayName: name.endsWith("님") ? name : `${name}님`,
    email: data.user.email ?? "",
    provider,
    isPreview: false,
  };
}

export function withAuthMember(path: string) {
  return `${path}${path.includes("?") ? "&" : "?"}auth=member`;
}
