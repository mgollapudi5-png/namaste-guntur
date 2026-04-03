import type { Metadata } from "next";
import CustomerClient from "./CustomerClient";

export const metadata: Metadata = {
  title: "Orders | Namaste Guntur",
};

export default function CustomerPage() {
  return <CustomerClient />;
}
