"use client";

import { AuthProvider } from "react-oidc-context";
import { ReactNode } from "react";

// 1. DYNAMIC REDIRECT LOGIC
// This detects if the app is on localhost or Vercel
const redirectUri = typeof window !== "undefined" 
  ? window.location.origin 
  : "http://localhost:3000";

const oidcConfig = {
  authority: process.env.NEXT_PUBLIC_AUTHORITY,
  client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
  redirect_uri: redirectUri, // CHANGED THIS to the dynamic variable
  response_type: "code",
  scope: "openid profile email",
  // This ensures the user is sent back to the right place after logging out
  post_logout_redirect_uri: redirectUri, 
};

export function OmniAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider {...oidcConfig}>
      {children}
    </AuthProvider>
  );
}