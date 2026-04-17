"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Store,
  LogOut,
  Menu,
  Bike,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SocketIndicator } from "@/components/shared/SocketIndicator";

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Restaurants", href: "/admin/restaurants", icon: Store },
  { name: "Delivery Partners", href: "/admin/delivery-partners", icon: Bike },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-50">
      <div className="p-6 flex items-center justify-center space-x-2">
        <span className="text-2xl">🛡️</span>
        <span className="text-xl font-bold tracking-tight">Admin Portal</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {sidebarLinks.map((link) => {
          const isActive = 
               link.href === "/admin" 
                 ? pathname === "/admin" 
                 : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 px-3 py-2.5 transition-colors rounded-lg font-medium ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 mb-4 px-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold overflow-hidden flex-shrink-0">
            {user?.name?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-50 truncate">
              {user?.name || "Administrator"}
            </p>
            <p className="text-xs text-slate-400 truncate">System Admin</p>
          </div>
        </div>
        <div className="px-3 mb-4">
          <SocketIndicator />
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white group"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2 group-hover:text-red-400 transition-colors" />
          <span className="group-hover:text-red-400 transition-colors">
            Logout
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 flex-shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-slate-50 border-b border-slate-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🛡️</span>
          <span className="font-bold">Admin Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <SocketIndicator />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-50">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800">
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
