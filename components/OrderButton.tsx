"use client";

import { useEffect, useState } from "react";

interface OrderButtonProps {
  number: number;
  expiresAt: Date | null;
  onTap: (n: number) => void;
}

export default function OrderButton({ number, expiresAt, onTap }: OrderButtonProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      return;
    }

    const update = () => {
      const remaining = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    };

    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isActive = expiresAt !== null && secondsLeft > 0;
  const progress = isActive ? secondsLeft / 30 : 0;

  // SVG arc countdown ring
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <button
      onClick={() => onTap(number)}
      className={`
        relative flex items-center justify-center rounded-xl font-bold text-white
        transition-all duration-200 active:scale-95 select-none
        w-full aspect-square text-lg
        ${isActive
          ? "bg-amber-500 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300"
          : "bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-900/30"
        }
      `}
    >
      {isActive ? (
        <>
          {/* SVG countdown ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 64 64"
          >
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s linear" }}
            />
          </svg>
          <span className="relative z-10 flex flex-col items-center leading-tight">
            <span className="text-xs font-medium opacity-80">#{number}</span>
            <span className="text-xl font-black">{secondsLeft}s</span>
          </span>
        </>
      ) : (
        <span>{number}</span>
      )}
    </button>
  );
}
