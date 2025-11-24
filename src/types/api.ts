export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  role: 'ADMIN' | 'MANAGER' | 'WAITER' | 'CLIENT';
  expiresIn: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignUpRequest {
  username: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export interface ClientDTO {
  id: number;
  fullName: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  fullName: string;
  phone?: string;
  email?: string;
}

export interface DishDTO {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  isAvailable: boolean;
  imageUrl?: string;
  preparationTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDishRequest {
  name: string;
  description?: string;
  category: string;
  price: number;
  imageUrl?: string;
  preparationTimeMinutes: number;
  isAvailable?: boolean;
}

export interface IngredientDTO {
  id: number;
  name: string;
  unit: string;
  stockQuantity: number;
  costPerUnit: number;
  minStockLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientRequest {
  name: string;
  unit: string;
  stockQuantity?: number;
  costPerUnit?: number;
  minStockLevel?: number;
}

export interface UpdateStockRequest {
  quantity: number;
}

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OrderDTO {
  id: number;
  orderTime: string;
  total: number;
  status: OrderStatus;
  clientId?: number;
  clientName?: string;
  clientPhone?: string;
  reservationId?: number;
  notes?: string;
  createdByUserId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  activeReservations: number;
  totalClients: number;
  lowStockItems: number;
  pendingOrders: number;
}


export interface CreateOrderRequest {
  clientId?: number;
  reservationId?: number;
  notes?: string;
  items: CreateOrderItemRequest[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface OrderItemDTO {
  id: number;
  orderId: number;
  dishId: number;
  dishName?: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  createdAt: string;
}

export interface CreateOrderItemRequest {
  dishId: number;
  quantity: number;
  unitPrice?: number;
}

export type ReservationStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface ReservationDTO {
  id: number;
  reservationTime: string;
  durationMinutes: number;
  partySize: number;
  clientId: number;
  clientName?: string;
  clientPhone?: string;
  tableId?: number;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationRequest {
  reservationTime: string;
  durationMinutes?: number;
  partySize: number;
  clientId?: number;
  tableId?: number;
  notes?: string;
}

export interface TableDTO {
  id: number;
  tableNumber: string;
  capacity: number;
  isAvailable: boolean;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTableRequest {
  tableNumber: string;
  capacity: number;
  location?: string;
}

export interface SupplierDTO {
  id: number;
  name: string;
  inn?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  inn?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
}

export type SupplyStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface SupplyDTO {
  id: number;
  supplyTime: string;
  supplierId?: number;
  supplierName?: string;
  status: SupplyStatus;
  totalCost: number;
  notes?: string;
  receivedByUserId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplyRequest {
  supplierId?: number;
  notes?: string;
}

export interface SupplyItemDTO {
  id: number;
  supplyId: number;
  ingredientId: number;
  ingredientName?: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  createdAt: string;
}

export interface CreateSupplyItemRequest {
  ingredientId: number;
  quantity: number;
  unitPrice: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE' | 'OTHER';

export interface SaleDTO {
  id: number;
  saleTime: string;
  total: number;
  paymentMethod?: PaymentMethod;
  orderId: number;
  receiptNumber?: string;
  processedByUserId?: number;
  createdAt: string;
}

export interface CreateSaleRequest {
  total: number;
  paymentMethod?: PaymentMethod;
  orderId: number;
  receiptNumber?: string;
}

export interface DashboardStatsDTO {
  todayOrders: number;
  todayRevenue: number;
  activeReservations: number;
  totalClients: number;
  lowStockItems: number;
  pendingOrders: number;
}

export interface SalesStatsDTO {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  orderCount: number;
  paymentMethodBreakdown: Record<string, number>;
}

export interface ErrorResponse {
  status: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
  details?: Record<string, any>;
}
