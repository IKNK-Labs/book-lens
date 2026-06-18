import { createClient } from "./supabase/server";
import { hasSupabaseConfig } from "./supabase/env";

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

function isMockPreviewAllowed() {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_MOCK_AUTH_PREVIEW === "true";
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getGuestViewer(): Viewer {
  return guestViewer;
}

async function getSupabaseUserViewerIfAvailable(): Promise<Viewer | null> {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
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

export async function getViewer(searchParams?: AuthSearchParams): Promise<Viewer> {
  const supabaseUserViewer = await getSupabaseUserViewerIfAvailable();

  if (supabaseUserViewer) {
    return supabaseUserViewer;
  }

  if (isMockPreviewAllowed() && searchParams?.auth === "member") {
    return mockMemberViewer;
  }

  return guestViewer;
}

export function withAuthMember(path: string) {
  return `${path}${path.includes("?") ? "&" : "?"}auth=member`;
}
