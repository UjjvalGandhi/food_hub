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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Store, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { SafeImage } from "@/components/shared/SafeImage";

// Matches our backend schema exactly
const imageValueSchema = z
  .string()
  .min(1, "Image is required.")
  .refine(
    (value) =>
      /^https?:\/\//i.test(value) ||
      /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value),
    "Must be a valid image URL or uploaded image."
  );

const restaurantFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  address: z.string().min(5, "Please enter a complete address."),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required."),
  pincode: z.string().min(5, "Valid pincode is required."),
  logo: imageValueSchema,
  coverImage: imageValueSchema,
});

type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

type ProviderRestaurant = RestaurantFormValues & {
  _id: string;
  isApproved: boolean;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export default function RestaurantProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingRestaurant, setHasExistingRestaurant] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadingField, setUploadingField] = useState<"logo" | "coverImage" | null>(null);

  const form = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      logo: "",
      coverImage: "",
    },
  });

  const loadRestaurantData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/provider/restaurant");
      const data = (await response.json()) as {
        error?: string;
        restaurant: ProviderRestaurant | null;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to load restaurant profile.");
      }

      if (data.restaurant) {
        setHasExistingRestaurant(true);
        setIsApproved(data.restaurant.isApproved);
        form.reset({
          name: data.restaurant.name || "",
          description: data.restaurant.description || "",
          address: data.restaurant.address || "",
          city: data.restaurant.city || "",
          state: data.restaurant.state || "",
          pincode: data.restaurant.pincode || "",
          logo: data.restaurant.logo || "",
          coverImage: data.restaurant.coverImage || "",
        });
      } else {
        setHasExistingRestaurant(false);
        setIsApproved(false);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch restaurant:", error);
      setGeneralError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void loadRestaurantData();
  }, [loadRestaurantData]);

  async function handleImageSelection(
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: "logo" | "coverImage"
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setGeneralError("Please choose a valid image file.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingField(fieldName);
      setGeneralError("");
      const dataUrl = await readFileAsDataUrl(file);
      form.setValue(fieldName, dataUrl, { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      setGeneralError(getErrorMessage(error));
    } finally {
      setUploadingField(null);
      event.target.value = "";
    }
  }

  async function onSubmit(data: RestaurantFormValues) {
    setIsSubmitting(true);
    setGeneralError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/provider/restaurant", {
        method: hasExistingRestaurant ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        error?: string;
        restaurant?: ProviderRestaurant;
      };

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit profile.");
      }

      setSuccessMessage(
        hasExistingRestaurant
          ? "Restaurant profile updated successfully."
          : "Restaurant profile created! Awaiting admin approval."
      );
      setHasExistingRestaurant(true);
      setIsApproved(result.restaurant?.isApproved ?? false);
    } catch (error: unknown) {
      setGeneralError(getErrorMessage(error));
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Store className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Restaurant Profile</h1>
      </div>

      {generalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 font-semibold">Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Approval Status Banner */}
      {hasExistingRestaurant && (
        <Alert
          className={
            isApproved
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }
        >
          {isApproved ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600" />
          )}
          <AlertTitle className="font-semibold">
            Status: {isApproved ? "Approved & Live" : "Pending Approval"}
          </AlertTitle>
          <AlertDescription>
            {isApproved
              ? "Your restaurant is visible to customers. You can now publish menu items."
              : "Your profile is under review by our admin team. You cannot publish menu items yet."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            {hasExistingRestaurant 
              ? "Your current restaurant details." 
              : "Enter your restaurant details to begin onboarding."}
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
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Restaurant Name *</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} placeholder="e.g. The Spicy Kitchen" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={isSubmitting}
                          placeholder="Tell customers about your cuisine and specialties..."
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} placeholder="123 Food Street, Shop #4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} placeholder="Mumbai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} placeholder="Maharashtra" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode *</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} placeholder="400001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Image *</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          disabled={isSubmitting || uploadingField === "logo"}
                          onChange={(event) => void handleImageSelection(event, "logo")}
                        />
                      </FormControl>
                      <FormDescription>Required. Choose from your file manager. Optimal size: 500x500px</FormDescription>
                      <div className="space-y-3">
                        <div className="relative h-24 w-24 overflow-hidden rounded-2xl border bg-muted">
                          <SafeImage
                            src={field.value || "/food-placeholder.svg"}
                            alt="Logo preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                        {field.value ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("logo", "", { shouldDirty: true, shouldValidate: true })}>
                            Remove logo
                          </Button>
                        ) : null}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image *</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          disabled={isSubmitting || uploadingField === "coverImage"}
                          onChange={(event) => void handleImageSelection(event, "coverImage")}
                        />
                      </FormControl>
                      <FormDescription>Required. Choose from your file manager. Optimal size: 1200x400px</FormDescription>
                      <div className="space-y-3">
                        <div className="relative h-28 w-full overflow-hidden rounded-2xl border bg-muted">
                          <SafeImage
                            src={field.value || "/food-placeholder.svg"}
                            alt="Cover preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                        {field.value ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("coverImage", "", { shouldDirty: true, shouldValidate: true })}>
                            Remove cover
                          </Button>
                        ) : null}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {hasExistingRestaurant ? "Save Changes" : "Submit for Approval"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
