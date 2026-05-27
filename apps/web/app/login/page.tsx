"use client";
import { Label } from "@repo/ui/label";
import Link from "next/link";
import GithubLoginButton from "../../component/GithubButton";
import { useForm } from "react-hook-form";
import { loginSchema, loginSchemaType } from "@repo/validation-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi, setToken } from "@repo/api/src/client";
import { redirect, useRouter } from "next/navigation";
import GoogleLoginButton from "../../component/GoogleButton";

export default function Home() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<loginSchemaType>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const router = useRouter();

  const onValidSubmit = async (data: loginSchemaType) => {
    try {
      const { email, password } = data;
      const response = await authApi.post("/auth/login", { email, password });
      console.log(response.data.access_token);
      setToken(response.data.access_token);
      router.push("/dashboard");
    } catch (e: any) {
      if (e.response.data.statusCode == 403) {
        console.log(e.response.data);
        redirect(`/otp-verify?email=${data.email}&purpose=signup`);
      }
      console.error(e.response.data);
    }
  };

  return (
    <div className="bg-bg-void text-on-surface min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-body text-body selection:bg-primary/20 selection:text-primary">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0">
        <div className="w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-breathe"></div>
      </div>
      <main className="w-full max-w-[480px] px-md relative z-10">
        <div className="bg-bg-surface border-[0.5px] border-border-subtle p-xl flex flex-col gap-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
          <div className="flex flex-col items-center gap-xs text-center mb-xs">
            <h1 className="font-display text-display text-primary uppercase tracking-tighter">
              ByteClash
            </h1>
            <span className="font-section-tag text-section-tag text-text-muted uppercase tracking-widest">
              Awaiting Authorization
            </span>
          </div>
          <form
            onSubmit={handleSubmit(onValidSubmit)}
            className="flex flex-col gap-md"
          >
            <div className="flex flex-col gap-base">
              <Label htmlFor="identifier">Username or Email</Label>
              <input
                className="h-[38px] bg-bg-elevated border-[0.5px] border-border-default px-sm font-code text-code text-on-surface placeholder:text-text-ghost focus:border-[1px] focus:border-accent-blue-dim focus:ring-0 focus:outline-none transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                id="identifier"
                placeholder="Enter credentials"
                type="text"
                {...register("email")}
              />
              {errors.email && (
                <span className={"text-verdict-wa "}>
                  {errors.email.message}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-base">
              <div className="flex justify-between items-end">
                <label
                  className="font-ui-label text-ui-label text-text-secondary uppercase"
                  htmlFor="passcode"
                >
                  Password
                </label>
                <Link
                  className="font-section-tag text-section-tag text-text-muted hover:text-primary transition-colors uppercase"
                  href="#"
                >
                  Forgot Password
                </Link>
              </div>
              <input
                className="h-[38px] bg-bg-elevated border-[0.5px] border-border-default px-sm font-code text-code text-on-surface placeholder:text-text-ghost focus:border-[1px] focus:border-accent-blue-dim focus:ring-0 focus:outline-none transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                id="passcode"
                placeholder="••••••••"
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <span className={"text-verdict-wa "}>
                  {errors.password.message}
                </span>
              )}
            </div>
            <div className="pt-base">
              <button
                className="w-full h-[38px] bg-primary text-bg-void font-ui-label text-ui-label uppercase flex items-center justify-center gap-xs hover:bg-primary-fixed-dim transition-colors active:scale-[0.98]"
                type="submit"
              >
                Login to Arena
              </button>
            </div>
          </form>
          <div className="flex justify-center items-center font-ui-label text-ui-label text-text-ghost">
            Don&#39;t have account? &nbsp;
            <Link
              href={"/signup"}
              className={"text-primary-fixed-dim hover:underline"}
            >
              signup
            </Link>
          </div>

          <div className="flex items-center gap-md">
            <div className="h-[0.5px] flex-1 bg-border-default/50"></div>
            <span className="font-section-tag text-section-tag text-text-ghost">
              OR
            </span>
            <div className="h-[0.5px] flex-1 bg-border-default/50"></div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <GoogleLoginButton />
            <GithubLoginButton />
          </div>
        </div>
        <div className="mt-lg flex justify-center items-center gap-xs font-section-tag text-section-tag text-text-muted uppercase">
          <span className="w-[6px] h-[6px] rounded-full bg-verdict-ac animate-pulse shadow-[0_0_8px_rgba(104,211,145,0.6)]"></span>
          Terminal Secure Link V_1.0.0
        </div>
      </main>
    </div>
  );
}
