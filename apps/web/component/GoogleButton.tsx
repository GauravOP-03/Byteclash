"use client";

import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useRef, useState } from "react";
import { authApi, setToken } from "@repo/api/src/client";
import { useRouter } from "next/navigation";
import { FaGoogle } from "react-icons/fa";

export default function GoogleLoginButton() {
  const [error, setError] = useState("");
  const router = useRouter();

  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleSuccess = async (credentialResponse: any) => {
    console.log(credentialResponse);
    try {
      const response = await authApi.post("/auth/google-login", {
        token: credentialResponse.credential,
      });
      console.log(response);

      setToken(response.data.access_token);

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err?.response?.data);
      setError("Failed to authenticate with backend.");
    }
  };

  const triggerGoogleLogin = () => {
    const googleButton =
      googleButtonRef.current?.querySelector("div[role=button]");

    if (googleButton) {
      (googleButton as HTMLElement).click();
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <div>
        {/* Your Custom Button */}
        <button
          onClick={triggerGoogleLogin}
          className="opacity-40 hover:opacity-100 transition ease-in flex items-center gap-2"
          aria-label="Sign in with Google"
          title="Sign in with Google"
        >
          <FaGoogle size={18} />
        </button>

        {/* Hidden Real Google Button */}
        <div
          ref={googleButtonRef}
          className="absolute opacity-0 pointer-events-none"
        >
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError("Google Login Failed")}
          />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
