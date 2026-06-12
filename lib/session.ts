export interface SessionData {
  userId: string;
  email: string;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET || "crondash-secret-key-must-be-32-chars",
  cookieName: "crondash-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};