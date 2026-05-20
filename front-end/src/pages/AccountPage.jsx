import { Copy, LogIn, LogOut, RefreshCcw, Sparkles, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LOGIN_DEFAULTS } from '../storefront/constants'
import { Table } from '../components/Table'
import { TextField } from '../components/Field'
import { initialsFromName } from '../storefront/format'
import { useStorefront } from '../storefront/StorefrontContext'

export function AccountPage() {
  const {
    token,
    account,
    customer,
    authForm,
    setAuthForm,
    login,
    logout,
    refreshStorefront,
    copyToken,
    can,
    activeDisplayName,
    activeUserName,
  } = useStorefront()

  if (!token) {
    return (
      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Account</h2>
            <p>Sign in to unlock basket, orders, and merchant tools.</p>
          </div>
          <div className="sectionTools">
            <Link className="secondaryButton" to="/shop">
              Browse shop
            </Link>
          </div>
        </div>

        <div className="pane authPane">
          <div className="profileHero">
            <div className="avatar">
              <User size={18} />
            </div>
            <div>
              <strong>Guest session</strong>
              <p>Use the seeded credentials from the backend environment.</p>
            </div>
          </div>

          <div className="formGrid">
            <TextField label="Username" value={authForm.username} onChange={(value) => setAuthForm((current) => ({ ...current, username: value }))} />
            <TextField label="Password" type="password" value={authForm.password} onChange={(value) => setAuthForm((current) => ({ ...current, password: value }))} />
            <TextField label="Client id" value={authForm.clientId} onChange={(value) => setAuthForm((current) => ({ ...current, clientId: value }))} />
            <TextField label="Client secret" type="password" value={authForm.clientSecret} onChange={(value) => setAuthForm((current) => ({ ...current, clientSecret: value }))} />
          </div>

          <div className="stackButtons">
            <button type="button" className="primaryButton" onClick={login}>
              <LogIn size={16} />
              <span>Sign in</span>
            </button>
            <button type="button" className="secondaryButton" onClick={() => setAuthForm(LOGIN_DEFAULTS)}>
              Reset
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="band">
      <div className="sectionHeader">
        <div>
          <h2>Account</h2>
          <p>Identity details and merchant access for the current session.</p>
        </div>
        <div className="sectionTools">
          <Link className="ghostButton" to="/shop">
            Shop
          </Link>
          {can('PRODUCT', 'VIEW') ? (
            <Link className="secondaryButton" to="/studio">
              <Sparkles size={16} />
              <span>Merchant center</span>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="pane authPane">
        <div className="profileHero">
          <div className="avatar">{initialsFromName(activeDisplayName)}</div>
          <div>
            <strong>{activeDisplayName}</strong>
            <p>{account?.email || customer?.emailAddress || activeUserName}</p>
          </div>
        </div>

        <div className="summaryBox">
          <div>
            <span>User</span>
            <strong>{account?.userName || activeUserName}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{account?.email || customer?.emailAddress || '-'}</strong>
          </div>
          <div>
            <span>Profile</span>
            <strong>{customer?.emailAddress || 'n/a'}</strong>
          </div>
        </div>

        <div className="stackButtons">
          <button type="button" className="secondaryButton" onClick={copyToken}>
            <Copy size={16} />
            <span>Copy token</span>
          </button>
          <button type="button" className="ghostButton" onClick={refreshStorefront}>
            <RefreshCcw size={16} />
            <span>Refresh</span>
          </button>
          <button type="button" className="ghostButton danger" onClick={logout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        <Table
          rows={[
            { key: 'Display name', value: activeDisplayName },
            { key: 'User name', value: account?.userName || activeUserName },
            { key: 'Identity email', value: account?.email || '-' },
            { key: 'Customer email', value: customer?.emailAddress || '-' },
          ]}
          empty="No account data"
          columns={[
            { key: 'key', label: 'Field' },
            { key: 'value', label: 'Value' },
          ]}
        />
      </div>
    </section>
  )
}

