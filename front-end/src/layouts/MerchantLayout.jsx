import { Link, NavLink, Outlet } from 'react-router-dom'
import { LogOut, Package, ShieldCheck, Store } from 'lucide-react'
import { ADMIN_NAV } from '../storefront/constants'
import { useStorefront } from '../storefront/StorefrontContext'

export function MerchantLayout() {
  const { activeDisplayName, token, logout } = useStorefront()

  return (
    <div className="storeShell studioShell">
      <aside className="sideRail">
        <div className="brandPane">
          <div className="brandMark large">
            <Store size={18} />
          </div>
          <div>
            <strong>Merchant center</strong>
            <span>{activeDisplayName}</span>
          </div>
        </div>

        <nav className="sideNav">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon
            const locked = item.id !== 'studio' && !token
            return (
              <NavLink key={item.id} to={item.to} className={({ isActive }) => `sideLink ${isActive ? 'active' : ''} ${locked ? 'locked' : ''}`}>
                <Icon size={16} />
                <span>{item.label}</span>
                {locked ? <em>Locked</em> : null}
              </NavLink>
            )
          })}
        </nav>

        <div className="sideBlock muted">
          <span className="sideKicker">Access</span>
          <strong>Administrator studio</strong>
          <p>Catalog, inventory, orders, access, and jobs.</p>
          {token ? (
            <button type="button" className="ghostButton danger" onClick={logout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          ) : (
            <Link className="secondaryButton" to="/account">
              <ShieldCheck size={16} />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </aside>

      <div className="storeFrame">
        <header className="shopHeader">
          <div>
            <strong className="eyebrowLabel">Studio</strong>
            <h1 className="pageTitle">Operations</h1>
          </div>
          <div className="headerActions">
            <Link className="ghostButton" to="/shop">
              <Package size={16} />
              <span>Back to shop</span>
            </Link>
          </div>
        </header>

        <main className="storeMain">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
