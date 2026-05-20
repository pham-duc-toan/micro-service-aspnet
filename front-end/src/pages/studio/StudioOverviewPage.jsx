import { useEffect } from 'react'
import { Boxes, ClipboardList, Mail, Package, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Chip } from '../../components/Chip'
import { formatNumber } from '../../storefront/format'
import { useStorefront } from '../../storefront/StorefrontContext'

export function StudioOverviewPage() {
  const { token, activeUserName, productCount, orderCount, cartCount, totalInventoryMoves, permissions, adminOrders, products, loadAdminOrders } = useStorefront()

  useEffect(() => {
    if (token && !adminOrders.length) {
      void loadAdminOrders(activeUserName)
    }
  }, [token, adminOrders.length, activeUserName, loadAdminOrders])

  const shortcuts = [
    { label: 'Catalog', to: '/studio/catalog', icon: Package },
    { label: 'Inventory', to: '/studio/inventory', icon: Boxes },
    { label: 'Orders', to: '/studio/orders', icon: ClipboardList },
    { label: 'Access', to: '/studio/access', icon: ShieldCheck },
    { label: 'Jobs', to: '/studio/jobs', icon: Mail },
  ]

  return (
    <div className="pageStack">
      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Merchant center</h2>
            <p>Operate the live catalog, orders, access rules, inventory, and jobs.</p>
          </div>
          <Chip tone="info">
            <Sparkles size={14} />
            Studio
          </Chip>
        </div>

        <div className="statGrid">
          <div className="statCard">
            <span>Catalog</span>
            <strong>{formatNumber(productCount)}</strong>
          </div>
          <div className="statCard">
            <span>Orders</span>
            <strong>{formatNumber(orderCount)}</strong>
          </div>
          <div className="statCard">
            <span>Cart items</span>
            <strong>{formatNumber(cartCount)}</strong>
          </div>
          <div className="statCard">
            <span>Permissions</span>
            <strong>{formatNumber(permissions.length)}</strong>
          </div>
          <div className="statCard">
            <span>Inventory moves</span>
            <strong>{formatNumber(totalInventoryMoves)}</strong>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Shortcuts</h2>
            <p>Jump straight to the module you need.</p>
          </div>
        </div>

        <div className="shortcutGrid">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon
            return (
              <Link key={shortcut.to} to={shortcut.to} className="shortcutCard">
                <Icon size={18} />
                <strong>{shortcut.label}</strong>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="band">
        <div className="splitView">
          <div className="pane">
            <div className="sectionHeader compact">
              <div>
                <h3>Latest products</h3>
                <p>The current top of the catalog.</p>
              </div>
            </div>
            <div className="listStack">
              {products.slice(0, 4).map((product) => (
                <div key={product.no} className="listRow">
                  <strong>{product.name}</strong>
                  <span>{product.no}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pane">
            <div className="sectionHeader compact">
              <div>
                <h3>Recent orders</h3>
                <p>Most recent items returned by the order API.</p>
              </div>
            </div>
            <div className="listStack">
              {adminOrders.slice(0, 4).map((order) => (
                <div key={order.id} className="listRow">
                  <strong>{order.documentNo || `Order ${order.id}`}</strong>
                  <span>{order.userName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
