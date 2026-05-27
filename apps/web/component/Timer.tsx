import { useEffect, useState } from "react";

interface timerButtonProps {
  resendCode: () => void;
  resetTrigger: number;
}
export default function TimerButton({
  resendCode,
  resetTrigger,
}: timerButtonProps) {
  const FIVE_MINUTES = 5 * 60;

  const [timeLeft, setTimeLeft] = useState(FIVE_MINUTES);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    setTimeLeft(FIVE_MINUTES);
  }, [FIVE_MINUTES, resetTrigger]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <button
      onClick={resendCode}
      className="w-full h-[38px] bg-transparent border-[0.5px] border-border-default text-text-secondary font-ui-label text-ui-label uppercase hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-xs active:scale-[0.98]
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:border-border-default
    disabled:hover:text-text-secondary
    disabled:active:scale-100 "
      disabled={timeLeft > 0}
    >
      {timeLeft > 0 ? `RESEND IN ${formatTime(timeLeft)}` : "RESEND CODE"}
    </button>
  );
}
