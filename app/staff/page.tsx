import type { Metadata } from "next";
import StaffClient from "./StaffClient";

export const metadata: Metadata = {
  title: "Staff | Namaste Guntur",
};

export default function StaffPage() {
  return <StaffClient />;
}
