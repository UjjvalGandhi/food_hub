"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Store,
  MenuSquare,
  UtensilsCrossed,
  LogOut,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SocketIndicator } from "@/components/shared/SocketIndicator";

const sidebarLinks = [
  { name: "Dashboard", href: "/provider", icon: LayoutDashboard },
  { name: "Restaurant Profile", href: "/provider/restaurant", icon: Store },
  { name: "Categories", href: "/provider/categories", icon: MenuSquare },
  { name: "Menu Items", href: "/provider/menu", icon: UtensilsCrossed },
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Use window.location instead of router to force a hard reload and clear all cache
    window.location.href = "/login";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
      <div className="p-6 flex items-center justify-center space-x-2">
        <span className="text-2xl">🍳</span>
        <span className="text-xl font-bold tracking-tight">FoodPartner</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 px-3 py-2.5 transition-colors rounded-lg font-medium ${
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-3 mb-4 px-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden flex-shrink-0">
            {user?.name?.charAt(0) || "P"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
              {user?.name || "Provider"}
            </p>
            <p className="text-xs text-zinc-500 truncate">Provider Account</p>
          </div>
        </div>
        <div className="px-3 mb-4">
          <SocketIndicator />
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-zinc-600 group"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2 group-hover:text-red-500 transition-colors" />
          <span className="group-hover:text-red-500 transition-colors">
            Logout
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 flex-shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🍳</span>
          <span className="font-bold">FoodPartner</span>
        </div>
        <div className="flex items-center gap-2">
          <SocketIndicator />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden pt-16 md:pt-0">
        <div className="p-4 md:p-8 xl:p-12 h-full max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
