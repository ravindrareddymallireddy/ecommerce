import { supabase } from './supabaseClient'
import { fallbackProducts, type Product } from './products'

export type StaffRow = { id: string; email: string; role: string }
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled'
export const orderStatuses: OrderStatus[] = ['pending', 'paid', 'fulfilled', 'cancelled']

export type AdminProduct = Product & { published: boolean }
export type OrderLineInput = { productId: number | string; name: string; color: string; size: string; unitPrice: number; quantity: number }
export type AdminOrderItem = { name: string; color: string; size: string; unitPrice: number; quantity: number }
export type AdminOrder = { id: number | string; orderNumber: string; email: string; status: OrderStatus; subtotal: number; shipping: number; total: number; createdAt: string; items: AdminOrderItem[] }
export type RevenuePoint = { label: string; value: number }
export type AdminStats = { revenue: number; orderCount: number; unitsSold: number; lowStock: Product[]; recentOrders: AdminOrder[]; revenueByDay: RevenuePoint[] }
export type ProductInput = {
  name: string; slug: string; category: string; price: number; color: string; tag: string | null
  image_url: string; image_alt: string | null; description: string; sizes: string[]
  inventory: number; is_published: boolean
}

/** Returns the signed-in user's staff row, null when not staff, or 'schema-missing' when the table does not exist yet. */
export async function getStaffRow(): Promise<StaffRow | null | 'schema-missing'> {
  if (!supabase) return null
  const { data, error } = await supabase.from('staff_users').select('id, email, role').limit(1)
  if (error) return 'schema-missing'
  const row = data?.[0]
  return row ? (row as StaffRow) : null
}

// ---------- Demo data (shown until Supabase is configured and the schema is applied) ----------

export function demoProducts(): AdminProduct[] {
  return fallbackProducts.map((product) => ({ ...product, published: true }))
}

function demoOrders(): AdminOrder[] {
  const statuses: OrderStatus[] = ['pending', 'paid', 'fulfilled', 'fulfilled', 'cancelled', 'paid', 'pending']
  const names = ['ava', 'noor', 'liam', 'mika', 'sofia', 'theo', 'june']
  return Array.from({ length: 7 }, (_, index) => {
    const product = fallbackProducts[(index * 3 + 1) % fallbackProducts.length]
    const quantity = (index % 3) + 1
    const subtotal = product.price * quantity
    return {
      id: 1000 + index,
      orderNumber: `MN-${2400 + index}`,
      email: `${names[index % names.length]}@example.com`,
      status: statuses[index],
      subtotal,
      shipping: 0,
      total: subtotal,
      createdAt: new Date(Date.now() - index * 26 * 60 * 60 * 1000).toISOString(),
      items: [{ name: product.name, color: product.color, size: product.sizes[index % product.sizes.length], unitPrice: product.price, quantity }],
    }
  })
}

// ---------- Products ----------

type ProductRow = {
  id: number; slug: string; name: string; category: string; price: string | number
  color: string; tag: string | null; image_url: string; image_alt: string | null
  description: string; sizes: string[] | null; inventory: number | null; is_published: boolean
}

function mapProductRow(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as AdminProduct['category'],
    price: Number(row.price),
    color: row.color,
    tag: row.tag ?? undefined,
    image: row.image_url,
    imageAlt: row.image_alt ?? row.name,
    description: row.description,
    sizes: row.sizes ?? ['XS', 'S', 'M', 'L'],
    inventory: row.inventory ?? 0,
    published: row.is_published,
  }
}

export async function fetchAdminProducts(): Promise<{ demo: boolean; products: AdminProduct[] }> {
  if (!supabase) return { demo: true, products: demoProducts() }
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  if (error) return { demo: true, products: demoProducts() }
  // Empty catalog is a real state, not a fallback — keep the panel editable.
  return { demo: false, products: (data ?? []).map(mapProductRow) }
}

export async function createProduct(input: ProductInput): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('products').insert(input)
  if (error) throw new Error(error.message)
}

export async function updateProduct(id: number | string, patch: Partial<ProductInput>): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('products').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteProduct(id: number | string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------- Orders ----------

type OrderRow = {
  id: number; order_number: string; email: string; status: string
  subtotal: string | number; shipping: string | number; total: string | number
  created_at: string
  order_items: { name: string; color: string; size: string; unit_price: string | number; quantity: number }[] | null
}

function mapOrderRow(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    email: row.email,
    status: (orderStatuses.includes(row.status as OrderStatus) ? row.status : 'pending') as OrderStatus,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    createdAt: row.created_at,
    items: (row.order_items ?? []).map((item) => ({ name: item.name, color: item.color, size: item.size, unitPrice: Number(item.unit_price), quantity: item.quantity })),
  }
}

export async function fetchAdminOrders(): Promise<{ demo: boolean; orders: AdminOrder[] }> {
  if (!supabase) return { demo: true, orders: demoOrders() }
  const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(100)
  if (error) return { demo: true, orders: demoOrders() }
  return { demo: false, orders: (data ?? []).map(mapOrderRow) }
}

export async function updateOrderStatus(id: number | string, status: OrderStatus): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

/** Creates a customer order from checkout. Returns false when Supabase is unavailable or the insert is rejected. */
export async function createCustomerOrder(input: { userId: string; email: string; lines: OrderLineInput[] }): Promise<boolean> {
  if (!supabase || !input.lines.length) return false
  const subtotal = input.lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0)
  const { data, error } = await supabase
    .from('orders')
    .insert({ order_number: `MN-${Date.now().toString().slice(-6)}`, user_id: input.userId, email: input.email, status: 'pending', subtotal, shipping: 0, total: subtotal })
    .select('id')
    .single()
  if (error || !data) return false
  const items = input.lines.map((line) => ({
    order_id: data.id,
    product_id: typeof line.productId === 'number' ? line.productId : null,
    name: line.name,
    color: line.color,
    size: line.size,
    unit_price: line.unitPrice,
    quantity: line.quantity,
  }))
  await supabase.from('order_items').insert(items)
  return true
}

// ---------- Analytics ----------

export function buildStats(orders: AdminOrder[], products: Product[]): AdminStats {
  const active = orders.filter((order) => order.status !== 'cancelled')
  const revenue = active.reduce((total, order) => total + order.total, 0)
  const unitsSold = active.reduce((total, order) => total + order.items.reduce((sum, item) => sum + item.quantity, 0), 0)
  const lowStock = [...products].filter((product) => product.inventory <= 8).sort((a, b) => a.inventory - b.inventory).slice(0, 5)
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const revenueByDay: RevenuePoint[] = Array.from({ length: 7 }, (_, index) => {
    const day = new Date()
    day.setDate(day.getDate() - (6 - index))
    const value = active.filter((order) => startOfDay(new Date(order.createdAt)) === startOfDay(day)).reduce((total, order) => total + order.total, 0)
    return { label: day.toLocaleDateString('en-US', { weekday: 'short' }), value }
  })
  return { revenue, orderCount: active.length, unitsSold, lowStock, recentOrders: orders.slice(0, 5), revenueByDay }
}
