"use client";

import { useCallback, useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MenuSquare, AlertCircle, Loader2, Plus } from "lucide-react";

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
});

type CategoryFormValues = z.infer<typeof createCategorySchema>;

type Category = {
  _id: string;
  name: string;
  isActive: boolean;
  itemCount: number;
};

type ProviderRestaurant = {
  _id: string;
  name: string;
  isApproved: boolean;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export default function CategoryManagementPage() {
  const [restaurant, setRestaurant] = useState<ProviderRestaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
    },
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/provider/category");
      const result = (await response.json()) as {
        error?: string;
        restaurant: ProviderRestaurant | null;
        categories: Category[];
      };

      if (!response.ok) {
        throw new Error(result.error || "Failed to load categories.");
      }

      setRestaurant(result.restaurant);
      setCategories(result.categories || []);
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

  async function onSubmit(data: CategoryFormValues) {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/provider/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create category.");
      }

      form.reset();
      await fetchData();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit() {
    if (!editingCategory) return;

    setActiveCategoryId(editingCategory._id);
    setError("");

    try {
      const response = await fetch(`/api/provider/category/${editingCategory._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Failed to update category.");
      }

      setEditingCategory(null);
      setEditName("");
      await fetchData();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setActiveCategoryId(null);
    }
  }

  async function toggleCategoryStatus(category: Category) {
    setActiveCategoryId(category._id);
    setError("");

    try {
      const response = await fetch(`/api/provider/category/${category._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Failed to update category status.");
      }

      await fetchData();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setActiveCategoryId(null);
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
          <AlertTitle className="font-semibold">Action Required</AlertTitle>
          <AlertDescription>
            You must set up your Restaurant Profile before creating menu categories.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MenuSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Menu Categories</h1>
        </div>
      </div>

      <Alert
        className={
          restaurant.isApproved
            ? "bg-green-50 text-green-800 border-green-200"
            : "bg-amber-50 text-amber-800 border-amber-200"
        }
      >
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold">
          {restaurant.isApproved ? "Restaurant is live" : "Restaurant pending approval"}
        </AlertTitle>
        <AlertDescription>
          Categories are managed privately here. Menu publishing stays locked until your restaurant is approved.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Add Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>
            Categories organize your menu items, for example Starters, Main Course, and Desserts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
              <div className="flex-1 max-w-sm">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Beverages" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No categories found. Add your first category above!
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[220px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">{category.itemCount}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            category.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {category.isActive ? "Active" : "Archived"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(category);
                            setEditName(category.name);
                          }}
                          disabled={activeCategoryId === category._id}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={category.isActive ? "ghost" : "outline"}
                          size="sm"
                          onClick={() => void toggleCategoryStatus(category)}
                          disabled={activeCategoryId === category._id}
                        >
                          {activeCategoryId === category._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : category.isActive ? (
                            "Archive"
                          ) : (
                            "Restore"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editingCategory)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCategory(null);
            setEditName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>
              Update the label providers use when organizing menu items.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category name</label>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="e.g. Desserts"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCategory(null);
                  setEditName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleEditSubmit()}
                disabled={!editName.trim() || activeCategoryId === editingCategory?._id}
              >
                {activeCategoryId === editingCategory?._id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
