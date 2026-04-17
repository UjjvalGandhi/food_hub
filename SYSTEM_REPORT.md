# FoodPartner System Report

## 1. Project Summary

FoodPartner is a multi-role food ordering and delivery platform built with Next.js App Router, React, TypeScript, MongoDB, and Socket.IO.

The system supports four main user roles:

- `CUSTOMER`
- `PROVIDER`
- `ADMIN`
- `DELIVERY_PARTNER`

The application combines:

- public restaurant discovery
- customer ordering and checkout
- provider restaurant and menu management
- admin approvals and platform monitoring
- delivery-partner assignment and status updates
- AI-based recommendations
- group ordering
- review, favorites, and reorder experiences

---

## 2. Technology Stack

### Frontend

- Next.js `16.1.6`
- React `19.2.3`
- TypeScript
- Tailwind CSS v4
- shadcn/ui-style component structure
- Framer Motion
- Sonner toast notifications

### Backend / Server

- Next.js Route Handlers
- Edge proxy middleware for auth/role protection
- Socket.IO for real-time events
- Mongoose with MongoDB
- JWT authentication with `jose` and `jsonwebtoken`
- Zod validation

### AI / Recommendation

- `@google/generative-ai`
- deterministic recommendation engine + AI explanation layer

---

## 3. High-Level Architecture

### Application Layers

1. Presentation layer
   - Next.js pages in `src/app`
   - reusable UI and feature components in `src/components`

2. State and session layer
   - `AuthContext`
   - `CartContext`
   - `SocketContext`

3. API layer
   - route handlers under `src/app/api`

4. business logic layer
   - `src/lib/*`
   - validation schemas in `src/schemas/*`

5. persistence layer
   - Mongoose models in `src/models/*`

6. real-time layer
   - Socket.IO server in `src/socket/server.ts`

---

## 4. App Structure

### Root App Shell

The root layout wraps the app with:

- `AuthProvider`
- `SocketProvider`
- `CartProvider`
- global `CartDrawer`
- global `Toaster`

This creates a unified authenticated and real-time shell across the project.

### Major App Areas

- Public customer-facing pages: `src/app/(public)`
- Customer dashboard: `src/app/dashboard`
- Checkout: `src/app/checkout`
- Provider module: `src/app/provider`
- Legacy provider alias area: `src/app/restaurant-owner`
- Admin module: `src/app/admin`
- Delivery module: `src/app/delivery`

---

## 5. Role-Based Modules

### Customer

Customer capabilities include:

- account registration and login
- restaurant browsing
- menu discovery
- cart operations
- checkout and order placement
- order history
- order tracking
- reorder
- favorites
- ratings and reviews
- AI recommendations
- group ordering participation

Main customer pages:

- `/`
- `/restaurants`
- `/restaurants/[id]`
- `/recommendations`
- `/orders`
- `/orders/[id]`
- `/dashboard`
- `/checkout`

### Provider

Provider capabilities include:

- restaurant profile creation and update
- menu and category management
- order lifecycle updates
- review monitoring and reply handling

Main provider pages:

- `/provider`
- `/provider/restaurant`
- `/provider/menu`
- `/provider/categories`
- `/provider/orders`

### Admin

Admin capabilities include:

- restaurant approvals
- delivery-partner approvals
- platform order monitoring
- provider approval synchronization

Main admin pages:

- `/admin`
- `/admin/restaurants`
- `/admin/delivery-partners`

### Delivery Partner

Delivery partner capabilities include:

- registration
- profile management
- availability control
- available-order pickup
- accepted delivery management
- delivery history
- live status updates

Main delivery pages:

- `/delivery/register`
- `/delivery`
- `/delivery/profile`

---

## 6. Authentication and Authorization

### Authentication

Authentication is JWT-based.

Flow:

1. user logs in via `/api/auth/login`
2. JWT is generated
3. token is returned and also stored in an HttpOnly cookie
4. `AuthContext` hydrates user state using `/api/auth/me`

### Authorization

Authorization is enforced in `src/proxy.ts`.

Responsibilities:

- verify JWT in Edge runtime
- normalize roles
- protect app routes
- protect API routes
- inject `x-user-id` and `x-user-role` headers

The proxy contains separate restrictions for:

- admin routes
- provider routes
- customer routes
- delivery routes

---

## 7. Core Data Models

### User

Stores:

- name
- email
- password
- role
- approval / block status
- preferences
- favorite restaurants

### Restaurant

Stores:

- restaurant identity
- owner reference
- branding images
- address data
- approval state
- open/close state
- rating and review counts

### MenuCategory

Groups menu items for a restaurant.

### MenuItem

Stores food data, availability, metadata, and pricing.

### Cart

Stores the customer cart before checkout.

### Order

Stores:

- customer
- restaurant
- ordered items
- total amount
- order status
- address
- payment method
- payment status
- optional delivery partner

The `Order` model is intentionally guarded by immutability checks so only status-related fields can change after creation.

### DeliveryPartner

Stores:

- linked user
- partner ID
- phone
- vehicle type
- license number
- availability
- assigned orders

### GroupOrder

Supports shared ordering, invite-based participation, split logic, and checkout.

### Review

Stores:

- order-linked review
- rating
- review message
- optional photos
- optional provider reply

---

## 8. Main Functional Flows

### Customer Ordering Flow

1. browse approved/open restaurants
2. view restaurant detail and menu
3. add items to cart
4. checkout with delivery address and payment method
5. place order
6. track order and review after delivery

### Provider Order Flow

1. receive new order
2. move status from `PENDING` to `ACCEPTED`
3. move to `PREPARING`
4. move to `READY_FOR_PICKUP`
5. delivery partner takes over from this point

### Delivery Flow

1. delivery partner becomes available
2. sees ready-for-pickup orders
3. accepts an order
4. updates to `PICKED_UP`
5. updates to `OUT_FOR_DELIVERY`
6. updates to `DELIVERED`

There is also an auto-delivery simulation flow for demo/testing when provider marks an order ready for pickup.

### Group Order Flow

1. host creates group order
2. invite code / shared link is generated
3. participants join
4. each participant adds their own items
5. group checkout handles split logic
6. order is converted into a normal order flow

### Recommendation Flow

Recommendation inputs include:

- previous behavior
- mood
- weather
- diet
- health goals
- menu metadata

Outputs include:

- scored food recommendations
- contextual suggestions
- optional AI-generated explanation text

---

## 9. Realtime System

Socket.IO powers live updates across roles.

### Main Rooms

- `user:{userId}` for customer updates
- `provider:{restaurantId}` for provider updates
- `admin:global` for admin updates
- `delivery:partners` for available delivery jobs
- `groupOrder:{orderId}` for shared ordering

### Main Realtime Events

- order status updates
- admin order updates
- new delivery available
- group order join/leave events

---

## 10. Major APIs by Domain

### Auth

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`

### Restaurants

- `/api/restaurants`
- `/api/restaurants/[id]`
- `/api/restaurants/[id]/favorite`

### Cart

- `/api/cart`
- `/api/cart/add`
- `/api/cart/update`
- `/api/cart/remove/[itemId]`

### Orders

- `/api/orders`
- `/api/orders/customer`
- `/api/orders/[id]`
- `/api/orders/[id]/cancel`
- `/api/orders/[id]/reorder`
- `/api/orders/[id]/review`
- `/api/orders/available`
- `/api/orders/accept`
- `/api/orders/delivery-partner`
- `/api/orders/update-delivery-status`

### Provider

- `/api/provider/restaurant`
- `/api/provider/menu`
- `/api/provider/category`
- `/api/provider/orders`
- `/api/provider/orders/[id]/status`
- `/api/provider/reviews`
- `/api/provider/reviews/[id]/reply`

### Admin

- `/api/admin/restaurants`
- `/api/admin/restaurant/[id]/approve`
- `/api/admin/delivery-partners`
- `/api/admin/orders/stats`
- `/api/admin/maintenance/provider-approvals`

### Recommendations

- `/api/recommendations`
- `/api/recommendations/contextual`

### Group Order

- `/api/group-orders`
- `/api/group-orders/[code]`
- `/api/group-order/create`
- `/api/group-order/join`
- `/api/group-order/cart`
- `/api/group-order/add-item`
- `/api/group-order/checkout`
- `/api/group-order/split-payment`

### Delivery Profile

- `/api/delivery/profile`

---

## 11. UI / UX Features Implemented

The system includes several user-facing enhancements:

- AI meal recommendation page
- home screen current order spotlight
- safe image fallback handling
- favorites for restaurants
- review and ratings with optional photos
- provider review replies
- Zomato-style order tracking page
- quick reorder
- group ordering with split summary
- simulated QR payment flow
- delivery-partner dashboard and profile module
- smart dashboard suggestions

---

## 12. Current Strengths

- clear separation of customer, provider, admin, and delivery roles
- strong full-stack coverage inside one Next.js app
- broad feature set for a portfolio/startup prototype
- real-time updates already integrated
- flexible recommendation engine
- practical route-handler architecture
- meaningful dashboard and workflow coverage for all core actors

---

## 13. Current Risks / Weaknesses

### 1. Some legacy overlap still exists

The project has both `provider` and `restaurant-owner` sections, which appear to represent the same business role. This creates maintenance duplication risk.

### 2. Some scripts and docs are not production-grade

There are helper scripts and seed utilities that are useful locally, but they are not fully standardized or documented for team onboarding.

### 3. Delivery earnings are not true payout accounting

Current delivery “earnings” are based on order totals and dashboard summaries, not a real commission or settlement model.

### 4. Payment is demo-oriented

Payment UX exists, including QR simulation, but there is no real gateway integration.

### 5. Group order and advanced delivery features still have room to mature

The project supports these flows, but deeper production behaviors like conflict handling, exact payment reconciliation, and true live GPS tracking are not yet present.

### 6. There are signs of legacy/hot-reload complexity

Recent fixes around model recompilation and role normalization suggest the app has some dev-mode fragility that should be monitored.

---

## 14. Security and Data Handling Notes

- JWT is stored in HttpOnly cookies for SSR/middleware access
- role checks are centralized in proxy middleware
- route validation uses Zod
- passwords in current local helper flow are plaintext for demo/testing behavior
- production hardening would require:
  - real password hashing
  - stricter environment validation
  - rate limiting
  - audit logging
  - production payment integration

---

## 15. Recommended Next Improvements

### High Priority

- unify `provider` and `restaurant-owner`
- add real password hashing
- add environment/config validation
- add integration-level tests for order and delivery lifecycle

### Product Priority

- coupons and promo system
- saved customer addresses
- real delivery payout model
- push notifications
- provider analytics dashboard
- map-based live tracking

### Engineering Priority

- centralize event names and status transitions
- seed scripts cleanup
- stronger API response typing
- add repository-level technical documentation

---

## 16. Conclusion

FoodPartner is a feature-rich multi-role food delivery platform with a solid full-stack foundation. It already demonstrates the key systems expected in a modern ordering marketplace:

- account-based role separation
- restaurant and menu management
- cart and checkout
- order lifecycle management
- delivery coordination
- AI recommendations
- group ordering
- real-time tracking

The project is strongest as a working product prototype or advanced academic/startup portfolio system. With cleanup around legacy duplication, security hardening, and a few production-grade operational improvements, it can evolve into a much more maintainable and deployment-ready platform.
