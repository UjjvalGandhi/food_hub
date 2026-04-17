import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "FoodPartner | Fast & Fresh Local Food Delivery",
    template: "%s | FoodPartner",
  },
  description: "Discover the best local restaurants, fast delivery, and crave-worthy meals. Join thousands of food lovers on FoodPartner.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://foodpartner.com",
    title: "FoodPartner | Fast & Fresh Local Food Delivery",
    description: "Discover the best local restaurants, fast delivery, and crave-worthy meals.",
    siteName: "FoodPartner",
    images: [
      {
        url: "/og-image.jpg", // placeholder for real og image
        width: 1200,
        height: 630,
        alt: "FoodPartner Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FoodPartner | Fast Local Delivery",
    description: "Discover the best local restaurants, fast delivery, and crave-worthy meals.",
    creator: "@FoodPartner",
  },
};

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
