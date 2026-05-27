"use client";
import React, { useEffect } from "react";
import { authApi } from "@repo/api/src/client";
import { useRouter } from "next/navigation";
import { useUserStore } from "../state/useUserStore";

const Page = () => {
  const userData = useUserStore((state) => state.userData);
  const isloading = useUserStore((state) => state.isLoading);
  const clearUser = useUserStore((state) => state.clearUser);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const router = useRouter();
  const handleLogout = async () => {
    try {
      await authApi.post("/auth/logout");
      router.push("/login");
    } catch (e) {
      console.error(e.response.data);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="bg-bg-void font-display text-display h-screen w-screen text-primary">
      {" "}
      Welcome to dashboard
      <button onClick={handleLogout} className="ui-btn-outline">
        Logout
      </button>
      {isloading ? (
        <div>loading</div>
      ) : (
        userData && userData.name && <div>{userData.name}</div>
      )}
    </div>
  );
};

export default Page;
