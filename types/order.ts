import type { Timestamp } from "firebase/firestore";

export interface Order {
  orderNumber: number;
  readyAt: Timestamp;
  expiresAt: Timestamp;
  status: "ready";
}
