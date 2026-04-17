"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // To get user if available
import { UserRole } from "@/constants/roles";
import { getErrorMessage } from "@/lib/utils";

// Note: ICart interfaces from backend aren't easily imported directly due to server-only code (mongoose).
// Let's define the local frontend types here for strict typing.
export interface CartItem {
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
}

export interface LocalCart {
  _id: string;
  restaurant: {
    _id: string;
    name: string;
  };
  items: CartItem[];
  totalAmount: number;
}

interface CartContextType {
  cart: LocalCart | null;
  isLoading: boolean;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  fetchCart: () => Promise<void>;
  addItem: (menuItemId: string, quantity: number, restaurantId: string) => Promise<boolean>;
  updateQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  removeItem: (menuItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  warningModalOpen: boolean;
  setWarningModalOpen: (open: boolean) => void;
  pendingItem: { menuItemId: string; quantity: number; restaurantId: string } | null;
  confirmSwitchRestaurant: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<LocalCart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // For clear cart warning
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<{ menuItemId: string; quantity: number; restaurantId: string } | null>(null);

  const fetchCart = useCallback(async () => {
    if (!user || String(user.role) !== UserRole.CUSTOMER) {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
      }
    } catch (error) {
      console.error("Failed to fetch cart", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (menuItemId: string, quantity: number, restaurantId: string) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return false;
    }

    if (String(user.role) !== UserRole.CUSTOMER) {
      toast.error("Only customer accounts can add items to the cart");
      return false;
    }
    
    // Check local conflict before calling API to be faster
    if (cart && cart.restaurant._id !== restaurantId && cart.items.length > 0) {
      setPendingItem({ menuItemId, quantity, restaurantId });
      setWarningModalOpen(true);
      return false;
    }

    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, quantity }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          // Backend conflict error check fallback
          setPendingItem({ menuItemId, quantity, restaurantId });
          setWarningModalOpen(true);
          return false;
        }
        const data = await res.json();
        throw new Error(data.error || "Failed to add item");
      }

      await fetchCart();
      toast.success("Item added to cart");
      setDrawerOpen(true); // Open drawer so they see it
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add item"));
      return false;
    }
  };

  const updateQuantity = async (menuItemId: string, quantity: number) => {
    try {
      // Optimistic update
      if (cart) {
        const newCartItems = cart.items.map(item => 
          item.menuItem === menuItemId ? { ...item, quantity } : item
        ).filter(item => item.quantity > 0);
        
        setCart({
          ...cart,
          items: newCartItems,
        } as LocalCart);
      }

      const res = await fetch("/api/cart/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, quantity }),
      });

      if (!res.ok) throw new Error("Failed to update quantity");
      
      // refresh strictly from db
      await fetchCart();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update quantity"));
      await fetchCart(); // Revert on failure
    }
  };

  const removeItem = async (menuItemId: string) => {
    try {
      const res = await fetch(`/api/cart/remove/${menuItemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove item");
      
      toast.success("Item removed");
      await fetchCart();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove item"));
    }
  };

  const clearCart = async () => {
    if (!cart) return;
    try {
      // API doesn't have an explicit clear map right now. 
      // We can use the update route to set quantities to 0 sequentially or rely on delete.
      // Easiest is to simulate emptying the cart because updating the only item to 0 deletes the cart in DB.
      // So doing it sequentially.
      
      for (const item of cart.items) {
          await fetch(`/api/cart/remove/${item.menuItem}`, { method: "DELETE" });
      }
      
      setCart(null);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmSwitchRestaurant = async () => {
    if (!pendingItem) return;
    try {
      await clearCart();
      
      const success = await addItem(pendingItem.menuItemId, pendingItem.quantity, pendingItem.restaurantId);
      if (success) {
        setWarningModalOpen(false);
        setPendingItem(null);
      }
    } catch {
      toast.error("Failed to switch restaurant");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isDrawerOpen,
        setDrawerOpen,
        fetchCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        warningModalOpen,
        setWarningModalOpen,
        pendingItem,
        confirmSwitchRestaurant,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
