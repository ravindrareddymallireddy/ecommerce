import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { fallbackProducts, loadProducts, type Category, type Product } from './lib/products'
import { supabase } from './lib/supabaseClient'

type CartLine = Product & { quantity: number; size: string }
type Route = { page: 'home' | 'shop' | 'product' | 'cart'; slug?: string }

const navItems: Array<{ label: string; value: Category }> = [
  { label: 'Shop all', value: 'All' }, { label: 'Dresses', value: 'Dresses' }, { label: 'Tops', value: 'Tops' }, { label: 'Denim', value: 'Denim' }, { label: 'Outerwear', value: 'Outerwear' },
]

function getRoute(): Route {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '')
  if (path === 'shop') return { page: 'shop' }
  if (path === 'cart') return { page: 'cart' }
  if (path.startsWith('products/')) return { page: 'product', slug: path.slice('products/'.length) }
  return { page: 'home' }
}

function formatPrice(value: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) }
function Icon({ name, size = 20 }: { name: 'search' | 'bag' | 'heart' | 'user' | 'arrow' | 'close' | 'menu' | 'chevron'; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (name === 'search') return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
  if (name === 'bag') return <svg {...common}><path d="M5 8.5h14l1 12H4l1-12Z" /><path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9" /></svg>
  if (name === 'heart') return <svg {...common}><path d="M20.8 8.9c0 5.4-8.8 10.3-8.8 10.3S3.2 14.3 3.2 8.9A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.8 2.2Z" /></svg>
  if (name === 'user') return <svg {...common}><circle cx="12" cy="8" r="3.4" /><path d="M5.1 20c.6-3.4 3-5.2 6.9-5.2s6.3 1.8 6.9 5.2" /></svg>
  if (name === 'arrow') return <svg {...common}><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></svg>
  if (name === 'close') return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>
  if (name === 'menu') return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
  return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>
}

function ProductCard({ product, isSaved, onSave, onAdd, onOpen }: { product: Product; isSaved: boolean; onSave: () => void; onAdd: () => void; onOpen: () => void }) {
  return <article className="product-card">
    <div className="product-image-wrap" onClick={onOpen} role="link" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onOpen()}>
      <img src={product.image} alt={product.imageAlt} className="product-image" />
      {product.tag && <span className="product-tag">{product.tag}</span>}
      <button className={`save-button ${isSaved ? 'saved' : ''}`} onClick={(event) => { event.stopPropagation(); onSave() }} aria-label={`Save ${product.name}`}><Icon name="heart" size={18} /></button>
      <button className="quick-add" onClick={(event) => { event.stopPropagation(); onAdd() }}>Quick add <Icon name="arrow" size={15} /></button>
    </div>
    <div className="product-meta" onClick={onOpen} role="link"><div><h3>{product.name}</h3><p>{product.color}</p></div><strong>{formatPrice(product.price)}</strong></div>
  </article>
}

function App() {
  const [route, setRoute] = useState<Route>(getRoute)
  const [products, setProducts] = useState<Product[]>(fallbackProducts)
  const [productsLoading, setProductsLoading] = useState(true)
  const [category, setCategory] = useState<Category>('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('Featured')
  const [cart, setCart] = useState<CartLine[]>(() => { try { return JSON.parse(localStorage.getItem('monuments-cart') ?? '[]') as CartLine[] } catch { return [] } })
  const [saved, setSaved] = useState<number[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const { user, configured: authConfigured } = useAuth()

  useEffect(() => { loadProducts().then((items) => { setProducts(items); setProductsLoading(false) }) }, [])
  useEffect(() => { localStorage.setItem('monuments-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { const onPop = () => setRoute(getRoute()); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop) }, [])

  function showNotice(message: string) { setNotice(message); window.setTimeout(() => setNotice(''), 2800) }
  function go(path: string) { window.history.pushState({}, '', path); setRoute(getRoute()); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function addToCart(product: Product, size = product.sizes[0] ?? 'M') {
    setCart((current) => { const existing = current.find((item) => item.id === product.id && item.size === size); if (existing) return current.map((item) => item.id === product.id && item.size === size ? { ...item, quantity: Math.min(item.quantity + 1, product.inventory || 99) } : item); return [...current, { ...product, size, quantity: 1 }] })
    showNotice(`${product.name} added to bag`)
  }
  function updateQuantity(id: number | string, size: string, delta: number) { setCart((current) => current.flatMap((item) => item.id !== id || item.size !== size ? [item] : item.quantity + delta <= 0 ? [] : [{ ...item, quantity: item.quantity + delta }])) }
  function toggleSaved(id: number | string) { const numeric = Number(id); setSaved((current) => current.includes(numeric) ? current.filter((item) => item !== numeric) : [...current, numeric]) }
  function selectCategory(value: Category) { setCategory(value); go('/shop') }
  async function signIn() { if (!supabase) return showNotice('Add Supabase keys in Settings to enable sign in'); setAuthBusy(true); setAuthError(''); const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword }); if (error) setAuthError(error.message); else { setAccountOpen(false); showNotice('Welcome back to Monuments') }; setAuthBusy(false) }
  async function signUp() { if (!supabase) return showNotice('Add Supabase keys in Settings to enable sign in'); setAuthBusy(true); setAuthError(''); const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword }); if (error) setAuthError(error.message); else showNotice('Check your email to confirm your account'); setAuthBusy(false) }
  async function googleSignIn() { if (!supabase) return showNotice('Add Supabase keys in Settings to enable sign in'); const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }); if (error) setAuthError(error.message) }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const currentProduct = route.page === 'product' ? products.find((product) => product.slug === route.slug) : undefined
  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const result = products.filter((product) => (category === 'All' || product.category === category) && (!normalized || `${product.name} ${product.category} ${product.color}`.toLowerCase().includes(normalized)))
    if (sort === 'Price: low to high') return [...result].sort((a, b) => a.price - b.price)
    if (sort === 'Price: high to low') return [...result].sort((a, b) => b.price - a.price)
    if (sort === 'Newest') return [...result].reverse()
    return result
  }, [category, products, query, sort])

  return <div className="app-shell">
    <div className="announcement">Complimentary shipping on orders over $150 <span>·</span> Made thoughtfully in New York</div>
    <header className="site-header"><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu"><Icon name="menu" /></button><button className="wordmark" onClick={() => go('/')}>MONUMENTS</button><nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>{navItems.map((item) => <button key={item.value} className={category === item.value && route.page === 'shop' ? 'active' : ''} onClick={() => selectCategory(item.value)}>{item.label}</button>)}<button className="admin-link" onClick={() => showNotice('Admin tools are available after staff authentication')}>Admin portal</button></nav><div className="header-actions"><button onClick={() => setAccountOpen(true)} aria-label="Account"><Icon name="user" /></button><button onClick={() => showNotice(`${saved.length} saved pieces`)} className="desktop-action" aria-label="Wishlist"><Icon name="heart" /><span className="action-dot">{saved.length}</span></button><button onClick={() => go('/cart')} aria-label="Shopping bag"><Icon name="bag" /><span className="bag-count">{cartCount}</span></button></div></header>

    {route.page === 'home' && <Home onShop={() => selectCategory('All')} />}
    {route.page === 'shop' && <Shop products={filteredProducts} loading={productsLoading} category={category} setCategory={setCategory} query={query} setQuery={setQuery} sort={sort} setSort={setSort} saved={saved} onSave={toggleSaved} onAdd={addToCart} onOpen={(slug) => go(`/products/${slug}`)} />}
    {route.page === 'product' && <ProductDetail product={currentProduct} onBack={() => go('/shop')} onAdd={addToCart} />}
    {route.page === 'cart' && <CartPage cart={cart} subtotal={subtotal} onUpdate={updateQuantity} onShop={() => selectCategory('All')} onCheckout={() => showNotice(user ? 'Order checkout is ready for Stripe' : 'Sign in before checkout to save your order')} />}

    <footer className="site-footer"><div className="footer-top"><button className="wordmark" onClick={() => go('/')}>MONUMENTS</button><p>Clothing for the in-between.</p><div className="footer-links"><button onClick={() => selectCategory('All')}>Shop</button><button onClick={() => showNotice('Our story is coming soon')}>About</button><button onClick={() => setAccountOpen(true)}>Account</button><button onClick={() => showNotice('Support will be with you shortly')}>Contact</button></div></div><div className="footer-bottom"><span>© 2024 Monuments Studio</span><span>New York · London · Everywhere</span><span>Privacy &nbsp; Terms</span></div></footer>

    {accountOpen && <div className="modal-backdrop" onClick={() => setAccountOpen(false)}><div className="account-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAccountOpen(false)}><Icon name="close" /></button>{user ? <><p className="eyebrow">Your Monuments account</p><h2>Good to see<br /><em>you again.</em></h2><p className="modal-copy">{user.email}</p><button className="button button-dark full-button" onClick={async () => { await supabase?.auth.signOut(); setAccountOpen(false); showNotice('You have been signed out') }}>Sign out <Icon name="arrow" size={17} /></button></> : <><p className="eyebrow">Welcome to Monuments</p><h2>Your account,<br /><em>your edit.</em></h2><p className="modal-copy">Sign in to save pieces, view orders, and pick up where you left off.</p>{!authConfigured && <div className="auth-config-note">Add <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> in Settings → Environment.</div>}<label className="auth-field"><span>Email</span><input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" /></label><label className="auth-field"><span>Password</span><input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 6 characters" /></label>{authError && <p className="auth-error">{authError}</p>}<button className="button button-dark full-button" disabled={authBusy} onClick={signIn}>{authBusy ? 'Signing in…' : 'Continue with email'} <Icon name="arrow" size={17} /></button><button className="text-link auth-signup" disabled={authBusy} onClick={signUp}>Create an account <Icon name="arrow" size={15} /></button><button className="google-button" disabled={authBusy} onClick={googleSignIn}>G <span>Continue with Google</span></button><p className="modal-legal">By continuing, you agree to our Terms and Privacy Policy.</p></>}</div></div>}
    {notice && <div className="toast"><span>✓</span>{notice}</div>}
  </div>
}

function Home({ onShop }: { onShop: () => void }) { return <main id="top"><section className="hero"><div className="hero-copy"><p className="eyebrow">The autumn edit · 2024</p><h1>Made for<br /><em>the in-between.</em></h1><p className="hero-description">Clothing with room to move, made for the days that become something else.</p><button className="button button-dark" onClick={onShop}>Explore the collection <Icon name="arrow" size={17} /></button></div><div className="hero-image"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1500&q=88" alt="Model in an oversized black coat against a pale studio wall" /><div className="hero-caption"><span>01 / 04</span><span>Rituals of everyday</span></div></div><div className="hero-side-note">New perspectives<br />in familiar forms <span>↗</span></div></section><section className="manifesto"><p className="eyebrow">The Monuments point of view</p><p className="manifesto-copy">Less, but better. We make lasting pieces that meet you where you are — and become part of where you’re going.</p><a href="#story">Our approach <Icon name="arrow" size={15} /></a></section><section className="feature-banner"><div className="feature-image"><img src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1100&q=85" alt="Neutral-toned clothing on a rack" /></div><div className="feature-copy"><p className="eyebrow">The daily uniform</p><h2>Good clothes<br /><em>keep their word.</em></h2><p>Our materials are chosen for how they feel today, and how they’ll live with you tomorrow.</p><button className="text-link" onClick={onShop}>Shop the edit <Icon name="arrow" size={15} /></button></div></section><section id="story" className="story-section"><div className="story-heading"><p className="eyebrow">A quieter kind of progress</p><h2>Designed with<br /><em>intention.</em></h2></div><div className="story-details"><p>We believe what you wear should feel like an extension of your own point of view. Our collections are considered slowly, sourced responsibly, and made to outlast the season.</p><div className="story-stats"><div><strong>01</strong><span>Considered<br />design</span></div><div><strong>02</strong><span>Responsible<br />materials</span></div><div><strong>03</strong><span>Made to<br />last</span></div></div></div></section><section className="newsletter"><div><p className="eyebrow">Notes from Monuments</p><h2>Stay in the know.</h2><p>New pieces, studio notes, and things worth noticing. No noise.</p></div><form onSubmit={(event) => { event.preventDefault() }}><input type="email" required placeholder="Your email address" aria-label="Your email address" /><button type="submit">Subscribe <Icon name="arrow" size={16} /></button></form></section></main> }

function Shop({ products, loading, category, setCategory, query, setQuery, sort, setSort, saved, onSave, onAdd, onOpen }: { products: Product[]; loading: boolean; category: Category; setCategory: (category: Category) => void; query: string; setQuery: (value: string) => void; sort: string; setSort: (value: string) => void; saved: number[]; onSave: (id: number | string) => void; onAdd: (product: Product) => void; onOpen: (slug: string) => void }) { return <main className="shop-section"><div className="section-heading"><div><p className="eyebrow">Curated for now</p><h1 className="shop-title">Shop the collection</h1></div><p className="result-count">{products.length} pieces</p></div><div className="shop-toolbar"><div className="category-pills">{navItems.map((item) => <button key={item.value} className={category === item.value ? 'selected' : ''} onClick={() => setCategory(item.value)}>{item.label}</button>)}</div><div className="toolbar-right"><label className="search-field"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pieces" /></label><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option>Featured</option><option>Newest</option><option>Price: low to high</option><option>Price: high to low</option></select></div></div>{loading ? <div className="loading-state"><span></span><span></span><span></span></div> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} isSaved={saved.includes(Number(product.id))} onSave={() => onSave(product.id)} onAdd={() => onAdd(product)} onOpen={() => onOpen(product.slug)} />)}</div> : <div className="empty-state"><p>No pieces found.</p><button className="text-link" onClick={() => { setQuery(''); setCategory('All') }}>Clear filters <Icon name="arrow" size={15} /></button></div>}</main> }

function ProductDetail({ product, onBack, onAdd }: { product?: Product; onBack: () => void; onAdd: (product: Product, size: string) => void }) { const [size, setSize] = useState(product?.sizes[0] ?? 'M'); if (!product) return <main className="not-found"><p className="eyebrow">404 / Not found</p><h1>This piece has moved.</h1><button className="button button-dark" onClick={onBack}>Back to shop <Icon name="arrow" size={17} /></button></main>; return <main className="product-detail"><button className="back-link" onClick={onBack}>← Back to shop</button><div className="detail-layout"><div className="detail-image"><img src={product.image} alt={product.imageAlt} /></div><div className="detail-copy"><p className="eyebrow">{product.category} / {product.color}</p><h1>{product.name}</h1><strong className="detail-price">{formatPrice(product.price)}</strong><p className="detail-description">{product.description}</p><div className="detail-divider"></div><p className="selector-label">Select size <span>Size guide</span></p><div className="size-selector">{product.sizes.map((item) => <button key={item} className={size === item ? 'selected' : ''} onClick={() => setSize(item)}>{item}</button>)}</div><p className="inventory-note">{product.inventory < 10 ? `Only ${product.inventory} left` : 'In stock · Ships within 2–3 days'}</p><button className="button button-dark detail-add" onClick={() => onAdd(product, size)}>Add to bag <Icon name="bag" size={17} /></button><div className="detail-points"><p><b>Free shipping</b> on orders over $150</p><p><b>Easy returns</b> within 30 days</p><p><b>Made thoughtfully</b> with considered materials</p></div></div></div></main> }

function CartPage({ cart, subtotal, onUpdate, onShop, onCheckout }: { cart: CartLine[]; subtotal: number; onUpdate: (id: number | string, size: string, delta: number) => void; onShop: () => void; onCheckout: () => void }) { return <main className="cart-page"><div className="cart-page-heading"><div><p className="eyebrow">Your selection</p><h1>Shopping bag <em>({cart.reduce((total, item) => total + item.quantity, 0)})</em></h1></div><button className="back-link" onClick={onShop}>Continue shopping →</button></div>{cart.length ? <div className="cart-layout"><div className="cart-lines-page">{cart.map((item) => <div className="cart-line-page" key={`${item.id}-${item.size}`}><img src={item.image} alt={item.imageAlt} /><div><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><p className="cart-variant">{item.color} · Size {item.size}</p><div className="quantity"><button onClick={() => onUpdate(item.id, item.size, -1)}>−</button><span>{item.quantity}</span><button onClick={() => onUpdate(item.id, item.size, 1)}>+</button></div></div><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}</div><aside className="order-summary"><p className="eyebrow">Order summary</p><div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><div><span>Shipping</span><span>Complimentary</span></div><div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div><button className="button button-dark checkout-button" onClick={onCheckout}>Continue to checkout <Icon name="arrow" size={17} /></button><p className="shipping-note">Taxes calculated at checkout</p></aside></div> : <div className="cart-empty"><div className="empty-bag"><Icon name="bag" size={26} /></div><h2>Your bag is waiting.</h2><p>Start with something considered.</p><button className="button button-dark" onClick={onShop}>Explore the collection <Icon name="arrow" size={17} /></button></div>}</main> }

export default App
