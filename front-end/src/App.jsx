import { useMemo, useState } from 'react'
import {
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Database,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Package,
  Play,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBasket,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import './App.css'

const IDENTITY_URL = import.meta.env.VITE_IDENTITY_URL || 'http://localhost:6011'
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:6001'
const ADMIN_ROLE_ID = 'b6105f01-18f5-433c-91e0-dbd80d27e7f4'

const navItems = [
  { id: 'overview', label: 'Overview', icon: BriefcaseBusiness },
  { id: 'identity', label: 'Identity', icon: ShieldCheck },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'basket', label: 'Basket', icon: ShoppingBasket },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Mail },
]

const defaultCredentials = {
  username: 'alicesmith@example.com',
  password: 'alice123',
  clientId: 'tedu_microservices_postman',
  clientSecret: 'SuperStrongSecret',
}

const productSeed = {
  no: `FE-${Date.now()}`,
  name: 'Frontend Test Product',
  summary: 'Created from React dashboard',
  description: 'React Vite API dashboard item',
  price: 19.9,
}

const orderSeed = {
  userName: 'customer1',
  totalPrice: 42.42,
  firstName: 'customer1',
  lastName: 'customer',
  emailAddress: 'customer1@local.com',
  shippingAddress: 'Wollongong',
  invoiceAddress: 'Australia',
}

function defaultEmailJob() {
  return {
    email: 'customer1@local.com',
    subject: 'Reminder',
    content: 'Hello from the dashboard',
    enqueue: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  }
}

function asText(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getOrderPayload(form, includeUserName) {
  const payload = {
    totalPrice: Number(form.totalPrice),
    firstName: form.firstName,
    lastName: form.lastName,
    emailAddress: form.emailAddress,
    shippingAddress: form.shippingAddress,
    invoiceAddress: form.invoiceAddress,
  }
  if (includeUserName) payload.userName = form.userName
  return payload
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="field wide">
      <span>{label}</span>
      <textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function JsonBlock({ value }) {
  return <pre className="json">{JSON.stringify(value ?? null, null, 2)}</pre>
}

function DataTable({ rows, columns, empty = 'No data' }) {
  const items = Array.isArray(rows) ? rows : rows ? [rows] : []
  if (items.length === 0) return <div className="empty">{empty}</div>

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => (
            <tr key={row.id || row.documentNo || row.no || index}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : asText(row[column.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function App() {
  const [active, setActive] = useState('overview')
  const [credentials, setCredentials] = useState(defaultCredentials)
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || '')
  const [busy, setBusy] = useState('')
  const [logs, setLogs] = useState([])
  const [account, setAccount] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [roleId, setRoleId] = useState(ADMIN_ROLE_ID)
  const [permissionForm, setPermissionForm] = useState({ function: 'PRODUCT', command: 'VIEW' })
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productForm, setProductForm] = useState(productSeed)
  const [productNoSearch, setProductNoSearch] = useState('Lotus')
  const [inventoryRows, setInventoryRows] = useState([])
  const [inventoryForm, setInventoryForm] = useState({ itemNo: 'Lotus', quantity: 5, externalDocNo: 'EXT-001' })
  const [inventoryId, setInventoryId] = useState('')
  const [basket, setBasket] = useState(null)
  const [basketForm, setBasketForm] = useState({
    username: 'customer1',
    emailAddress: 'customer1@local.com',
    itemNo: 'Lotus',
    itemName: 'Esprit',
    quantity: 1,
    itemPrice: 177940.49,
  })
  const [orderRows, setOrderRows] = useState([])
  const [orderForm, setOrderForm] = useState(orderSeed)
  const [orderId, setOrderId] = useState('')
  const [documentNo, setDocumentNo] = useState('')
  const [customer, setCustomer] = useState(null)
  const [customerName, setCustomerName] = useState('customer1')
  const [jobId, setJobId] = useState('')
  const [emailJob, setEmailJob] = useState(defaultEmailJob)

  const authStatus = useMemo(() => (token ? 'Authenticated' : 'No token'), [token])

  function addLog(entry) {
    setLogs((current) => [{ time: new Date().toLocaleTimeString(), ...entry }, ...current].slice(0, 30))
  }

  async function request(name, path, options = {}) {
    const baseUrl = options.identity ? IDENTITY_URL : GATEWAY_URL
    const url = path.startsWith('http') ? path : `${baseUrl}${path}`
    const headers = new Headers(options.headers || {})
    if (options.body !== undefined) headers.set('Content-Type', 'application/json')
    if (token && options.auth !== false) headers.set('Authorization', `Bearer ${token}`)

    setBusy(name)
    const started = performance.now()
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      })
      const contentType = response.headers.get('content-type') || ''
      const raw = await response.text()
      const data = contentType.includes('application/json') && raw ? JSON.parse(raw) : raw
      const elapsed = Math.round(performance.now() - started)
      addLog({ name, method: options.method || 'GET', url, status: response.status, elapsed, ok: response.ok })
      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : JSON.stringify(data))
      }
      return data
    } finally {
      setBusy('')
    }
  }

  async function login() {
    setBusy('Login')
    try {
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        username: credentials.username,
        password: credentials.password,
        scope: 'openid profile email roles tedu_microservices_api.read tedu_microservices_api.write',
      })
      const response = await fetch(`${IDENTITY_URL}/connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      const data = await response.json()
      addLog({ name: 'Login', method: 'POST', url: `${IDENTITY_URL}/connect/token`, status: response.status, ok: response.ok })
      if (!response.ok) throw new Error(JSON.stringify(data))
      localStorage.setItem('access_token', data.access_token)
      setToken(data.access_token)
    } finally {
      setBusy('')
    }
  }

  function logout() {
    localStorage.removeItem('access_token')
    setToken('')
    setAccount(null)
  }

  async function loadAccount() {
    const data = await request('Account', '/api/account', { identity: true })
    setAccount(data)
  }

  async function loadPermissions() {
    const data = await request('Permissions', `/api/permissions/roles/${roleId}`, { identity: true })
    setPermissions(data)
  }

  async function addPermission() {
    await request('Add permission', `/api/permissions/roles/${roleId}`, {
      identity: true,
      method: 'POST',
      body: permissionForm,
    })
    await loadPermissions()
  }

  async function deletePermission(row) {
    await request('Delete permission', `/api/permissions/roles/${roleId}/function/${row.function}/command/${row.command}`, {
      identity: true,
      method: 'DELETE',
    })
    await loadPermissions()
  }

  async function loadProducts() {
    setProducts(await request('Products', '/products'))
  }

  async function createProduct() {
    const payload = { ...productForm, price: Number(productForm.price) }
    const data = await request('Create product', '/products', { method: 'POST', body: payload })
    setSelectedProduct(data)
    await loadProducts()
  }

  async function updateProduct() {
    if (!selectedProduct?.id) return
    const payload = {
      name: productForm.name,
      summary: productForm.summary,
      description: productForm.description,
      price: productForm.price,
    }
    const data = await request('Update product', `/products/${selectedProduct.id}`, {
      method: 'PUT',
      body: { ...payload, price: Number(payload.price) },
    })
    setSelectedProduct(data)
    await loadProducts()
  }

  async function findProductByNo() {
    const data = await request('Product by no', `/products/get-product-by-no/${productNoSearch}`)
    setSelectedProduct(data)
    setProductForm({
      no: data.no || '',
      name: data.name || '',
      summary: data.summary || '',
      description: data.description || '',
      price: data.price || 0,
    })
  }

  async function deleteProduct(id) {
    await request('Delete product', `/products/${id}`, { method: 'DELETE' })
    if (selectedProduct?.id === id) setSelectedProduct(null)
    await loadProducts()
  }

  async function loadInventory() {
    setInventoryRows(await request('Inventory list', `/inventory/items/${inventoryForm.itemNo}`, { auth: false }))
  }

  async function purchaseInventory() {
    const data = await request('Purchase inventory', `/inventory/purchase/${inventoryForm.itemNo}`, {
      method: 'POST',
      body: { quantity: Number(inventoryForm.quantity) },
    })
    setInventoryId(data.id || '')
    await loadInventory()
  }

  async function saleInventory() {
    const data = await request('Sale inventory', `/inventory/sales/${inventoryForm.itemNo}`, {
      method: 'POST',
      body: { externalDocNo: inventoryForm.externalDocNo, quantity: Number(inventoryForm.quantity) },
    })
    setInventoryId(data.id || '')
    await loadInventory()
  }

  async function saleOrderInventory() {
    await request('Sale order inventory', `/inventory/sales/order-no/${documentNo || `ORD-${Date.now()}`}`, {
      method: 'POST',
      body: { saleItems: [{ itemNo: inventoryForm.itemNo, quantity: Number(inventoryForm.quantity) }] },
    })
    await loadInventory()
  }

  async function deleteInventoryEntry(id = inventoryId) {
    if (!id) return
    await request('Delete inventory', `/inventory/${id}`, { method: 'DELETE' })
    setInventoryId('')
    await loadInventory()
  }

  async function getBasket() {
    setBasket(await request('Get basket', `/baskets/${basketForm.username}`))
  }

  async function updateBasket() {
    const body = {
      username: basketForm.username,
      emailAddress: basketForm.emailAddress,
      items: [
        {
          quantity: Number(basketForm.quantity),
          itemPrice: Number(basketForm.itemPrice),
          itemNo: basketForm.itemNo,
          itemName: basketForm.itemName,
        },
      ],
    }
    setBasket(await request('Update basket', '/baskets', { method: 'POST', body }))
  }

  async function checkoutBasket() {
    await request('Checkout basket', '/baskets/checkout', {
      method: 'POST',
      body: {
        userName: basketForm.username,
        firstName: 'customer1',
        lastName: 'customer',
        emailAddress: basketForm.emailAddress,
        shippingAddress: 'Wollongong',
        invoiceAddress: 'Australia',
      },
    })
    setBasket(null)
  }

  async function deleteBasket() {
    await request('Delete basket', `/baskets/${basketForm.username}`, { method: 'DELETE' })
    setBasket(null)
  }

  async function loadOrders() {
    const data = await request('Orders by user', `/v1/orders/${orderForm.userName}`)
    setOrderRows(data.data || data)
  }

  async function createOrder() {
    const data = await request('Create order', '/v1/orders', {
      method: 'POST',
      body: getOrderPayload(orderForm, true),
    })
    setOrderId(String(data.data || ''))
    await loadOrders()
  }

  async function getOrderById() {
    if (!orderId) return
    const data = await request('Order by id', `/v1/orders/by-id/${orderId}`)
    const order = data.data || data
    setDocumentNo(order.documentNo || '')
    setOrderRows([order])
  }

  async function updateOrder() {
    if (!orderId) return
    await request('Update order', `/v1/orders/${orderId}`, {
      method: 'PUT',
      body: getOrderPayload(orderForm, false),
    })
    await getOrderById()
  }

  async function deleteOrderById() {
    if (!orderId) return
    await request('Delete order', `/v1/orders/${orderId}`, { method: 'DELETE' })
    setOrderId('')
    await loadOrders()
  }

  async function deleteOrderByDocument() {
    if (!documentNo) return
    await request('Delete order document', `/v1/orders/document-no/${documentNo}`, { method: 'DELETE' })
    setDocumentNo('')
    await loadOrders()
  }

  async function loadCustomer() {
    const data = await request('Customer', `/customers/${customerName}`)
    setCustomer(data.value || data)
  }

  async function sendEmailJob() {
    const data = await request('Schedule email', '/schedule-job/send-email', { method: 'POST', body: emailJob })
    setJobId(String(data))
  }

  async function deleteJob() {
    const data = await request('Delete job', `/schedule-job/delete/jobId/${jobId || 'not-a-real-job'}`, { method: 'DELETE' })
    addLog({ name: 'Delete job result', method: 'RESULT', url: jobId || 'not-a-real-job', status: data ? 200 : 404, ok: true })
  }

  async function runWelcome(action) {
    await request(`Job ${action}`, `/welcome/${action}`, { method: 'POST', body: {} })
  }

  const activeLabel = navItems.find((item) => item.id === active)?.label || 'Overview'

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Database size={24} />
          <div>
            <strong>Microservices</strong>
            <span>{authStatus}</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => setActive(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <h1>{activeLabel}</h1>
            <span>{GATEWAY_URL}</span>
          </div>
          <div className="topActions">
            {busy && (
              <span className="busy">
                <Loader2 size={16} className="spin" /> {busy}
              </span>
            )}
            <button onClick={() => window.open(`${GATEWAY_URL}/swagger`, '_blank')}>Swagger</button>
            <button onClick={logout}>
              <Lock size={16} /> Logout
            </button>
          </div>
        </header>

        {active === 'overview' && (
          <section className="contentGrid">
            <div className="panel">
              <div className="panelTitle">
                <CheckCircle2 size={18} />
                <h2>Stack</h2>
              </div>
              <div className="statGrid">
                <div><span>Identity</span><strong>{IDENTITY_URL}</strong></div>
                <div><span>Gateway</span><strong>{GATEWAY_URL}</strong></div>
                <div><span>User</span><strong>{account?.userName || credentials.username}</strong></div>
                <div><span>Role</span><strong>Administrator</strong></div>
              </div>
              <div className="buttonRow">
                <button onClick={loadProducts}><RefreshCcw size={16} /> Products</button>
                <button onClick={loadInventory}><RefreshCcw size={16} /> Inventory</button>
                <button onClick={loadOrders}><RefreshCcw size={16} /> Orders</button>
              </div>
            </div>
            <div className="panel">
              <div className="panelTitle">
                <ClipboardList size={18} />
                <h2>Request Log</h2>
              </div>
              <LogList logs={logs} />
            </div>
          </section>
        )}

        {active === 'identity' && (
          <section className="contentGrid">
            <div className="panel">
              <div className="panelTitle">
                <KeyRound size={18} />
                <h2>Token</h2>
              </div>
              <div className="formGrid">
                <Field label="Username" value={credentials.username} onChange={(v) => setCredentials({ ...credentials, username: v })} />
                <Field label="Password" type="password" value={credentials.password} onChange={(v) => setCredentials({ ...credentials, password: v })} />
                <Field label="Client id" value={credentials.clientId} onChange={(v) => setCredentials({ ...credentials, clientId: v })} />
                <Field label="Client secret" type="password" value={credentials.clientSecret} onChange={(v) => setCredentials({ ...credentials, clientSecret: v })} />
              </div>
              <div className="buttonRow">
                <button onClick={login}><KeyRound size={16} /> Login</button>
                <button onClick={loadAccount}><User size={16} /> Account</button>
              </div>
              <JsonBlock value={account} />
            </div>
            <div className="panel">
              <div className="panelTitle">
                <ShieldCheck size={18} />
                <h2>Permissions</h2>
              </div>
              <div className="formGrid">
                <Field label="Role id" value={roleId} onChange={setRoleId} />
                <Field label="Function" value={permissionForm.function} onChange={(v) => setPermissionForm({ ...permissionForm, function: v })} />
                <Field label="Command" value={permissionForm.command} onChange={(v) => setPermissionForm({ ...permissionForm, command: v })} />
              </div>
              <div className="buttonRow">
                <button onClick={loadPermissions}><RefreshCcw size={16} /> Load</button>
                <button onClick={addPermission}><Send size={16} /> Add</button>
              </div>
              <DataTable
                rows={permissions}
                columns={[
                  { key: 'function', label: 'Function' },
                  { key: 'command', label: 'Command' },
                  { key: 'actions', label: '', render: (row) => <button className="iconBtn" onClick={() => deletePermission(row)}><Trash2 size={15} /></button> },
                ]}
              />
            </div>
          </section>
        )}

        {active === 'products' && (
          <section className="contentGrid">
            <div className="panel widePanel">
              <div className="panelTitle">
                <Package size={18} />
                <h2>Catalog</h2>
              </div>
              <div className="buttonRow">
                <button onClick={loadProducts}><RefreshCcw size={16} /> Load</button>
                <input value={productNoSearch} onChange={(e) => setProductNoSearch(e.target.value)} />
                <button onClick={findProductByNo}><Search size={16} /> Find no</button>
              </div>
              <DataTable
                rows={products}
                columns={[
                  { key: 'id', label: 'Id' },
                  { key: 'no', label: 'No' },
                  { key: 'name', label: 'Name' },
                  { key: 'price', label: 'Price' },
                  { key: 'actions', label: '', render: (row) => <button className="iconBtn" onClick={() => deleteProduct(row.id)}><Trash2 size={15} /></button> },
                ]}
              />
            </div>
            <div className="panel">
              <div className="panelTitle">
                <Send size={18} />
                <h2>Product Form</h2>
              </div>
              <ProductForm form={productForm} setForm={setProductForm} />
              <div className="buttonRow">
                <button onClick={createProduct}><Send size={16} /> Create</button>
                <button onClick={updateProduct}><RefreshCcw size={16} /> Update</button>
              </div>
              <JsonBlock value={selectedProduct} />
            </div>
          </section>
        )}

        {active === 'inventory' && (
          <section className="contentGrid">
            <div className="panel">
              <div className="panelTitle">
                <Boxes size={18} />
                <h2>Inventory</h2>
              </div>
              <div className="formGrid">
                <Field label="Item no" value={inventoryForm.itemNo} onChange={(v) => setInventoryForm({ ...inventoryForm, itemNo: v })} />
                <Field label="Quantity" type="number" value={inventoryForm.quantity} onChange={(v) => setInventoryForm({ ...inventoryForm, quantity: v })} />
                <Field label="External doc" value={inventoryForm.externalDocNo} onChange={(v) => setInventoryForm({ ...inventoryForm, externalDocNo: v })} />
                <Field label="Entry id" value={inventoryId} onChange={setInventoryId} />
              </div>
              <div className="buttonRow">
                <button onClick={loadInventory}><RefreshCcw size={16} /> Load</button>
                <button onClick={purchaseInventory}><Send size={16} /> Purchase</button>
                <button onClick={saleInventory}><Send size={16} /> Sale</button>
                <button onClick={saleOrderInventory}><Send size={16} /> Sale order</button>
                <button onClick={() => deleteInventoryEntry()}><Trash2 size={16} /> Delete</button>
              </div>
            </div>
            <div className="panel widePanel">
              <DataTable
                rows={inventoryRows}
                columns={[
                  { key: 'id', label: 'Id' },
                  { key: 'itemNo', label: 'Item' },
                  { key: 'quantity', label: 'Qty' },
                  { key: 'documentType', label: 'Type' },
                  { key: 'actions', label: '', render: (row) => <button className="iconBtn" onClick={() => deleteInventoryEntry(row.id)}><Trash2 size={15} /></button> },
                ]}
              />
            </div>
          </section>
        )}

        {active === 'basket' && (
          <section className="contentGrid">
            <div className="panel">
              <div className="panelTitle">
                <ShoppingBasket size={18} />
                <h2>Basket</h2>
              </div>
              <div className="formGrid">
                <Field label="Username" value={basketForm.username} onChange={(v) => setBasketForm({ ...basketForm, username: v })} />
                <Field label="Email" value={basketForm.emailAddress} onChange={(v) => setBasketForm({ ...basketForm, emailAddress: v })} />
                <Field label="Item no" value={basketForm.itemNo} onChange={(v) => setBasketForm({ ...basketForm, itemNo: v })} />
                <Field label="Item name" value={basketForm.itemName} onChange={(v) => setBasketForm({ ...basketForm, itemName: v })} />
                <Field label="Quantity" type="number" value={basketForm.quantity} onChange={(v) => setBasketForm({ ...basketForm, quantity: v })} />
                <Field label="Price" type="number" value={basketForm.itemPrice} onChange={(v) => setBasketForm({ ...basketForm, itemPrice: v })} />
              </div>
              <div className="buttonRow">
                <button onClick={getBasket}><RefreshCcw size={16} /> Get</button>
                <button onClick={updateBasket}><Send size={16} /> Save</button>
                <button onClick={checkoutBasket}><CheckCircle2 size={16} /> Checkout</button>
                <button onClick={deleteBasket}><Trash2 size={16} /> Delete</button>
                <button onClick={() => request('Basket email', '/baskets/email', { method: 'POST', body: {} })}><Mail size={16} /> Template</button>
              </div>
            </div>
            <div className="panel">
              <JsonBlock value={basket} />
            </div>
          </section>
        )}

        {active === 'orders' && (
          <section className="contentGrid">
            <div className="panel">
              <div className="panelTitle">
                <ClipboardList size={18} />
                <h2>Order Form</h2>
              </div>
              <OrderForm form={orderForm} setForm={setOrderForm} />
              <div className="formGrid">
                <Field label="Order id" value={orderId} onChange={setOrderId} />
                <Field label="Document no" value={documentNo} onChange={setDocumentNo} />
              </div>
              <div className="buttonRow">
                <button onClick={loadOrders}><RefreshCcw size={16} /> List</button>
                <button onClick={createOrder}><Send size={16} /> Create</button>
                <button onClick={getOrderById}><Search size={16} /> By id</button>
                <button onClick={updateOrder}><RefreshCcw size={16} /> Update</button>
                <button onClick={deleteOrderById}><Trash2 size={16} /> Delete id</button>
                <button onClick={deleteOrderByDocument}><Trash2 size={16} /> Delete doc</button>
              </div>
            </div>
            <div className="panel widePanel">
              <DataTable
                rows={orderRows}
                columns={[
                  { key: 'id', label: 'Id' },
                  { key: 'documentNo', label: 'Document' },
                  { key: 'userName', label: 'User' },
                  { key: 'totalPrice', label: 'Total' },
                  { key: 'status', label: 'Status' },
                ]}
              />
            </div>
          </section>
        )}

        {active === 'customers' && (
          <section className="contentGrid">
            <div className="panel">
              <div className="panelTitle">
                <Users size={18} />
                <h2>Customer</h2>
              </div>
              <div className="buttonRow">
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                <button onClick={loadCustomer}><Search size={16} /> Load</button>
              </div>
              <JsonBlock value={customer} />
            </div>
          </section>
        )}

        {active === 'jobs' && (
          <section className="contentGrid">
            <div className="panel">
              <div className="panelTitle">
                <Mail size={18} />
                <h2>Schedule Email</h2>
              </div>
              <div className="formGrid">
                <Field label="Email" value={emailJob.email} onChange={(v) => setEmailJob({ ...emailJob, email: v })} />
                <Field label="Subject" value={emailJob.subject} onChange={(v) => setEmailJob({ ...emailJob, subject: v })} />
                <Field label="Enqueue" value={emailJob.enqueue} onChange={(v) => setEmailJob({ ...emailJob, enqueue: v })} />
                <Field label="Job id" value={jobId} onChange={setJobId} />
                <TextArea label="Content" value={emailJob.content} onChange={(v) => setEmailJob({ ...emailJob, content: v })} />
              </div>
              <div className="buttonRow">
                <button onClick={sendEmailJob}><Send size={16} /> Schedule</button>
                <button onClick={deleteJob}><Trash2 size={16} /> Delete</button>
              </div>
            </div>
            <div className="panel">
              <div className="panelTitle">
                <Play size={18} />
                <h2>Welcome Jobs</h2>
              </div>
              <div className="buttonGrid">
                <button onClick={() => runWelcome('welcome')}>Welcome</button>
                <button onClick={() => runWelcome('delayedwelcome')}>Delayed</button>
                <button onClick={() => runWelcome('welcomeat')}>At time</button>
                <button onClick={() => runWelcome('confirmedwelcome')}>Confirmed</button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function ProductForm({ form, setForm }) {
  return (
    <div className="formGrid">
      <Field label="No" value={form.no} onChange={(v) => setForm({ ...form, no: v })} />
      <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <Field label="Summary" value={form.summary} onChange={(v) => setForm({ ...form, summary: v })} />
      <Field label="Price" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
      <TextArea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
    </div>
  )
}

function OrderForm({ form, setForm }) {
  return (
    <div className="formGrid">
      <Field label="Username" value={form.userName} onChange={(v) => setForm({ ...form, userName: v })} />
      <Field label="Total" type="number" value={form.totalPrice} onChange={(v) => setForm({ ...form, totalPrice: v })} />
      <Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
      <Field label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
      <Field label="Email" value={form.emailAddress} onChange={(v) => setForm({ ...form, emailAddress: v })} />
      <Field label="Shipping" value={form.shippingAddress} onChange={(v) => setForm({ ...form, shippingAddress: v })} />
      <Field label="Invoice" value={form.invoiceAddress} onChange={(v) => setForm({ ...form, invoiceAddress: v })} />
    </div>
  )
}

function LogList({ logs }) {
  if (!logs.length) return <div className="empty">No requests</div>
  return (
    <div className="logList">
      {logs.map((log, index) => (
        <div key={`${log.time}-${index}`} className={log.ok ? 'log ok' : 'log fail'}>
          <span>{log.time}</span>
          <strong>{log.status}</strong>
          <em>{log.method}</em>
          <p>{log.name}</p>
        </div>
      ))}
    </div>
  )
}

export default App
