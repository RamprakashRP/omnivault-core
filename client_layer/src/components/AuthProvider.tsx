"use client";

import React from "react";
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  // The authority must match your specific User Pool ID and Region
  authority: "https://cognito-idp.ap-south-2.amazonaws.com/ap-south-2_jT2vf3JGW", 
  client_id: "opc42vf6gdku98240aoqoa9c5",
  redirect_uri: "http://localhost:3000",
  // "code" is the modern standard for Authorization Code Flow
  response_type: "code", 
  scope: "openid email profile",
};

export function OmniAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider {...cognitoAuthConfig}>{children}</AuthProvider>;
}