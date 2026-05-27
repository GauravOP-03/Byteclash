"use client";

import { useState } from "react";
import { FaGithub } from "react-icons/fa";

export default function GithubLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleGithubLogin = () => {
    setLoading(true);
    // Redirect to API gateway — it handles the GitHub OAuth redirect
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
  };

  return (
    <button
      onClick={handleGithubLogin}
      disabled={loading}
      className="opacity-40 hover:opacity-100 transition ease-in disabled:cursor-not-allowed"
      aria-label="Sign in with GitHub"
      title="Sign in with GitHub"
    >
      <FaGithub size={18} className={loading ? "animate-pulse" : ""} />
    </button>
  );
}
