import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Filter, LogIn, LogOut, Search, ShoppingBag, Sparkles, User } from 'lucide-react'
import { COLLECTIONS, STORE_NAV_ITEMS } from '../storefront/constants'
import { useStorefront } from '../storefront/StorefrontContext'

export function StorefrontLayout() {
  const navigate = useNavigate()
  const { token, activeDisplayName, cartCount, productQuery, setProductQuery, refreshStorefront, logout, can } = useStorefront()

  function submitSearch(event) {
    event.preventDefault()
    navigate('/shop')
  }

  function applyCollection(query) {
    setProductQuery(query)
    navigate('/shop')
  }

  return (
    <div className="storeShell">
      <aside className="sideRail">
        <Link className="brandPane" to="/">
          <div className="brandMark large">
            <ShoppingBag size={18} />
          </div>
          <div>
            <strong>Nova Atelier</strong>
            <span>Modern clothing boutique</span>
          </div>
        </Link>

        <nav className="sideNav">
          {STORE_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.id} to={item.to} className={({ isActive }) => `sideLink ${isActive ? 'active' : ''}`}>
                <Icon size={16} />
                <span>{item.label}</span>
                {item.id === 'cart' && cartCount > 0 ? <em>{cartCount}</em> : null}
              </NavLink>
            )
          })}
        </nav>

        <div className="sideBlock">
          <span className="sideKicker">Collections</span>
          <div className="collectionStack">
            {COLLECTIONS.map((collection) => (
              <button key={collection.id} type="button" className="collectionLink" onClick={() => applyCollection(collection.query)}>
                <span>{collection.label}</span>
                <Filter size={14} />
              </button>
            ))}
          </div>
        </div>

        <div className="sideBlock muted">
          <span className="sideKicker">Account</span>
          <strong>{token ? activeDisplayName : 'Guest checkout is available after sign in'}</strong>
          <p>Save carts, review orders, and unlock merchant tools.</p>
          <div className="sideActions">
            <Link className="secondaryButton" to="/account">
              {token ? <User size={16} /> : <LogIn size={16} />}
              <span>{token ? 'Account' : 'Sign in'}</span>
            </Link>
            {token ? (
              <button type="button" className="ghostButton danger" onClick={logout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            ) : null}
          </div>
        </div>

        {token && can('PRODUCT', 'VIEW') ? (
          <Link className="studioLink" to="/studio">
            <Sparkles size={16} />
            <span>Merchant center</span>
          </Link>
        ) : null}
      </aside>

      <div className="storeFrame">
        <header className="shopHeader">
          <form className="headerSearch" onSubmit={submitSearch}>
            <Search size={16} />
            <input
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              placeholder="Search jackets, dresses, denim..."
            />
          </form>

          <div className="headerActions">
            <button type="button" className="ghostButton" onClick={() => navigate('/cart')}>
              <ShoppingBag size={16} />
              <span>{cartCount ? `Cart (${cartCount})` : 'Cart'}</span>
            </button>
            <button type="button" className="ghostButton" onClick={refreshStorefront} disabled={!token}>
              <Filter size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <main className="storeMain">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
