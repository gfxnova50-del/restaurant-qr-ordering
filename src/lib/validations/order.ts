import { z } from 'zod';

export const orderItemInputSchema = z.object({
  menu_item_id: z.string().min(1, { message: 'Menu item ID is required' }),
  quantity: z.number().int().min(1, { message: 'Quantity must be at least 1' }).max(50, { message: 'Quantity cannot exceed 50 per item' }),
});

export const createOrderSchema = z.object({
  restaurant_id: z.string().min(1, { message: 'Restaurant ID is required' }),
  table_id: z.string().min(1, { message: 'Table ID is required' }),
  customer_name: z.string().trim().max(100).optional().nullable(),
  customer_phone: z.string().trim().regex(/^(\+?[0-9]{7,15})?$/, { message: 'Invalid phone number format' }).optional().nullable(),
  payment_method: z.enum(['counter', 'online']).default('counter'),
  notes: z.string().trim().max(500).optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, { message: 'Order must contain at least one item' }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['received', 'preparing', 'ready', 'served', 'cancelled'], {
    errorMap: () => ({ message: 'Status must be one of: received, preparing, ready, served, cancelled' }),
  }),
});

export const createPaymentSchema = z.object({
  order_id: z.string().min(1, { message: 'Order ID is required' }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
