"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/types/order";

interface OrderCardProps {
  order: Order;
  onDismiss: (orderNumber: number) => void;
}

export default function OrderCard({ order, onDismiss }: OrderCardProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const expiresAt = order.expiresAt.toDate();

    const update = () => {
      const remaining = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    };

    update();
    const interval = setInterval(update, 500);

    // Start fade-out animation 400ms before dismiss
    const totalMs = expiresAt.getTime() - Date.now();
    const leaveTimer = setTimeout(() => setLeaving(true), Math.max(0, totalMs - 400));
    const dismissTimer = setTimeout(() => onDismiss(order.orderNumber), Math.max(0, totalMs));

    return () => {
      clearInterval(interval);
      clearTimeout(leaveTimer);
      clearTimeout(dismissTimer);
    };
  }, [order, onDismiss]);

  const progress = secondsLeft / 30;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-emerald-500 to-emerald-700
        shadow-2xl shadow-emerald-900/50
        border border-emerald-400/30
        p-6 min-w-[260px] max-w-[320px]
        ${leaving ? "animate-fade-out" : "animate-slide-up"}
      `}
    >
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 rounded-t-2xl overflow-hidden">
        <div
          className="h-full bg-white/70 transition-all duration-500 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Order number badge */}
        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <span className="text-3xl font-black text-white">#{order.orderNumber}</span>
        </div>

        {/* Text */}
        <div>
          <p className="text-white/70 text-sm font-medium uppercase tracking-wider">
            Order Ready!
          </p>
          <p className="text-white text-xl font-bold leading-tight">
            Order #{order.orderNumber}
          </p>
          <p className="text-white/60 text-xs mt-0.5">
            Please collect your order
          </p>
        </div>
      </div>

      {/* Countdown */}
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
        <span className="text-white/60 text-xs">
          Disappears in {secondsLeft}s
        </span>
      </div>
    </div>
  );
}
