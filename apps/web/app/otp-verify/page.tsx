"use client";
import { MdOutlineLockPerson, MdOutlineTimer } from "react-icons/md";
import React, { useRef, useState } from "react";

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
            <div className="flex flex-col items-center gap-base">
              <span className="font-section-tag text-section-tag text-text-muted uppercase">
                CODE EXPIRES IN
              </span>
              <div className="font-timer text-timer text-verdict-tle flex items-center gap-xs">
                <MdOutlineTimer size={24} />
                04:59
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-md pt-xs border-t-[0.5px] border-border-subtle mt-xs">
            <button className="w-full h-[48px] bg-primary text-bg-void font-ui-label text-ui-label uppercase flex items-center justify-center hover:bg-primary-fixed transition-colors active:scale-[0.98] duration-75">
              AUTHENTICATE
            </button>
            <button className="w-full h-[40px] bg-transparent border-[0.5px] border-border-default text-text-muted font-ui-label text-ui-label uppercase flex items-center justify-center cursor-not-allowed opacity-50 hover:bg-bg-elevated/50 transition-colors">
              RESEND CODE
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
