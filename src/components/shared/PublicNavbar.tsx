"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Menu, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { SocketIndicator } from "./SocketIndicator";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { UserRole } from "@/constants/roles";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "AI Discovery", href: "/recommendations" },
  { name: "Restaurants", href: "/restaurants" },
  { name: "How It Works", href: "/#how-it-works" },
];

export function PublicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cart, setDrawerOpen } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role as unknown as string) {
      case UserRole.PROVIDER:
        return "/provider";
      case UserRole.ADMIN:
        return "/admin";
      case UserRole.DELIVERY_PARTNER:
        return "/delivery";
      default:
        return "/dashboard";
    }
  };

  const totalItems = cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-50 px-3 py-3 transition-all duration-300 sm:px-6",
        isScrolled ? "" : ""
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        boxShadow: isScrolled ? "0 1px 2px 0 rgb(0 0 0 / 0.05)" : "none",
      }}
    >
      <div
        className={cn(
          "mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full border px-4 shadow-lg shadow-black/5 backdrop-blur-xl transition-all sm:px-6 lg:px-8",
          isScrolled
            ? "border-border/70 bg-background/88"
            : "border-white/50 bg-background/72"
        )}
      >
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg shadow-sm ring-1 ring-primary/15">🍽️</span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">FoodPartner</p>
              <p className="text-xs text-muted-foreground">Fast delivery, elevated experience</p>
            </div>
          </Link>

          <nav className="hidden rounded-full border border-border/70 bg-muted/35 p-1 md:flex md:items-center md:gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  isLinkActive(link.href)
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {mounted && (
            <>
              <SocketIndicator />
              <Button
                variant="outline"
                className="relative rounded-full border-border/70 bg-background/70 px-4"
                onClick={() => setDrawerOpen(true)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Cart
                {totalItems > 0 && (
                  <span className="ml-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </Button>
            </>
          )}

          {mounted && user ? (
            <Button asChild className="rounded-full px-5 shadow-sm shadow-primary/20">
              <Link href={getDashboardLink()}>My Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="rounded-full">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="rounded-full px-5 shadow-sm shadow-primary/20">
                <Link href="/restaurants">
                  Explore Food
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full border-border/70 bg-background/70"
              onClick={() => setDrawerOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Open cart</span>
            </Button>
          )}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] border-l-border/70 bg-background/95 px-6 sm:w-[380px]">
              <SheetTitle className="mb-2 text-left text-xl font-bold">
                🍽️ FoodPartner
              </SheetTitle>
              <p className="mb-8 text-sm text-muted-foreground">
                Discover restaurants, place orders faster, and manage everything from one clean dashboard.
              </p>

              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-base font-medium transition-all",
                      isLinkActive(link.href)
                        ? "border-primary/20 bg-primary/5 text-foreground"
                        : "border-transparent bg-muted/35 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="mt-6 rounded-3xl border bg-muted/35 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold">Connection status</p>
                    <SocketIndicator />
                  </div>

                  {mounted && user ? (
                    <Button className="w-full rounded-2xl" asChild>
                      <Link href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}>
                        Go to Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full rounded-2xl" asChild>
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                          Log in
                        </Link>
                      </Button>
                      <Button className="w-full rounded-2xl" asChild>
                        <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                          Create account
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
