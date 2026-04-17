"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, AlertCircle, IndianRupee, Loader2, Save, Trash2 } from "lucide-react";

const menuItemSchema = z.object({
  name: z.string().min(1, "Item name is required").trim(),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  image: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  category: z.string().min(1, "You must select a category"),
  isVeg: z.boolean(),
  isAvailable: z.boolean(),
});

type MenuItemFormValues = z.infer<typeof menuItemSchema>;

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
  image?: string;
  isVeg?: boolean;
  isAvailable: boolean;
  category: Category | string | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export default function RestaurantOwnerMenuItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const itemId = typeof params.id === "string" ? params.id : "";

  const [restaurant, setRestaurant] = useState<ProviderRestaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemName, setItemName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      image: "",
      category: "",
      isVeg: true,
      isAvailable: true,
    },
  });

  const loadMenuItem = useCallback(async () => {
    if (!itemId) return;

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/provider/menu/${itemId}`);
      const result = (await response.json()) as {
        error?: string;
        restaurant?: ProviderRestaurant;
        categories?: Category[];
        menuItem?: MenuItemType;
      };

      if (!response.ok || !result.menuItem || !result.restaurant) {
        throw new Error(result.error || "Failed to load menu item.");
      }

      const categoryId =
        typeof result.menuItem.category === "string"
          ? result.menuItem.category
          : result.menuItem.category?._id || "";

      setRestaurant(result.restaurant);
      setCategories(result.categories || []);
      setItemName(result.menuItem.name);
      form.reset({
        name: result.menuItem.name,
        description: result.menuItem.description || "",
        price: result.menuItem.price,
        image: result.menuItem.image || "",
        category: categoryId,
        isVeg: result.menuItem.isVeg ?? true,
        isAvailable: result.menuItem.isAvailable,
      });
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [form, itemId]);

  useEffect(() => {
    void loadMenuItem();
  }, [loadMenuItem]);

  const selectedCategory = form.watch("category");
  const availableCategories = useMemo(() => {
    return categories.filter(
      (category) => category.isActive || category._id === selectedCategory
    );
  }, [categories, selectedCategory]);

  async function onSubmit(data: MenuItemFormValues) {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/provider/menu/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as { error?: string; menuItem?: MenuItemType };
      if (!response.ok) {
        throw new Error(result.error || "Failed to update menu item.");
      }

      setSuccessMessage("Menu item updated successfully.");
      if (result.menuItem?.name) {
        setItemName(result.menuItem.name);
      }
      await loadMenuItem();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/provider/menu/${itemId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete menu item.");
      }

      router.push("/restaurant-owner/menu");
    } catch (error: unknown) {
      setError(getErrorMessage(error));
      setIsDeleting(false);
      setDeleteDialogOpen(false);
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
      <div className="max-w-3xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Menu item unavailable</AlertTitle>
          <AlertDescription>
            We could not load this menu item for your restaurant.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/restaurant-owner/menu">Back to menu items</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 -ml-4">
            <Link href="/restaurant-owner/menu">
              <ArrowLeft className="h-4 w-4" />
              Back to menu items
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Manage {itemName}</h1>
          <p className="text-muted-foreground">
            Update pricing, category placement, and availability for this menu item.
          </p>
        </div>

        <Button
          variant="destructive"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete item
        </Button>
      </div>

      {!restaurant.isApproved ? (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Restaurant pending approval</AlertTitle>
          <AlertDescription>
            You can keep refining menu details, but customers will not see them until the restaurant is approved.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Edit menu item</CardTitle>
          <CardDescription>
            These changes only affect the private catalog for {restaurant.name} until the restaurant is live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Item name *</FormLabel>
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
                          {availableCategories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.name}
                              {!category.isActive ? " (Archived)" : ""}
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
                      <FormLabel>Price *</FormLabel>
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
                  name="isVeg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Food type</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select item status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Available</SelectItem>
                          <SelectItem value="false">Sold out</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Sold out items stay in your catalog but are hidden from public ordering.
                      </FormDescription>
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell customers what makes this dish special..."
                          className="resize-none h-28"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the menu item from your catalog and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}