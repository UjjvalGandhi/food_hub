"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UtensilsCrossed, AlertCircle, Loader2, Plus, IndianRupee } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const createMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required").trim(),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  image: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  category: z.string().min(1, "You must select a category"),
  isVeg: z.boolean(),
});

type MenuItemFormValues = z.infer<typeof createMenuItemSchema>;

type ProviderRestaurant = {
  _id: string;
  name: string;
  isApproved: boolean;
};

type Category = {
  _id: string;
  name: string;
  isActive: boolean;
};

type MenuItemType = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  isVeg?: boolean;
  isAvailable: boolean;
  category: Category | string | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export default function MenuManagementPage() {
  const [restaurant, setRestaurant] = useState<ProviderRestaurant | null>(null);
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(createMenuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      image: "",
      category: "",
      isVeg: true,
    },
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/provider/menu");
      const result = (await response.json()) as {
        error?: string;
        restaurant: ProviderRestaurant | null;
        categories: Category[];
        menuItems: MenuItemType[];
      };

      if (!response.ok) {
        throw new Error(result.error || "Failed to load your menu catalog.");
      }

      setRestaurant(result.restaurant);
      setCategories(result.categories || []);
      setItems(result.menuItems || []);
    } catch (error: unknown) {
      console.error(error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories]
  );

  async function onSubmit(data: MenuItemFormValues) {
    if (!restaurant?.isApproved) {
      setError("Your restaurant must be approved by an admin before adding items.");
      return;
    }

    if (activeCategories.length === 0) {
      setError("Please create an active category before adding menu items.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/provider/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Failed to create menu item.");
      }

      form.reset();
      await fetchData();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="font-semibold">Restaurant Required</AlertTitle>
          <AlertDescription>
            You must set up your Restaurant Profile before managing menu items.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Menu Items</h1>
        </div>
      </div>

      {!restaurant.isApproved && (
         <Alert className="bg-amber-50 text-amber-800 border-amber-200">
           <AlertCircle className="h-4 w-4 text-amber-600" />
           <AlertTitle className="font-semibold">Account Pending Approval</AlertTitle>
           <AlertDescription>
             Your restaurant profile is currently under review. You cannot publish menu items until an Administrator approves your account.
           </AlertDescription>
         </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADD ITEM FORM (Requires Approval && Categories) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className={!restaurant.isApproved ? "opacity-60 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle>Add New Item</CardTitle>
              <CardDescription>
                Fill out the details to add a new dish to your menu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeCategories.length === 0 && restaurant.isApproved ? (
                <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle>No Categories</AlertTitle>
                  <AlertDescription>
                    Please create a Menu Category first before adding items.
                  </AlertDescription>
                </Alert>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Garlic Naan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activeCategories.map((cat) => (
                                <SelectItem key={cat._id} value={cat._id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Prefix (₹) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="number" 
                                step="0.01" 
                                className="pl-9" 
                                {...field} 
                                onChange={(event) =>
                                  field.onChange(
                                    event.target.value === ""
                                      ? 0
                                      : parseFloat(event.target.value)
                                  )
                                }
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Delicious oven baked bread..." 
                              className="resize-none h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isVeg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Food Type</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value === "true")}
                            value={String(field.value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select food type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">Vegetarian</SelectItem>
                              <SelectItem value="false">Non-vegetarian</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Shown to customers on the menu.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || !restaurant.isApproved || activeCategories.length === 0}
                    >
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Add Menu Item
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ITEMS LIST TABLE */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Menu ({items.length})</CardTitle>
              <CardDescription>
                Overview of all dishes actively published on your restaurant profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                  No menu items found. {restaurant.isApproved ? "Start by adding one on the left!" : "Await admin approval to begin."}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dish</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const itemCategory =
                          typeof item.category === "string"
                            ? categories.find((category) => category._id === item.category) ?? null
                            : item.category;
                        const catName = itemCategory?.name || "Unknown";
                        
                        return (
                          <TableRow key={item._id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              <div className="space-y-1">
                                <div>{catName}</div>
                                {itemCategory && !itemCategory.isActive ? (
                                  <span className="text-xs text-amber-600">Archived category</span>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>₹{item.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  item.isAvailable
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.isAvailable ? "In Stock" : "Sold Out"}
                              </span>
                            </TableCell>
                            <TableCell>{item.isVeg ? "Veg" : "Non-veg"}</TableCell>
                            <TableCell className="text-right">
                              <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                                <Link href={`/restaurant-owner/menu/${item._id}`}>Manage</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
