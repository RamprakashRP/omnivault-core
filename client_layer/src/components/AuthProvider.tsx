"use client";

import { AuthProvider } from "react-oidc-context";
import { ReactNode } from "react";

// FORCE the production URL to match AWS Cognito settings
// This prevents the "preview" URLs from breaking the login flow
const getRedirectUri = () => {
  if (typeof window !== "undefined") {
    // If we are on localhost, use localhost
    if (window.location.hostname === "localhost") {
      return "http://localhost:3000";
    }
    // For EVERYTHING else (even preview links), use the main production URL
    // Make sure this matches exactly what you typed in the AWS Console
    return "https://omnivault-core.vercel.app";
  }
  return "http://localhost:3000";
};

const oidcConfig = {
  authority: process.env.NEXT_PUBLIC_AUTHORITY,
  client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
  redirect_uri: getRedirectUri(),
  response_type: "code",
  scope: "openid profile email",
  post_logout_redirect_uri: getRedirectUri(),
  onSigninCallback: () => {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  },
};

export function OmniAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider {...oidcConfig}>
      {children}
    </AuthProvider>
  );
}