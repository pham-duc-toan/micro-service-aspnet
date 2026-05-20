import { ClipboardList, Edit3, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { Table } from '../../components/Table'
import { TextField } from '../../components/Field'
import { ORDER_STATUS } from '../../storefront/constants'
import { formatMoney } from '../../storefront/format'
import { useStorefront } from '../../storefront/StorefrontContext'

export function StudioOrdersPage() {
  const {
    adminOrders,
    orderAdminUser,
    setOrderAdminUser,
    orderAdminForm,
    setOrderAdminForm,
    setOrderAdminId,
    orderAdminDocumentNo,
    setOrderAdminDocumentNo,
    loadAdminOrders,
    createOrder,
    updateOrder,
    deleteOrderById,
    deleteOrderByDocument,
  } = useStorefront()

  function selectOrder(order) {
    setOrderAdminId(String(order.id || ''))
    setOrderAdminDocumentNo(order.documentNo || '')
    setOrderAdminUser(order.userName || orderAdminUser)
    setOrderAdminForm({
      id: String(order.id || ''),
      userName: order.userName || orderAdminUser,
      totalPrice: String(order.totalPrice ?? '0'),
      firstName: order.firstName || '',
      lastName: order.lastName || '',
      emailAddress: order.emailAddress || '',
      shippingAddress: order.shippingAddress || '',
      invoiceAddress: order.invoiceAddress || '',
    })
  }

  return (
    <div className="pageStack">
      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Orders</h2>
            <p>Maintain customer orders through the live gateway.</p>
          </div>
        </div>

        <div className="splitView">
          <div className="pane">
            <div className="formGrid">
              <TextField label="User name" value={orderAdminUser} onChange={setOrderAdminUser} />
              <TextField label="Order id" value={orderAdminForm.id} onChange={(value) => setOrderAdminForm((current) => ({ ...current, id: value }))} />
              <TextField label="Document no" value={orderAdminDocumentNo} onChange={setOrderAdminDocumentNo} />
              <TextField label="Total" type="number" value={orderAdminForm.totalPrice} onChange={(value) => setOrderAdminForm((current) => ({ ...current, totalPrice: value }))} />
              <TextField label="First name" value={orderAdminForm.firstName} onChange={(value) => setOrderAdminForm((current) => ({ ...current, firstName: value }))} />
              <TextField label="Last name" value={orderAdminForm.lastName} onChange={(value) => setOrderAdminForm((current) => ({ ...current, lastName: value }))} />
              <TextField label="Email" value={orderAdminForm.emailAddress} onChange={(value) => setOrderAdminForm((current) => ({ ...current, emailAddress: value }))} />
              <TextField label="Shipping" value={orderAdminForm.shippingAddress} onChange={(value) => setOrderAdminForm((current) => ({ ...current, shippingAddress: value }))} />
              <TextField label="Invoice" value={orderAdminForm.invoiceAddress} onChange={(value) => setOrderAdminForm((current) => ({ ...current, invoiceAddress: value }))} />
            </div>

            <div className="stackButtons">
              <button type="button" className="ghostButton" onClick={() => loadAdminOrders(orderAdminUser)}>
                <ClipboardList size={16} />
                <span>Load</span>
              </button>
              <button type="button" className="primaryButton" onClick={createOrder}>
                <Plus size={16} />
                <span>Create</span>
              </button>
              <button type="button" className="secondaryButton" onClick={updateOrder}>
                <RefreshCcw size={16} />
                <span>Update</span>
              </button>
              <button type="button" className="ghostButton danger" onClick={deleteOrderById}>
                <Trash2 size={16} />
                <span>Delete id</span>
              </button>
              <button type="button" className="ghostButton danger" onClick={deleteOrderByDocument}>
                <Trash2 size={16} />
                <span>Delete doc</span>
              </button>
            </div>
          </div>

          <div className="pane">
            <Table
              rows={adminOrders}
              empty="No admin orders loaded"
              columns={[
                { key: 'documentNo', label: 'Doc no' },
                { key: 'userName', label: 'User' },
                { key: 'totalPrice', label: 'Total', render: (row) => formatMoney(row.totalPrice) },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => ORDER_STATUS[row.status] || `Status ${row.status}`,
                },
                {
                  key: 'actions',
                  label: '',
                  render: (row) => (
                    <div className="tableActions">
                      <button type="button" className="iconButton" onClick={() => selectOrder(row)} title="Edit">
                        <Edit3 size={14} />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
