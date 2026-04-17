"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, CheckCircle2, RefreshCcw, Search, Store } from "lucide-react";
import type { ApiResponse } from "@/types";
import { getErrorMessage } from "@/lib/utils";

type Restaurant = {
  _id: string;
  name: string;
  city: string;
  state: string;
  isApproved: boolean;
  owner: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    isApproved?: boolean;
  };
  createdAt: string;
};

type SyncApprovalsData = {
  approvedRestaurants: number;
  providersSynced: number;
};

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">("all");

  // Approval Dialog State
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSyncingApprovals, setIsSyncingApprovals] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = filterStatus === "all" 
        ? "/api/admin/restaurants" 
        : `/api/admin/restaurants?status=${filterStatus}`;
        
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      
      const data = await response.json();
      setRestaurants(data.restaurants || []);
      setError("");
    } catch (error) {
      setError(getErrorMessage(error, "Failed to fetch restaurants"));
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleApprove = async () => {
    if (!selectedRestaurant) return;
    setIsApproving(true);
    try {
      const response = await fetch(`/api/admin/restaurant/${selectedRestaurant._id}/approve`, {
        method: "PATCH",
      });

      const data = await response.json() as ApiResponse<{
        restaurant: { _id: string; isApproved: boolean };
        owner: { _id: string; isApproved: boolean };
      }>;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to approve restaurant");
      }

      // Update local state
      setRestaurants(prev => 
        prev.map((r) =>
          r._id === selectedRestaurant._id
            ? {
                ...r,
                isApproved: true,
                owner: {
                  ...r.owner,
                  isApproved: true,
                },
              }
            : r
        )
      );

      toast.success(data.message);
      
      setIsApproveDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to approve restaurant"));
    } finally {
      setIsApproving(false);
      setSelectedRestaurant(null);
    }
  };

  const handleSyncLegacyApprovals = async () => {
    try {
      setIsSyncingApprovals(true);
      const response = await fetch("/api/admin/maintenance/provider-approvals", {
        method: "POST",
      });
      const data = await response.json() as ApiResponse<SyncApprovalsData>;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to sync approvals");
      }

      toast.success(
        `${data.data.providersSynced} provider account(s) synced across ${data.data.approvedRestaurants} approved restaurant(s).`
      );
      await fetchRestaurants();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to sync approvals"));
    } finally {
      setIsSyncingApprovals(false);
    }
  };

  // Client-side search filtering
  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.owner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Partners</h1>
          <p className="text-muted-foreground mt-1">
            Manage and approve provider restaurant applications.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleSyncLegacyApprovals}
          disabled={isSyncingApprovals}
        >
          {isSyncingApprovals ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Sync Legacy Approvals
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Applications</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, owner, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select 
                className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value as "all" | "pending" | "approved")}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <Store className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No restaurants found</h3>
              <p className="text-slate-500 max-w-sm mt-1">
                {searchQuery 
                  ? "No results match your search criteria." 
                  : "There are no restaurant applications matching this status."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRestaurants.map((restaurant) => (
                    <TableRow key={restaurant._id}>
                      <TableCell className="font-medium">
                        {restaurant.name}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Joined {new Date(restaurant.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {restaurant.city}, {restaurant.state}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{restaurant.owner?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{restaurant.owner?.email}</div>
                        <div className="mt-2">
                          {restaurant.owner?.isApproved ? (
                            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                              Provider Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                              Provider Pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {restaurant.isApproved ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                            Restaurant Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            Restaurant Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => navigator.clipboard.writeText(restaurant.owner?.email)}
                            >
                              Copy owner email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!restaurant.isApproved && (
                              <DropdownMenuItem 
                                className="text-green-600 font-medium cursor-pointer"
                                onClick={() => {
                                  setSelectedRestaurant(restaurant);
                                  setIsApproveDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve Application
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {selectedRestaurant?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will allow the provider to start publishing menu items and go live on the public landing page. This action cannot be easily undone from the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
            <Button 
              onClick={handleApprove} 
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Confirm Approval
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
