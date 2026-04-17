import type { OrderStatus as CanonicalOrderStatus } from "@/constants/orders";
import type { UserRole } from "@/constants/roles";

// ─── Global App Types ──────────────────────────────────────────────────────

export type Role = UserRole;
export type OrderStatus = CanonicalOrderStatus;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
  isBlocked?: boolean;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSessionData {
  user: AuthUser;
  token: string;
}

export interface RegistrationData extends AuthUser {
  requiresApproval: boolean;
}

// ─── API Response Wrapper ──────────────────────────────────────────────────

export type ApiFieldErrors = Record<string, string[] | undefined>;

export type ApiResponse<T = unknown> =
  | {
      success: true;
      message: string;
      data: T;
      errors?: ApiFieldErrors;
    }
  | {
      success: false;
      message: string;
      data?: undefined;
      errors?: ApiFieldErrors;
    };

// ─── Pagination ────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Food & Restaurant ─────────────────────────────────────────────────────

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  restaurantId: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisine: string[];
  rating: number;
  deliveryTime: number;
  minimumOrder: number;
  isOpen: boolean;
}

// ─── Cart ──────────────────────────────────────────────────────────────────

export interface CartItem extends FoodItem {
  quantity: number;
}

// ─── Orders ────────────────────────────────────────────────────────────────

export interface DeliveryAddress {
  street: string;
  city: string;
  pincode: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderRestaurantSummary {
  _id: string;
  name: string;
  logo?: string;
  city: string;
}

export interface OrderReview {
  rating: number;
  comment?: string;
  photoUrls?: string[];
  providerReply?: {
    message: string;
    repliedAt: string;
  } | null;
  createdAt: string;
}

export interface OrderDeliveryPartnerSummary {
  _id: string;
  name: string;
  phone: string;
  vehicleType: "BIKE" | "SCOOTER" | "CAR" | "CYCLE";
}

export interface OrderCustomerSummary {
  _id: string;
  name: string;
  email: string;
}

export interface CustomerOrder {
  _id: string;
  restaurant: OrderRestaurantSummary | null;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: DeliveryAddress;
  paymentMethod?: "COD" | "ONLINE";
  paymentStatus?: "PENDING" | "COMPLETED" | "FAILED";
  deliveryPartner?: OrderDeliveryPartnerSummary | null;
  review?: OrderReview | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderOrder {
  _id: string;
  user?: OrderCustomerSummary;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: DeliveryAddress;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersListData<TOrder> {
  orders: TOrder[];
  pagination: PaginationMeta;
}

export interface OrderStatusEvent {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
}

export interface NewOrderEvent {
  orderId: string;
  restaurantId: string;
  totalAmount: number;
  createdAt: string;
}
