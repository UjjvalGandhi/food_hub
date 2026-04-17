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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Search, Bike } from "lucide-react";

type DeliveryPartner = {
  _id: string;
  partnerId: string;
  name: string;
  phone: string;
  vehicleType: string;
  licenseNumber: string;
  availability: string;
  user: {
    _id: string;
    name: string;
    email: string;
    isApproved: boolean;
    isBlocked: boolean;
    createdAt: string;
  };
};

export default function AdminDeliveryPartnersPage() {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/delivery-partners");
      const data = await res.json();
      if (data.success) setPartners(data.data);
    } catch (err) {
      toast.error("Failed to fetch delivery partners");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleAction = async (userId: string, action: "approve" | "block") => {
    setActionLoading(`${userId}-${action}`);
    try {
      const res = await fetch("/api/admin/delivery-partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchPartners();
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.partnerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Partners</h1>
          <p className="text-muted-foreground mt-1">
            Approve and manage delivery partner accounts.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>All Partners ({filtered.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Bike className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold">No delivery partners found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery ? "No results match your search." : "No partners have registered yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((partner) => (
                    <TableRow key={partner._id}>
                      <TableCell>
                        <div className="font-medium">{partner.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{partner.partnerId}</div>
                      </TableCell>
                      <TableCell>
                        <div>{partner.user?.email}</div>
                        <div className="text-xs text-muted-foreground">{partner.phone}</div>
                      </TableCell>
                      <TableCell>{partner.vehicleType}</TableCell>
                      <TableCell className="font-mono text-sm">{partner.licenseNumber}</TableCell>
                      <TableCell>
                        {partner.user?.isBlocked ? (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Blocked</Badge>
                        ) : partner.user?.isApproved ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!partner.user?.isApproved && !partner.user?.isBlocked && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                              onClick={() => handleAction(partner.user._id, "approve")}
                              disabled={actionLoading === `${partner.user._id}-approve`}
                            >
                              {actionLoading === `${partner.user._id}-approve` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                              )}
                              Approve
                            </Button>
                          )}
                          {!partner.user?.isBlocked && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
                              onClick={() => handleAction(partner.user._id, "block")}
                              disabled={actionLoading === `${partner.user._id}-block`}
                            >
                              {actionLoading === `${partner.user._id}-block` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <XCircle className="mr-1 h-3 w-3" />
                              )}
                              Block
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
