"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/types/order";
import OrderCard from "@/components/OrderCard";

function playChime() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.4, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  } catch {
    // AudioContext not available — silent fail
  }
}

function sendBrowserNotification(orderNumber: number) {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;
  new Notification("🍛 Namaste Guntur", {
    body: `Order #${orderNumber} is ready! Please collect from the counter.`,
    tag: `order-${orderNumber}`,
  });
}

export default function CustomerClient() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  // Register service worker + check notification permission
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotifPermission = async () => {
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  const dismissOrder = useCallback((orderNumber: number) => {
    setActiveOrders((prev) => prev.filter((o) => o.orderNumber !== orderNumber));
  }, []);

  useEffect(() => {
    // Query only non-expired orders (handles stale docs if staff browser closed)
    const q = query(
      collection(db, "orders"),
      where("expiresAt", ">", Timestamp.now())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data() as Order;

        if (change.type === "added") {
          // Guard: skip if already expired (edge case on slow connections)
          if (data.expiresAt.toDate() <= new Date()) return;

          setActiveOrders((prev) => {
            // Prevent duplicates if snapshot fires twice
            if (prev.some((o) => o.orderNumber === data.orderNumber)) {
              return prev;
            }
            return [...prev, data];
          });

          // Send browser notification + chime sound
          playChime();
          sendBrowserNotification(data.orderNumber);

          // Customer page also cleans up after 30s (staff backup)
          const msLeft = data.expiresAt.toDate().getTime() - Date.now();
          setTimeout(async () => {
            try {
              await deleteDoc(doc(db, "orders", String(data.orderNumber)));
            } catch {
              // already deleted — fine
            }
          }, Math.max(0, msLeft));
        }

        if (change.type === "modified") {
          playChime();
          // Staff re-tapped the button — update the order with fresh expiry
          setActiveOrders((prev) =>
            prev.map((o) =>
              o.orderNumber === data.orderNumber ? data : o
            )
          );
          sendBrowserNotification(data.orderNumber);
        }

        if (change.type === "removed") {
          setActiveOrders((prev) =>
            prev.filter((o) => o.orderNumber !== data.orderNumber)
          );
        }
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 py-6 px-6 text-center border-b border-gray-800/50">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          🍛 Namaste Guntur
        </h1>
        <p className="text-gray-500 text-sm mt-1">Order pickup notifications</p>
      </div>

      {/* Notification permission banner */}
      {notifPermission === "default" && (
        <div className="bg-emerald-900/40 border-b border-emerald-700/40 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-emerald-300 text-sm">
            Enable notifications to get alerts even when Chrome is in the background
          </p>
          <button
            onClick={requestNotifPermission}
            className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Enable
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {activeOrders.length === 0 ? (
          /* Idle state */
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-30">🔔</div>
            <p className="text-gray-600 text-lg font-medium">
              Waiting for orders...
            </p>
            <p className="text-gray-700 text-sm mt-1">
              Your order notification will appear here
            </p>
          </div>
        ) : (
          /* Active order cards */
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {activeOrders.map((order) => (
              <OrderCard
                key={order.orderNumber}
                order={order}
                onDismiss={dismissOrder}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 py-4 text-center">
        <p className="text-gray-800 text-xs">
          Please collect your order from the counter
        </p>
      </div>
    </div>
  );
}
