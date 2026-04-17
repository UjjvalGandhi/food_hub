"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/constants/roles";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Store,
  CheckSquare,
  LogOut,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  role: UserRole;
  userName: string;
  heading: string;
  description: string;
  icon: string;
  children?: React.ReactNode;
}

const roleBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CUSTOMER: "default",
  PROVIDER: "secondary",
  ADMIN: "destructive",
  DELIVERY_PARTNER: "outline",
};

export function DashboardLayout({
  role,
  userName,
  heading,
  description,
  icon,
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  let sidebarLinks: { name: string; href: string; icon: LucideIcon }[] = [];

  if (role === UserRole.CUSTOMER) {
    sidebarLinks = [
      { name: "My Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Order Food", href: "/restaurants", icon: UtensilsCrossed },
      { name: "Checkout", href: "/checkout", icon: ShoppingBag },
    ];
  } else if (role === UserRole.PROVIDER) {
    sidebarLinks = [
      { name: "Dashboard", href: "/provider", icon: LayoutDashboard },
      { name: "Live Orders", href: "/provider/orders", icon: ShoppingBag },
      { name: "Menu Items", href: "/provider/menu", icon: UtensilsCrossed },
      { name: "Restaurant Profile", href: "/provider/restaurant", icon: Store },
    ];
  } else if (role === UserRole.ADMIN) {
    sidebarLinks = [
      { name: "Overview", href: "/admin", icon: LayoutDashboard },
      { name: "Partner Approvals", href: "/admin/approvals", icon: CheckSquare },
    ];
  }

  const sidebarContent = (
    <div className="flex h-full flex-col border-r bg-background/90 backdrop-blur-xl">
      <div className="border-b p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-lg ring-1 ring-primary/15">🍽️</span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">FoodPartner</p>
            <p className="text-sm text-muted-foreground">Professional ordering workspace</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Navigation</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {sidebarLinks.map((link) => {
          const isActive =
            link.href.split("/").length > 2
              ? pathname.startsWith(link.href)
              : pathname === link.href;

          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 rounded-2xl px-3 py-3 transition-all font-medium text-sm ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t bg-muted/20 p-4">
        <div className="mb-4 rounded-2xl border bg-background/80 px-3 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate capitalize">
                {userName}
              </p>
              <Badge variant={roleBadgeVariant[role]} className="text-[10px] mt-0.5 pointer-events-none">
                {role}
              </Badge>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/10">
      <aside className="sticky top-0 z-10 hidden h-screen w-72 flex-shrink-0 shadow-sm md:block">
        {sidebarContent}
      </aside>

      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-background/92 px-4 shadow-sm backdrop-blur md:hidden">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🍽️</span>
          <span className="font-bold text-primary">FoodPartner</span>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <main className="flex-1 w-full max-w-full overflow-x-hidden pt-16 md:pt-0">
        <div className="mx-auto flex h-full max-w-6xl flex-col gap-6 p-4 md:p-8 lg:p-10 xl:p-12">
          <div className="rounded-[2rem] border bg-background/85 p-6 shadow-sm backdrop-blur-sm sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary/10 text-4xl">{icon}</span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
              </div>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
