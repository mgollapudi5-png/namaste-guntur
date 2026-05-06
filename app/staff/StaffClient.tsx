"use client";

import { useState, useCallback, useRef } from "react";
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrderButton from "@/components/OrderButton";

const ORDER_DURATION_MS = 30_000;

export default function StaffClient() {
  // ── Auth gate ──────────────────────────────────────────────────────────────
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("staff_auth") === "true";
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (res.ok) {
        sessionStorage.setItem("staff_auth", "true");
        setAuthenticated(true);
      } else {
        setAuthError(true);
        setPasswordInput("");
      }
    } catch {
      setAuthError(true);
      setPasswordInput("");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Order state ────────────────────────────────────────────────────────────
  // Map<orderNumber, expiryDate>
  const [activeOrders, setActiveOrders] = useState<Map<number, Date>>(new Map());
  // Track cleanup timers so we can clear them on re-tap
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const handleOrderTap = useCallback(async (orderNumber: number) => {
    const expiresAt = new Date(Date.now() + ORDER_DURATION_MS);

    // Clear existing timers for this order (handles re-tap)
    const existingTimer = timersRef.current.get(orderNumber);
    if (existingTimer) clearTimeout(existingTimer);

    // Optimistic UI update
    setActiveOrders((prev) => {
      const next = new Map(prev);
      next.set(orderNumber, expiresAt);
      return next;
    });

    // Write to Firestore
    const orderRef = doc(db, "orders", String(orderNumber));
    await setDoc(orderRef, {
      orderNumber,
      readyAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      status: "ready",
    });

    // Schedule cleanup after 30s
    const timer = setTimeout(async () => {
      setActiveOrders((prev) => {
        const next = new Map(prev);
        next.delete(orderNumber);
        return next;
      });
      timersRef.current.delete(orderNumber);
      try {
        await deleteDoc(orderRef);
      } catch {
        // already deleted by customer page — that's fine
      }
    }, ORDER_DURATION_MS);

    timersRef.current.set(orderNumber, timer);
  }, []);

  // ── Render: password gate ──────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🍛</div>
            <h1 className="text-2xl font-black text-white">Namaste Guntur</h1>
            <p className="text-gray-400 text-sm mt-1">Staff Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Staff Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError(false);
                }}
                placeholder="Enter password"
                autoFocus
                className={`
                  w-full px-4 py-3 rounded-xl bg-gray-800 text-white
                  border transition-colors outline-none
                  placeholder:text-gray-500
                  ${authError
                    ? "border-red-500 focus:border-red-400"
                    : "border-gray-600 focus:border-emerald-500"
                  }
                `}
              />
              {authError && (
                <p className="text-red-400 text-sm mt-1.5">
                  Incorrect password. Try again.
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {authLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Render: order grid ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">
            🍛 Namaste Guntur
          </h1>
          <p className="text-gray-400 text-sm">
            Tap an order number when it&apos;s ready
          </p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem("staff_auth");
            setAuthenticated(false);
          }}
          className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Active order count */}
      {activeOrders.size > 0 && (
        <div className="max-w-2xl mx-auto mb-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 text-sm font-medium">
              {activeOrders.size} order{activeOrders.size !== 1 ? "s" : ""} currently ready
            </span>
          </div>
        </div>
      )}

      {/* 100-button grid */}
      <div className="max-w-2xl mx-auto grid grid-cols-5 sm:grid-cols-10 gap-2">
        {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
          <OrderButton
            key={n}
            number={n}
            expiresAt={activeOrders.get(n) ?? null}
            onTap={handleOrderTap}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="max-w-2xl mx-auto mt-6 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
          Ready to mark
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
          Counting down
        </span>
      </div>
    </div>
  );
}
