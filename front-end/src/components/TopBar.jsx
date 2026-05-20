import { LogIn, LogOut, RefreshCcw, User } from 'lucide-react'
import { NAV_ITEMS } from '../storefront/constants'

export function TopBar({ token, activeDisplayName, cartCount, view, onNavigate, onOpenAccount, onOpenAuth, onRefresh, onLogout }) {
  return (
    <header className="topbar">
      <div className="brandBlock">
        <div className="brandMark">
          <span>N</span>
        </div>
        <div className="brandText">
          <strong>Nova Market</strong>
          <span>{token ? activeDisplayName : 'Sign in to shop'}</span>
        </div>
      </div>

      <nav className="navRow">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = view === item.id
          return (
            <button key={item.id} type="button" className={`navButton ${active ? 'active' : ''}`} onClick={() => onNavigate(item.id)}>
              <Icon size={16} />
              <span>{item.label}</span>
              {item.id === 'cart' && cartCount > 0 ? <em>{cartCount}</em> : null}
            </button>
          )
        })}
      </nav>

      <div className="topActions">
        <button type="button" className="ghostButton" onClick={() => (token ? onOpenAccount() : onOpenAuth())}>
          {token ? <User size={16} /> : <LogIn size={16} />}
          <span>{token ? 'Account' : 'Sign in'}</span>
        </button>
        <button type="button" className="ghostButton" onClick={onRefresh} disabled={!token}>
          <RefreshCcw size={16} />
          <span>Reload</span>
        </button>
        {token ? (
          <button type="button" className="ghostButton danger" onClick={onLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        ) : null}
      </div>
    </header>
  )
}
