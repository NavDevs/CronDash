export interface SessionData {
  userId: string;
  email: string;
}

export function getSessionFromCookie(cookieValue: string): SessionData | null {
  try {
    return JSON.parse(Buffer.from(cookieValue, "base64").toString()) as SessionData;
  } catch {
    return null;
  }
}
