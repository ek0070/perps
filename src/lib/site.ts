const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (railway ? `https://${railway}` : "http://localhost:3000")
).replace(/\/+$/, "");

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Tweet Terminal";

const handle = process.env.NEXT_PUBLIC_X_HANDLE?.trim() || "@tweetterminal";
export const X_HANDLE = handle.startsWith("@") ? handle : `@${handle}`;
export const X_URL = `https://x.com/${X_HANDLE.slice(1)}`;

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() || "";

export const PLAYER_SIZE = 480;
