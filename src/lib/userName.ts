import { getStorageItem, setStorageItem, STORAGE_KEYS } from "./storage";

export const USER_NAME_CHANGED_EVENT = "drg:user-name-changed";

const COOKIE_NAME = "drg_user_name";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function readCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`),
  );
  if (!match) {
    return "";
  }
  try {
    return decodeURIComponent(match[1]).trim();
  } catch {
    return "";
  }
}

function writeCookie(name: string): void {
  if (typeof document === "undefined") {
    return;
  }
  const value = encodeURIComponent(name);
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function readStoredName(): string {
  const fromStorage = getStorageItem<{ name?: string }>(
    STORAGE_KEYS.userProfile,
    {},
  ).name;
  if (typeof fromStorage === "string" && fromStorage.trim()) {
    return fromStorage.trim();
  }
  return readCookie();
}

export function getUserName(): string {
  return readStoredName();
}

export function hasUserName(): boolean {
  return getUserName().length > 0;
}

export function setUserName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) {
    return false;
  }
  const ok = setStorageItem(STORAGE_KEYS.userProfile, { name: trimmed });
  writeCookie(trimmed);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(USER_NAME_CHANGED_EVENT, { detail: trimmed }),
    );
  }
  return ok;
}
