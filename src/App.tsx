import { useMemo, useState } from 'react'

type Category = 'All' | 'Dresses' | 'Tops' | 'Denim' | 'Outerwear'
type Product = {
  id: number
  name: string
  category: Exclude<Category, 'All'>
  price: number
  color: string
  tag?: string
  image: string
  imageAlt: string
}

type CartLine = Product & { quantity: number; size: string }

const products: Product[] = [
  { id: 1, name: 'Sculpted cotton dress', category: 'Dresses', price: 168, color: 'bone', tag: 'New', image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=900&q=85', imageAlt: 'Woman in an ivory sculpted cotton dress' },
  { id: 2, name: 'Mara wide-leg jean', category: 'Denim', price: 148, color: 'indigo', tag: 'Best seller', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85', imageAlt: 'Model wearing wide-leg indigo jeans' },
  { id: 3, name: 'Linen volume shirt', category: 'Tops', price: 98, color: 'chalk', image: 'https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&w=900&q=85', imageAlt: 'White linen button-up shirt' },
  { id: 4, name: 'Longline wool coat', category: 'Outerwear', price: 298, color: 'charcoal', tag: 'Limited', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=85', imageAlt: 'Model in a tailored charcoal wool coat' },
  { id: 5, name: 'Bias silk slip dress', category: 'Dresses', price: 210, color: 'clay', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85', imageAlt: 'Woman in a clay silk slip dress' },
  { id: 6, name: 'Relaxed merino knit', category: 'Tops', price: 128, color: 'moss', image: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?auto=format&fit=crop&w=900&q=85', imageAlt: 'Soft green merino knit sweater' },
  { id: 7, name: 'Atelier pleated trouser', category: 'Denim', price: 138, color: 'ink', image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85', imageAlt: 'Tailored pleated trouser in ink' },
  { id: 8, name: 'Everyday utility jacket', category: 'Outerwear', price: 188, color: 'olive', image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=900&q=85', imageAlt: 'Olive utility jacket' },
]

const navItems: Array<{ label: string; value: Category }> = [
  { label: 'Shop all', value: 'All' },
  { label: 'Dresses', value: 'Dresses' },
  { label: 'Tops', value: 'Tops' },
  { label: 'Denim', value: 'Denim' },
  { label: 'Outerwear', value: 'Outerwear' },
]

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

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

function ProductCard({ product, isSaved, onSave, onAdd }: { product: Product; isSaved: boolean; onSave: () => void; onAdd: () => void }) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={product.image} alt={product.imageAlt} className="product-image" />
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <button className={`save-button ${isSaved ? 'saved' : ''}`} onClick={onSave} aria-label={`Save ${product.name}`}><Icon name="heart" size={18} /></button>
        <button className="quick-add" onClick={onAdd}>Quick add <Icon name="arrow" size={15} /></button>
      </div>
      <div className="product-meta">
        <div><h3>{product.name}</h3><p>{product.color}</p></div>
        <strong>{formatPrice(product.price)}</strong>
      </div>
    </article>
  )
}

function App() {
  const [category, setCategory] = useState<Category>('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('Featured')
  const [cart, setCart] = useState<CartLine[]>([])
  const [saved, setSaved] = useState<number[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const result = products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category
      const matchesQuery = !normalized || `${product.name} ${product.category} ${product.color}`.toLowerCase().includes(normalized)
      return matchesCategory && matchesQuery
    })
    if (sort === 'Price: low to high') return [...result].sort((a, b) => a.price - b.price)
    if (sort === 'Price: high to low') return [...result].sort((a, b) => b.price - a.price)
    if (sort === 'Newest') return [...result].reverse()
    return result
  }, [category, query, sort])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...current, { ...product, quantity: 1, size: 'M' }]
    })
    setCartOpen(true)
    showNotice(`${product.name} added to bag`)
  }

  function toggleSaved(id: number) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function updateQuantity(id: number, delta: number) {
    setCart((current) => current.flatMap((item) => item.id !== id ? [item] : item.quantity + delta <= 0 ? [] : [{ ...item, quantity: item.quantity + delta }]))
  }

  return (
    <div className="app-shell">
      <div className="announcement">Complimentary shipping on orders over $150 <span>·</span> Made thoughtfully in New York</div>
      <header className="site-header">
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu"><Icon name="menu" /></button>
        <a href="#top" className="wordmark">MONUMENTS</a>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
          {navItems.map((item) => <button key={item.value} className={category === item.value ? 'active' : ''} onClick={() => { setCategory(item.value); setMenuOpen(false); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }}>{item.label}</button>)}
          <button onClick={() => setAdminOpen(true)} className="admin-link">Admin preview</button>
        </nav>
        <div className="header-actions">
          <button onClick={() => setAccountOpen(true)} aria-label="Account"><Icon name="user" /></button>
          <button onClick={() => setSaved((current) => current)} aria-label="Wishlist" className="desktop-action"><Icon name="heart" /><span className="action-dot">{saved.length}</span></button>
          <button onClick={() => setCartOpen(true)} aria-label="Shopping bag" className="bag-action"><Icon name="bag" /><span className="bag-count">{cartCount}</span></button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">The autumn edit · 2024</p>
            <h1>Made for<br /><em>the in-between.</em></h1>
            <p className="hero-description">Clothing with room to move, made for the days that become something else.</p>
            <button className="button button-dark" onClick={() => { setCategory('All'); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }}>Explore the collection <Icon name="arrow" size={17} /></button>
          </div>
          <div className="hero-image"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1500&q=88" alt="Model in an oversized black coat against a pale studio wall" /><div className="hero-caption"><span>01 / 04</span><span>Rituals of everyday</span></div></div>
          <div className="hero-side-note">New perspectives<br />in familiar forms <span>↗</span></div>
        </section>

        <section className="manifesto"><p className="eyebrow">The Monuments point of view</p><p className="manifesto-copy">Less, but better. We make lasting pieces that meet you where you are — and become part of where you’re going.</p><a href="#story">Our approach <Icon name="arrow" size={15} /></a></section>

        <section id="shop" className="shop-section">
          <div className="section-heading"><div><p className="eyebrow">Curated for now</p><h2>Shop the collection</h2></div><p className="result-count">{filteredProducts.length} pieces</p></div>
          <div className="shop-toolbar"><div className="category-pills">{navItems.map((item) => <button key={item.value} className={category === item.value ? 'selected' : ''} onClick={() => setCategory(item.value)}>{item.label}</button>)}</div><div className="toolbar-right"><label className="search-field"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pieces" /></label><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option>Featured</option><option>Newest</option><option>Price: low to high</option><option>Price: high to low</option></select></div></div>
          {filteredProducts.length > 0 ? <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} isSaved={saved.includes(product.id)} onSave={() => toggleSaved(product.id)} onAdd={() => addToCart(product)} />)}</div> : <div className="empty-state"><p>No pieces found.</p><button className="text-link" onClick={() => { setQuery(''); setCategory('All') }}>Clear filters <Icon name="arrow" size={15} /></button></div>}
        </section>

        <section className="feature-banner"><div className="feature-image"><img src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1100&q=85" alt="Neutral-toned clothing on a rack" /></div><div className="feature-copy"><p className="eyebrow">The daily uniform</p><h2>Good clothes<br /><em>keep their word.</em></h2><p>Our materials are chosen for how they feel today, and how they’ll live with you tomorrow.</p><button className="text-link" onClick={() => showNotice('Our materials journal is coming soon')}>Read our materials journal <Icon name="arrow" size={15} /></button></div></section>

        <section id="story" className="story-section"><div className="story-heading"><p className="eyebrow">A quieter kind of progress</p><h2>Designed with<br /><em>intention.</em></h2></div><div className="story-details"><p>We believe what you wear should feel like an extension of your own point of view. Our collections are considered slowly, sourced responsibly, and made to outlast the season.</p><div className="story-stats"><div><strong>01</strong><span>Considered<br />design</span></div><div><strong>02</strong><span>Responsible<br />materials</span></div><div><strong>03</strong><span>Made to<br />last</span></div></div></div></section>

        <section className="newsletter"><div><p className="eyebrow">Notes from Monuments</p><h2>Stay in the know.</h2><p>New pieces, studio notes, and things worth noticing. No noise.</p></div><form onSubmit={(event) => { event.preventDefault(); showNotice('You’re on the list — welcome in.') }}><input type="email" required placeholder="Your email address" aria-label="Your email address" /><button type="submit">Subscribe <Icon name="arrow" size={16} /></button></form></section>
      </main>

      <footer className="site-footer"><div className="footer-top"><a href="#top" className="wordmark">MONUMENTS</a><p>Clothing for the in-between.</p><div className="footer-links"><a href="#shop">Shop</a><a href="#story">About</a><button onClick={() => setAccountOpen(true)}>Account</button><button onClick={() => showNotice('Support will be with you shortly')}>Contact</button></div></div><div className="footer-bottom"><span>© 2024 Monuments Studio</span><span>New York · London · Everywhere</span><span>Privacy &nbsp; Terms</span></div></footer>

      {cartOpen && <div className="overlay" onClick={() => setCartOpen(false)}><aside className="side-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><p className="eyebrow">Your selection</p><h2>Shopping bag <span>{cartCount}</span></h2></div><button onClick={() => setCartOpen(false)} aria-label="Close shopping bag"><Icon name="close" /></button></div>{cart.length ? <><div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.id}><img src={item.image} alt="" /><div className="cart-line-info"><h3>{item.name}</h3><p>Size {item.size} · {item.color}</p><div className="quantity"><button onClick={() => updateQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)}>+</button></div></div><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}</div><div className="drawer-bottom"><div className="subtotal"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><p className="shipping-note">Shipping and taxes calculated at checkout</p><button className="button button-dark checkout-button" onClick={() => showNotice('Checkout is ready for Stripe when payments are enabled')}>Continue to checkout <Icon name="arrow" size={17} /></button></div></> : <div className="drawer-empty"><div className="empty-bag"><Icon name="bag" size={26} /></div><p>Your bag is waiting.</p><button className="text-link" onClick={() => { setCartOpen(false); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }}>Explore the collection <Icon name="arrow" size={15} /></button></div>}</aside></div>}

      {accountOpen && <div className="modal-backdrop" onClick={() => setAccountOpen(false)}><div className="account-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAccountOpen(false)}><Icon name="close" /></button><p className="eyebrow">Welcome to Monuments</p><h2>Your account,<br /><em>your edit.</em></h2><p className="modal-copy">Sign in to save pieces, view orders, and pick up where you left off.</p><button className="button button-dark full-button" onClick={() => showNotice('Sign in is ready for Firebase authentication')}>Continue with email <Icon name="arrow" size={17} /></button><button className="google-button" onClick={() => showNotice('Google sign-in is ready to connect')}>G <span>Continue with Google</span></button><p className="modal-legal">By continuing, you agree to our Terms and Privacy Policy.</p></div></div>}

      {adminOpen && <div className="modal-backdrop" onClick={() => setAdminOpen(false)}><div className="admin-modal" onClick={(event) => event.stopPropagation()}><div className="admin-head"><div><p className="eyebrow">Monuments / Admin</p><h2>Store overview</h2></div><button className="modal-close" onClick={() => setAdminOpen(false)}><Icon name="close" /></button></div><div className="admin-grid"><div className="admin-card admin-wide"><span>Gross sales</span><strong>$24,860</strong><small>↑ 18.4% from last month</small><div className="chart"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div className="admin-card"><span>Orders</span><strong>184</strong><small>↑ 12 this week</small></div><div className="admin-card"><span>Low stock</span><strong>08</strong><small className="warning">Needs attention</small></div></div><div className="admin-table"><div><span>Recent orders</span><a href="#admin">View all ↗</a></div>{['#MN-1084', '#MN-1083', '#MN-1082'].map((order, index) => <p key={order}><b>{order}</b><span>{['Maya Thompson', 'Julian Bell', 'Sofia Reed'][index]}</span><em>{['Processing', 'Shipped', 'Delivered'][index]}</em><strong>{['$348', '$168', '$298'][index]}</strong></p>)}</div></div></div>}

      {notice && <div className="toast"><span>✓</span>{notice}</div>}
    </div>
  )
}

export default App
