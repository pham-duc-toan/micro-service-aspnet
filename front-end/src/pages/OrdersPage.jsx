import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, RefreshCcw } from 'lucide-react'
import { Chip } from '../components/Chip'
import { Table } from '../components/Table'
import { ORDER_STATUS } from '../storefront/constants'
import { formatMoney, formatNumber } from '../storefront/format'
import { useStorefront } from '../storefront/StorefrontContext'

export function OrdersPage() {
  const { token, activeUserName, orders, selectedOrder, selectedOrderId, setSelectedOrderId, loadOrderById, loadOrders } = useStorefront()

  useEffect(() => {
    if (token && !orders.length) {
      void loadOrders(activeUserName)
    }
  }, [token, orders.length, activeUserName, loadOrders])

  return (
    <div className="pageStack">
      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Orders</h2>
            <p>Track live orders returned from the gateway.</p>
          </div>
          <div className="sectionTools">
            <Chip tone="info">{formatNumber(orders.length)} orders</Chip>
            <button type="button" className="ghostButton" onClick={() => loadOrders(activeUserName)} disabled={!token}>
              <RefreshCcw size={16} />
              <span>Reload</span>
            </button>
            <Link className="secondaryButton" to="/shop">
              Continue shopping
            </Link>
          </div>
        </div>

        {!token ? (
          <div className="emptyState large">
            <div>
              <strong>Sign in to view orders</strong>
              <p>Order history is available after authentication.</p>
              <Link className="secondaryButton" to="/account">
                Go to account
              </Link>
            </div>
          </div>
        ) : null}

        <div className="splitView">
          <div className="pane">
            <div className="orderList">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`orderRow ${String(selectedOrderId) === String(order.id) ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedOrderId(String(order.id))
                    void loadOrderById(order.id)
                  }}
                >
                  <div>
                    <strong>{order.documentNo || `Order ${order.id}`}</strong>
                    <p>{order.userName || activeUserName}</p>
                  </div>
                  <div className="orderRowMeta">
                    <Chip tone="neutral">{ORDER_STATUS[order.status] || `Status ${order.status}`}</Chip>
                    <strong>{formatMoney(order.totalPrice)}</strong>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pane">
            <div className="sectionHeader compact">
              <div>
                <h3>Selected order</h3>
                <p>Details loaded through the orders endpoint.</p>
              </div>
            </div>

            {selectedOrder ? (
              <Table
                rows={[
                  { key: 'Id', value: selectedOrder.id },
                  { key: 'Document', value: selectedOrder.documentNo },
                  { key: 'User', value: selectedOrder.userName },
                  { key: 'Total', value: formatMoney(selectedOrder.totalPrice) },
                  { key: 'Status', value: ORDER_STATUS[selectedOrder.status] || selectedOrder.status },
                  { key: 'Email', value: selectedOrder.emailAddress },
                  { key: 'Shipping', value: selectedOrder.shippingAddress },
                  { key: 'Invoice', value: selectedOrder.invoiceAddress },
                ]}
                empty="No order selected"
                columns={[
                  { key: 'key', label: 'Field' },
                  { key: 'value', label: 'Value' },
                ]}
              />
            ) : (
              <div className="emptyState large">
                <ClipboardList size={18} />
                <div>
                  <strong>No order selected</strong>
                  <p>Pick an order from the list to inspect it.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

