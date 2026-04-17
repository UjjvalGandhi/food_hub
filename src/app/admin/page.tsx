"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, ChefHat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DashboardSmartSuggestions } from "@/components/dashboard/DashboardSmartSuggestions";

interface AdminStats {
  active: number;
  pending: number;
  preparing: number;
}

interface AdminNewOrderEvent {
  orderId: string;
}

export default function AdminDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { socket, isConnected } = useSocket();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const processedOrdersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (user && String(user.role) === "ADMIN") {
      fetch("/api/admin/orders/stats")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStats(data.data);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleAdminNewOrder = (payload: AdminNewOrderEvent) => {
      // Prevent duplicate socket events
      if (processedOrdersRef.current.has(payload.orderId)) return;
      processedOrdersRef.current.add(payload.orderId);

      // A new order is created, inherently it starts as PENDING and ACTIVE
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          active: prev.active + 1,
          pending: prev.pending + 1,
        };
      });
    };

    const handleAdminOrderUpdate = () => {
      // Re-fetch stats slightly debounced to ensure data consistency,
      // or optimistically alter based on known transitions. For an admin dashboard counting 
      // aggregates, an optimistic + full refetch yields perfect correctness over time while feeling instant.
      
      // Let's just refetch fully on any update so we don't have to keep a complex state 
      // machine for what went from pending -> cancelled, preparing -> delivered, etc. 
      // But Since requirements specifically ask for "instant without refresh", let's optimistically hit the API quietly.
      fetch("/api/admin/orders/stats")
         .then((res) => res.json())
         .then((data) => {
            if (data.success) {
               setStats(data.data);
            }
         });
    };

    socket.on("admin_new_order", handleAdminNewOrder);
    socket.on("admin_order_update", handleAdminOrderUpdate);

    return () => {
      socket.off("admin_new_order", handleAdminNewOrder);
      socket.off("admin_order_update", handleAdminOrderUpdate);
    };
  }, [socket, isConnected]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time overview of current marketplace operations.</p>
        </div>
        {isConnected ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 hidden sm:flex">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
             </span>
             Live Connection
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1.5 hidden sm:flex">
             Offline
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Active Orders Count */}
        <Card className="shadow-sm border-blue-100 bg-blue-50/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Active Orders</CardTitle>
            <Activity className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-700">{stats?.active || 0}</div>
            <p className="text-xs text-blue-600/80 mt-1">Currently in-progress across all venues</p>
          </CardContent>
        </Card>

        {/* Pending Orders Count */}
        <Card className="shadow-sm border-amber-100 bg-amber-50/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Awaiting Acceptance</CardTitle>
            <Clock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-700">{stats?.pending || 0}</div>
            <p className="text-xs text-amber-600/80 mt-1">Orders requiring action by providers</p>
          </CardContent>
        </Card>

        {/* Preparing Orders Count */}
        <Card className="shadow-sm border-purple-100 bg-purple-50/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Now Preparing</CardTitle>
            <ChefHat className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-700">{stats?.preparing || 0}</div>
            <p className="text-xs text-purple-600/80 mt-1">Meals being actively cooked</p>
          </CardContent>
        </Card>
      </div>

      <DashboardSmartSuggestions />
    </div>
  );
}
