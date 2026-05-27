"use client";
import { MdOutlineLockPerson } from "react-icons/md";
import React, { useRef, useState } from "react";
import { authApi } from "@repo/api/src/client";
import { useRouter, useSearchParams } from "next/navigation";
import TimerButton from "../../component/Timer";

export default function OtpVerify() {
  const length = 6;
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < length - 1) {
      inputRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    const newOtp = [...otp];

    pasteData.split("").forEach((char, index) => {
      newOtp[index] = char;
    });

    setOtp(newOtp);

    const focusIndex = Math.min(pasteData.length, length - 1);
    inputRef.current[focusIndex]?.focus();
  };
  const searchParam = useSearchParams();
  const email = searchParam.get("email");
  const purpose = searchParam.get("purpose");

  const resendCode = async () => {
    console.log(otp);
    try {
      const response = await authApi.post("auth/resend-otp", {
        email,
        purpose,
      });
      console.log(response);
      setReset((d) => d + 1);
    } catch (e) {
      console.error(e.response.data);
    }
  };

  const [reset, setReset] = useState(0);

  const router = useRouter();
  const handleSubmit = async () => {
    try {
      console.log(otp.join(""));
      const otpString = otp.join("");
      const response = await authApi.post("/auth/verify-otp", {
        otp: otpString,
        email,
        purpose,
      });
      console.log(response);
      router.push("/dashboard");
    } catch (e) {
      console.log(e.response.data);
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
            <MdOutlineLockPerson size={32} className="text-primary" />
            <div>
              <h1 className="font-display text-h1 text-on-surface uppercase tracking-tighter">
                Verify
              </h1>
              <h1 className="font-display text-h1 text-on-surface uppercase tracking-tighter">
                operator
              </h1>
            </div>
            <span className="font-body text-body text-text-secondary ">
              Enter the 6-digit synchronization code sent to your email.
            </span>
          </div>

          <div className="flex flex-col gap-lg">
            <div
              className="flex gap-sm justify-between w-full"
              id="otp-container"
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRef.current[idx] = el;
                  }}
                  className="w-[56px] h-[64px] bg-bg-elevated border-[0.5px] border-border-default text-center font-timer text-timer text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all rounded-none"
                  type="text"
                  value={digit}
                  inputMode="numeric"
                  onPaste={handlePaste}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  maxLength={1}
                />
              ))}
            </div>
            <div className="flex flex-col items-center pt-sm">
              <span className="font-section-tag text-body uppercase text-verdict-tle tracking-widest">
                CODE WILL EXPIRE IN 10 MINUTES
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-md pt-xs border-t-[0.5px] border-border-subtle mt-xs">
            <button
              onClick={handleSubmit}
              className="w-full h-[48px] bg-primary text-bg-void font-ui-label text-ui-label uppercase flex items-center justify-center hover:bg-primary-fixed transition-colors active:scale-[0.98] duration-75"
            >
              AUTHENTICATE
            </button>
            <TimerButton resendCode={resendCode} resetTrigger={reset} />
          </div>
        </div>
      </main>
    </div>
  );
}
