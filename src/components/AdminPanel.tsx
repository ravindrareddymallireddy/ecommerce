import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Icon } from './Icon'
import { supabase } from '../lib/supabaseClient'
import {
  buildStats,
  createProduct,
  deleteProduct,
  fetchAdminOrders,
  fetchAdminProducts,
  getStaffRow,
  orderStatuses,
  updateOrderStatus,
  updateProduct,
  type AdminOrder,
  type AdminProduct,
  type OrderStatus,
  type ProductInput,
  type StaffRow,
} from '../lib/adminData'

const categories = ['Dresses', 'Tops', 'Denim', 'Outerwear']
type Tab = 'dashboard' | 'products' | 'orders' | 'inventory'
const tabs: Array<{ id: Tab; label: string; icon: 'chart' | 'tag' | 'box' | 'grid' }> = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart' },
  { id: 'products', label: 'Products', icon: 'tag' },
  { id: 'orders', label: 'Orders', icon: 'box' },
  { id: 'inventory', label: 'Inventory', icon: 'grid' },
]

type ProductForm = {
  name: string; slug: string; category: string; price: string; color: string; tag: string
  image_url: string; image_alt: string; description: string; sizes: string; inventory: string; published: boolean
}

function formatPrice(value: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }
function formFromProduct(product: AdminProduct): ProductForm {
  return {
    name: product.name, slug: product.slug, category: product.category, price: String(product.price),
    color: product.color, tag: product.tag ?? '', image_url: product.image, image_alt: product.imageAlt,
    description: product.description, sizes: product.sizes.join(', '), inventory: String(product.inventory), published: product.published,
  }
}
const emptyForm: ProductForm = {
  name: '', slug: '', category: 'Dresses', price: '', color: '', tag: '',
  image_url: '', image_alt: '', description: '', sizes: 'XS, S, M, L, XL', inventory: '10', published: true,
}

function formToInput(form: ProductForm): ProductInput {
  return {
    name: form.name.trim(),
    slug: (form.slug.trim() || slugify(form.name) || `piece-${Date.now()}`),
    category: form.category,
    price: Number(form.price) || 0,
    color: form.color.trim(),
    tag: form.tag.trim() || null,
    image_url: form.image_url.trim(),
    image_alt: form.image_alt.trim() || form.name.trim(),
    description: form.description.trim(),
    sizes: form.sizes.split(',').map((size) => size.trim()).filter(Boolean),
    inventory: Math.max(0, Math.round(Number(form.inventory) || 0)),
    is_published: form.published,
  }
}

function statusBadgeClass(status: OrderStatus) {
  if (status === 'fulfilled') return 'badge ok'
  if (status === 'cancelled') return 'badge low'
  return 'badge'
}

export function AdminPanel({ user, authConfigured, onGoStore }: { user: User | null; authConfigured: boolean; onGoStore: () => void }) {
  const [staff, setStaff] = useState<StaffRow | null | 'schema-missing' | 'checking'>('checking')
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInBusy, setSignInBusy] = useState(false)
  const [signInError, setSignInError] = useState('')

  useEffect(() => {
    if (!user) { setStaff(null); return }
    let active = true
    getStaffRow().then((row) => { if (active) setStaff(row) })
    return () => { active = false }
  }, [user])

  async function staffSignIn() {
    if (!supabase) return
    setSignInBusy(true); setSignInError('')
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword })
    if (error) setSignInError(error.message)
    setSignInBusy(false)
  }

  if (!authConfigured) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-card">
          <p className="eyebrow">Monuments studio</p>
          <h2>Connect Supabase</h2>
          <p className="modal-copy">Add <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> in Settings → Environment, then restart the preview to unlock the admin panel.</p>
          <button className="button button-dark" onClick={onGoStore}>Back to storefront <Icon name="arrow" size={16} /></button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-card">
          <p className="eyebrow">Monuments studio</p>
          <h2>Staff sign in</h2>
          <p className="modal-copy">Use your staff account to manage the catalog, orders, and inventory.</p>
          <label className="auth-field"><span>Email</span><input type="email" value={signInEmail} onChange={(event) => setSignInEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label className="auth-field"><span>Password</span><input type="password" value={signInPassword} onChange={(event) => setSignInPassword(event.target.value)} placeholder="Your password" /></label>
          {signInError && <p className="auth-error">{signInError}</p>}
          <button className="button button-dark" disabled={signInBusy} onClick={staffSignIn}>{signInBusy ? 'Signing in…' : 'Sign in'} <Icon name="arrow" size={16} /></button>
          <button className="text-link" onClick={onGoStore}>Continue to storefront <Icon name="arrow" size={14} /></button>
        </div>
      </div>
    )
  }

  if (staff === 'checking') {
    return <div className="admin-gate"><p className="eyebrow">Checking access…</p></div>
  }

  if (staff === 'schema-missing') {
    return (
      <div className="admin-gate">
        <div className="admin-gate-card">
          <p className="eyebrow">One step left</p>
          <h2>Run the schema</h2>
          <p className="modal-copy">The admin tables don’t exist yet. Open <b>supabase/schema.sql</b> in the repo, run it in your Supabase dashboard (SQL Editor), then reload this page.</p>
          <button className="button button-dark" onClick={onGoStore}>Back to storefront <Icon name="arrow" size={16} /></button>
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-card">
          <p className="eyebrow">Monuments studio</p>
          <h2>Access restricted</h2>
          <p className="modal-copy"><b>{user.email}</b> isn’t on the staff list. Ask an existing admin to add you, or sign in with a staff account.</p>
          <button className="button button-dark" onClick={() => supabase?.auth.signOut()}>Switch account <Icon name="arrow" size={16} /></button>
          <button className="text-link" onClick={onGoStore}>Continue to storefront <Icon name="arrow" size={14} /></button>
        </div>
      </div>
    )
  }

  return <AdminWorkspace staff={staff} onGoStore={onGoStore} />
}

function AdminWorkspace({ staff, onGoStore }: { staff: StaffRow; onGoStore: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [demo, setDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<{ mode: 'create' } | { mode: 'edit'; product: AdminProduct } | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')

  useEffect(() => {
    let active = true
    Promise.all([fetchAdminProducts(), fetchAdminOrders()]).then(([productResult, orderResult]) => {
      if (!active) return
      setProducts(productResult.products)
      setOrders(orderResult.orders)
      setDemo(productResult.demo)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  function showNotice(message: string) { setNotice(message); window.setTimeout(() => setNotice(''), 3200) }

  async function refresh() {
    const [productResult, orderResult] = await Promise.all([fetchAdminProducts(), fetchAdminOrders()])
    setProducts(productResult.products)
    setOrders(orderResult.orders)
  }

  async function saveProduct(form: ProductForm) {
    if (demo) { setEditing(null); return showNotice('Connect Supabase to edit the catalog') }
    try {
      const input = formToInput(form)
      if (editing?.mode === 'edit') await updateProduct(editing.product.id, input)
      else await createProduct(input)
      setEditing(null)
      showNotice('Product saved')
      await refresh()
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Could not save product')
    }
  }

  async function removeProduct(product: AdminProduct) {
    if (demo) return showNotice('Connect Supabase to edit the catalog')
    if (!window.confirm(`Delete “${product.name}” from the catalog?`)) return
    try {
      await deleteProduct(product.id)
      showNotice('Product deleted')
      await refresh()
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Could not delete product')
    }
  }

  async function togglePublished(product: AdminProduct) {
    if (demo) return showNotice('Connect Supabase to edit the catalog')
    const next = !product.published
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, published: next } : item))
    try { await updateProduct(product.id, { is_published: next }) } catch { showNotice('Could not update visibility'); await refresh() }
  }

  async function adjustStock(product: AdminProduct, delta: number) {
    if (demo) return showNotice('Connect Supabase to edit inventory')
    const next = Math.max(0, product.inventory + delta)
    if (next === product.inventory) return
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, inventory: next } : item))
    try { await updateProduct(product.id, { inventory: next }) } catch { showNotice('Could not update stock'); await refresh() }
  }

  async function setOrderStatus(order: AdminOrder, status: OrderStatus) {
    if (demo) return showNotice('Connect Supabase to manage orders')
    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status } : item))
    try { await updateOrderStatus(order.id, status) } catch { showNotice('Could not update the order'); await refresh() }
  }

  const stats = useMemo(() => buildStats(orders, products), [orders, products])
  const visibleOrders = statusFilter === 'all' ? orders : orders.filter((order) => order.status === statusFilter)

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">MONUMENTS<span>Studio admin</span></div>
        <nav className="admin-nav">
          {tabs.map((item) => (
            <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
              <Icon name={item.icon} size={16} />{item.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <span className="admin-email">{staff.email}</span>
          <button onClick={onGoStore}><Icon name="store" size={15} />Storefront</button>
          <button onClick={() => supabase?.auth.signOut()}><Icon name="logout" size={15} />Sign out</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-title">
            <h1>{tabs.find((item) => item.id === tab)?.label}</h1>
            <p>{loading ? 'Loading…' : `${products.length} products · ${orders.length} orders`}</p>
          </div>
          {tab === 'products' && <button className="button button-dark button-sm" onClick={() => setEditing({ mode: 'create' })}><Icon name="plus" size={15} />New product</button>}
        </div>

        {demo && <div className="admin-demo-note">Demo data — run supabase/schema.sql and add your keys to go live</div>}

        {tab === 'dashboard' && <Dashboard stats={stats} onOpenOrders={() => setTab('orders')} />}
        {tab === 'products' && (
          <ProductsTab products={products} loading={loading} onEdit={(product) => setEditing({ mode: 'edit', product })} onDelete={removeProduct} onTogglePublished={togglePublished} />
        )}
        {tab === 'orders' && <OrdersTab orders={visibleOrders} loading={loading} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onStatusChange={setOrderStatus} />}
        {tab === 'inventory' && <InventoryTab products={products} loading={loading} onAdjust={adjustStock} />}
      </main>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <ProductEditor
            key={editing.mode === 'edit' ? editing.product.id : 'new'}
            initial={editing.mode === 'edit' ? editing.product : null}
            onClose={() => setEditing(null)}
            onSave={saveProduct}
          />
        </div>
      )}
      {notice && <div className="toast"><span>✓</span>{notice}</div>}
    </div>
  )
}

function Dashboard({ stats, onOpenOrders }: { stats: ReturnType<typeof buildStats>; onOpenOrders: () => void }) {
  const max = Math.max(...stats.revenueByDay.map((point) => point.value), 1)
  return (
    <>
      <div className="stat-grid">
        <div className="stat-card"><p className="stat-label">Revenue (all time)</p><strong>{formatPrice(stats.revenue)}</strong><p className="stat-sub">Cancelled orders excluded</p></div>
        <div className="stat-card"><p className="stat-label">Orders</p><strong>{stats.orderCount}</strong><p className="stat-sub">{stats.recentOrders.filter((order) => order.status === 'pending').length} awaiting fulfillment</p></div>
        <div className="stat-card"><p className="stat-label">Units sold</p><strong>{stats.unitsSold}</strong><p className="stat-sub">{stats.lowStock.length} products low on stock</p></div>
      </div>
      <div className="admin-panels">
        <div className="admin-card">
          <p className="eyebrow">Revenue · last 7 days</p>
          <div className="bar-chart">
            {stats.revenueByDay.map((point) => (
              <div className="bar-col" key={point.label}>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${Math.max(2, Math.round((point.value / max) * 96))}px` }} title={formatPrice(point.value)} />
                </div>
                <span>{point.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <p className="eyebrow">Low stock</p>
          {stats.lowStock.length ? stats.lowStock.map((product) => (
            <div className="mini-row" key={product.id}>
              <span className="mini-name">{product.name}</span>
              <span className={`badge ${product.inventory <= 4 ? 'low' : ''}`}>{product.inventory} left</span>
            </div>
          )) : <p className="admin-empty">Everything is well stocked.</p>}
        </div>
      </div>
      <div className="admin-card">
        <p className="eyebrow">Recent orders</p>
        {stats.recentOrders.length ? stats.recentOrders.map((order) => (
          <div className="mini-row" key={order.id}>
            <span className="mini-name">{order.orderNumber} · {order.email}</span>
            <span className="mini-side"><strong>{formatPrice(order.total)}</strong><span className={statusBadgeClass(order.status)}>{order.status}</span></span>
          </div>
        )) : <p className="admin-empty">No orders yet.</p>}
        <button className="text-link" onClick={onOpenOrders}>All orders <Icon name="arrow" size={14} /></button>
      </div>
    </>
  )
}

function ProductsTab({ products, loading, onEdit, onDelete, onTogglePublished }: {
  products: AdminProduct[]; loading: boolean
  onEdit: (product: AdminProduct) => void; onDelete: (product: AdminProduct) => void; onTogglePublished: (product: AdminProduct) => void
}) {
  if (loading) return <p className="admin-empty">Loading products…</p>
  if (!products.length) return <div className="admin-card"><p className="admin-empty">No products yet. Create your first piece.</p></div>
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Visibility</th><th></th></tr></thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td><span className="table-product"><img src={product.image} alt="" /><span><strong>{product.name}</strong><span className="table-sub">/{product.slug}</span></span></span></td>
              <td><span className="badge">{product.category}</span></td>
              <td>{formatPrice(product.price)}</td>
              <td>{product.inventory}</td>
              <td><button className={`chip ${product.published ? 'active' : ''}`} onClick={() => onTogglePublished(product)}>{product.published ? 'Published' : 'Hidden'}</button></td>
              <td><span className="admin-actions-cell">
                <button className="icon-btn" onClick={() => onEdit(product)} aria-label={`Edit ${product.name}`}><Icon name="edit" size={16} /></button>
                <button className="icon-btn danger" onClick={() => onDelete(product)} aria-label={`Delete ${product.name}`}><Icon name="trash" size={16} /></button>
              </span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrdersTab({ orders, loading, statusFilter, setStatusFilter, onStatusChange }: {
  orders: AdminOrder[]; loading: boolean
  statusFilter: 'all' | OrderStatus; setStatusFilter: (value: 'all' | OrderStatus) => void
  onStatusChange: (order: AdminOrder, status: OrderStatus) => void
}) {
  if (loading) return <p className="admin-empty">Loading orders…</p>
  return (
    <>
      <div className="admin-toolbar">
        <div className="chip-row">
          <button className={`chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
          {orderStatuses.map((status) => (
            <button key={status} className={`chip ${statusFilter === status ? 'active' : ''}`} onClick={() => setStatusFilter(status)}>{status}</button>
          ))}
        </div>
      </div>
      {orders.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.orderNumber}</strong></td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.email}</td>
                  <td>{order.items.length ? `${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}` : '—'}</td>
                  <td>{formatPrice(order.total)}</td>
                  <td>
                    <select className="status-select" value={order.status} onChange={(event) => onStatusChange(order, event.target.value as OrderStatus)} aria-label={`Status for ${order.orderNumber}`}>
                      {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="admin-card"><p className="admin-empty">No orders with this status.</p></div>}
    </>
  )
}

function InventoryTab({ products, loading, onAdjust }: { products: AdminProduct[]; loading: boolean; onAdjust: (product: AdminProduct, delta: number) => void }) {
  if (loading) return <p className="admin-empty">Loading inventory…</p>
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td><span className="table-product"><img src={product.image} alt="" /><strong>{product.name}</strong></span></td>
              <td><span className="badge">{product.category}</span></td>
              <td>{formatPrice(product.price)}</td>
              <td><span className="stock-stepper">
                <button onClick={() => onAdjust(product, -1)} aria-label={`Decrease stock for ${product.name}`}>−</button>
                <span>{product.inventory}</span>
                <button onClick={() => onAdjust(product, 1)} aria-label={`Increase stock for ${product.name}`}>+</button>
              </span></td>
              <td><span className={`badge ${product.inventory <= 8 ? 'low' : 'ok'}`}>{product.inventory <= 8 ? 'Low stock' : 'Healthy'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProductEditor({ initial, onClose, onSave }: { initial: AdminProduct | null; onClose: () => void; onSave: (form: ProductForm) => void }) {
  const [form, setForm] = useState<ProductForm>(initial ? formFromProduct(initial) : emptyForm)
  function set<K extends keyof ProductForm>(key: K, value: ProductForm[K]) { setForm((current) => ({ ...current, [key]: value })) }
  return (
    <div className="admin-editor" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
      <h2>{initial ? 'Edit product' : 'New product'}</h2>
      <div className="form-grid">
        <label className="form-field span-2"><span className="form-label">Name</span><input value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Sculpted cotton dress" /></label>
        <label className="form-field"><span className="form-label">Slug</span><input value={form.slug} onChange={(event) => set('slug', event.target.value)} placeholder="auto from name" /></label>
        <label className="form-field"><span className="form-label">Category</span><select value={form.category} onChange={(event) => set('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="form-field"><span className="form-label">Price (USD)</span><input type="number" min="0" value={form.price} onChange={(event) => set('price', event.target.value)} placeholder="168" /></label>
        <label className="form-field"><span className="form-label">Color</span><input value={form.color} onChange={(event) => set('color', event.target.value)} placeholder="bone" /></label>
        <label className="form-field"><span className="form-label">Tag</span><input value={form.tag} onChange={(event) => set('tag', event.target.value)} placeholder="New / Best seller" /></label>
        <label className="form-field"><span className="form-label">Inventory</span><input type="number" min="0" value={form.inventory} onChange={(event) => set('inventory', event.target.value)} /></label>
        <label className="form-field span-2"><span className="form-label">Image URL</span><input value={form.image_url} onChange={(event) => set('image_url', event.target.value)} placeholder="https://…" /></label>
        <label className="form-field span-2"><span className="form-label">Image alt text</span><input value={form.image_alt} onChange={(event) => set('image_alt', event.target.value)} /></label>
        <label className="form-field span-2"><span className="form-label">Description</span><textarea value={form.description} onChange={(event) => set('description', event.target.value)} /></label>
        <label className="form-field span-2"><span className="form-label">Sizes (comma separated)</span><input value={form.sizes} onChange={(event) => set('sizes', event.target.value)} /></label>
        <label className="form-field form-check span-2"><input type="checkbox" checked={form.published} onChange={(event) => set('published', event.target.checked)} /><span>Published on the storefront</span></label>
      </div>
      {form.image_url && <img className="editor-preview" src={form.image_url} alt="" />}
      <div className="editor-actions">
        <button className="button button-dark" onClick={() => onSave(form)}>Save product <Icon name="arrow" size={16} /></button>
        <button className="text-link" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
