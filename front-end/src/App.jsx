import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { NoticeRail } from './components/NoticeRail'
import { StorefrontProvider } from './storefront/StorefrontContext'
import {
  ADMIN_ROLE_ID,
  DEFAULT_CHECKOUT,
  DEFAULT_INVENTORY_FORM,
  DEFAULT_ORDER_FORM,
  DEFAULT_PERMISSION_FORM,
  DEFAULT_PRODUCT_FORM,
  LOGIN_DEFAULTS,
  createDefaultJobForm,
} from './storefront/constants'
import { request as apiRequest } from './storefront/api'
import {
  createEmptyBasket,
  mergePristineForm,
  normalizeBasket,
  normalizeCustomer,
  normalizeObject,
  normalizeOrder,
  normalizeOrderCreate,
  normalizeProduct,
  toList,
} from './storefront/normalizers'
import { decodeJwt, formatNumber } from './storefront/format'
import './App.css'
import { StorefrontLayout } from './layouts/StorefrontLayout'
import { MerchantLayout } from './layouts/MerchantLayout'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductPage } from './pages/ProductPage'
import { CartPage } from './pages/CartPage'
import { OrdersPage } from './pages/OrdersPage'
import { AccountPage } from './pages/AccountPage'
import { StudioOverviewPage } from './pages/studio/StudioOverviewPage'
import { StudioCatalogPage } from './pages/studio/StudioCatalogPage'
import { StudioInventoryPage } from './pages/studio/StudioInventoryPage'
import { StudioOrdersPage } from './pages/studio/StudioOrdersPage'
import { StudioAccessPage } from './pages/studio/StudioAccessPage'
import { StudioJobsPage } from './pages/studio/StudioJobsPage'

function App() {
  const [view, setView] = useState('shop')
  const [adminTab, setAdminTab] = useState('catalog')
  const [sheet, setSheet] = useState('auth')
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || '')
  const [authForm, setAuthForm] = useState(LOGIN_DEFAULTS)
  const [busy, setBusy] = useState({ count: 0, label: '' })
  const [alerts, setAlerts] = useState([])

  const [account, setAccount] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [roleId, setRoleId] = useState(ADMIN_ROLE_ID)

  const [products, setProducts] = useState([])
  const [selectedProductNo, setSelectedProductNo] = useState('')
  const [productDraft, setProductDraft] = useState(DEFAULT_PRODUCT_FORM)
  const [productQuery, setProductQuery] = useState('')
  const [sortMode, setSortMode] = useState('featured')
  const [displayCount, setDisplayCount] = useState(12)
  const [sheetQty, setSheetQty] = useState('1')

  const [stockCache, setStockCache] = useState({})
  const stockCacheRef = useRef({})
  const stockRequestRef = useRef(new Set())

  const [basket, setBasket] = useState(null)
  const [checkoutForm, setCheckoutForm] = useState(DEFAULT_CHECKOUT)

  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const [orderAdminUser, setOrderAdminUser] = useState('customer1')
  const [orderAdminForm, setOrderAdminForm] = useState(DEFAULT_ORDER_FORM)
  const [orderAdminId, setOrderAdminId] = useState('')
  const [orderAdminDocumentNo, setOrderAdminDocumentNo] = useState('')
  const [adminOrders, setAdminOrders] = useState([])

  const [inventoryForm, setInventoryForm] = useState(DEFAULT_INVENTORY_FORM)
  const [inventoryRows, setInventoryRows] = useState([])
  const [inventoryPageRows, setInventoryPageRows] = useState([])
  const [inventoryDeleteId, setInventoryDeleteId] = useState('')

  const [permissionForm, setPermissionForm] = useState(DEFAULT_PERMISSION_FORM)
  const [jobForm, setJobForm] = useState(createDefaultJobForm())
  const [jobId, setJobId] = useState('')
  const [emailPreview, setEmailPreview] = useState('')

  const tokenClaims = useMemo(() => decodeJwt(token), [token])
  const activeUserName = account?.userName || customer?.userName || tokenClaims?.preferred_username || checkoutForm.userName || authForm.username
  const activeDisplayName = [account?.firstName || customer?.firstName, account?.lastName || customer?.lastName].filter(Boolean).join(' ') || activeUserName
  const permissionSet = useMemo(() => new Set((permissions || []).map((permission) => `${permission.function}.${permission.command}`)), [permissions])
  const can = useCallback((functionCode, commandCode) => permissionSet.has(`${functionCode}.${commandCode}`), [permissionSet])
  const selectedProduct = useMemo(() => products.find((product) => product.no === selectedProductNo) || null, [products, selectedProductNo])
  const selectedProductStock = selectedProductNo ? stockCache[selectedProductNo] : null
  const productCount = products.length
  const cartCount = useMemo(() => (basket?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0), [basket])
  const orderCount = orders.length
  const totalInventoryMoves = useMemo(() => Object.values(stockCache).reduce((sum, entry) => sum + (entry?.total || 0), 0), [stockCache])

  useEffect(() => {
    stockCacheRef.current = stockCache
  }, [stockCache])

  useEffect(() => {
    localStorage.setItem('access_token', token)
    if (!token) {
      localStorage.removeItem('access_token')
    }
  }, [token])

  /* eslint-disable react-hooks/exhaustive-deps */
  // Session hydration intentionally runs once per token change.
  useEffect(() => {
    if (!token) {
      setAccount(null)
      setCustomer(null)
      setPermissions([])
      setProducts([])
      setSelectedProductNo('')
      setBasket(null)
      setOrders([])
      setSelectedOrder(null)
      setSelectedOrderId('')
      setEmailPreview('')
      setSheet('auth')
      setView('shop')
      return
    }

    void hydrateSession()
  }, [token, tokenClaims])
  /* eslint-enable react-hooks/exhaustive-deps */

  /* eslint-disable react-hooks/exhaustive-deps */
  // Stock prefetch follows the visible catalog slice and is guarded per item.
  useEffect(() => {
    if (!token || !products.length) return
    const targets = displayProducts.slice(0, 8)
    targets.forEach((product) => {
      void ensureStock(product.no)
    })
  }, [token, products, productQuery, sortMode, displayCount, stockCache])
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    setDisplayCount(12)
  }, [productQuery, sortMode])

  useEffect(() => {
    if (!account && !customer) return
    const profile = {
      userName: activeUserName,
      firstName: account?.firstName || customer?.firstName || DEFAULT_CHECKOUT.firstName,
      lastName: account?.lastName || customer?.lastName || DEFAULT_CHECKOUT.lastName,
      emailAddress: customer?.emailAddress || account?.email || DEFAULT_CHECKOUT.emailAddress,
      shippingAddress: checkoutForm.shippingAddress,
      invoiceAddress: checkoutForm.invoiceAddress,
    }
    setCheckoutForm((current) => mergePristineForm(current, DEFAULT_CHECKOUT, profile))
    setOrderAdminForm((current) =>
      mergePristineForm(current, DEFAULT_ORDER_FORM, {
        userName: activeUserName,
        firstName: account?.firstName || customer?.firstName || DEFAULT_ORDER_FORM.firstName,
        lastName: account?.lastName || customer?.lastName || DEFAULT_ORDER_FORM.lastName,
        emailAddress: customer?.emailAddress || account?.email || DEFAULT_ORDER_FORM.emailAddress,
        shippingAddress: checkoutForm.shippingAddress || DEFAULT_ORDER_FORM.shippingAddress,
        invoiceAddress: checkoutForm.invoiceAddress || DEFAULT_ORDER_FORM.invoiceAddress,
      }),
    )
    setJobForm((current) =>
      current.email === DEFAULT_CHECKOUT.emailAddress ? { ...current, email: customer?.emailAddress || account?.email || current.email } : current,
    )
  }, [account, customer, activeUserName, checkoutForm.shippingAddress, checkoutForm.invoiceAddress])

  useEffect(() => {
    if (!selectedProductNo && products[0]?.no) {
      setSelectedProductNo(products[0].no)
    }
  }, [products, selectedProductNo])

  async function hydrateSession() {
    const identity = await loadAccount()
    const username = identity?.userName || tokenClaims?.preferred_username || authForm.username || DEFAULT_CHECKOUT.userName
    await Promise.all([loadCustomerProfile(username), loadPermissions(roleId), loadProducts(), loadBasket(username), loadOrders(username)])
    setSheet((current) => (current === 'auth' ? 'account' : current))
  }

  async function request({ service, path, method = 'GET', body, headers = {}, auth = true, label = '' }) {
    setBusy((current) => ({ count: current.count + 1, label: label || `${method} ${service}` }))
    try {
      return await apiRequest({
        service,
        path,
        method,
        body,
        headers,
        auth,
        token,
      })
    } finally {
      setBusy((current) => ({ count: Math.max(0, current.count - 1), label: current.label }))
    }
  }

  function notify(message, tone = 'info') {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setAlerts((current) => [{ id, message, tone }, ...current].slice(0, 4))
    window.setTimeout(() => {
      setAlerts((current) => current.filter((item) => item.id !== id))
    }, 4000)
  }

  function requireAuth() {
    if (token) return true
    setSheet('auth')
    notify('Sign in to continue', 'warning')
    return false
  }

  function switchView(nextView) {
    setView(nextView)
    if (sheet !== 'auth') setSheet(null)
  }

  function navigateView(nextView) {
    if (!token && nextView !== 'shop') {
      openAuthSheet()
      notify('Sign in to continue', 'warning')
      return
    }
    switchView(nextView)
  }

  async function loadAccount() {
    try {
      const data = await request({
        service: 'identity',
        path: '/api/account',
        label: 'Load account',
      })
      const accountData = normalizeObject(data)
      setAccount(accountData)
      return accountData
    } catch (error) {
      setAccount(null)
      notify(error.message, 'error')
      return null
    }
  }

  async function loadCustomerProfile(username) {
    try {
      const data = await request({
        service: 'customer',
        path: `/customers/${encodeURIComponent(username)}`,
        label: 'Load customer',
      })
      const customerData = normalizeCustomer(data)
      setCustomer(customerData)
      return customerData
    } catch (error) {
      setCustomer(null)
      notify(error.message, 'error')
      return null
    }
  }

  async function loadPermissions(role) {
    try {
      const data = await request({
        service: 'identity',
        path: `/api/permissions/roles/${encodeURIComponent(role)}`,
        label: 'Load permissions',
      })
      const permissionList = toList(data)
      setPermissions(permissionList)
      return permissionList
    } catch (error) {
      setPermissions([])
      notify(error.message, 'error')
      return []
    }
  }

  async function loadProducts() {
    try {
      const data = await request({
        service: 'catalog',
        path: '/products',
        label: 'Load catalog',
      })
      const list = toList(data)
      setProducts(list)
      if (!selectedProductNo && list[0]?.no) {
        setSelectedProductNo(list[0].no)
      }
      return list
    } catch (error) {
      setProducts([])
      notify(error.message, 'error')
      return []
    }
  }

  async function loadBasket(username = activeUserName) {
    try {
      const data = await request({
        service: 'basket',
        path: `/baskets/${encodeURIComponent(username)}`,
        label: 'Load basket',
      })
      const basketData = normalizeBasket(data)
      setBasket(basketData)
      return basketData
    } catch (error) {
      setBasket(null)
      notify(error.message, 'error')
      return null
    }
  }

  async function loadOrders(username = activeUserName) {
    try {
      const data = await request({
        service: 'orders',
        path: `/v1/orders/${encodeURIComponent(username)}`,
        label: 'Load orders',
      })
      const list = toList(data)
      setOrders(list)
      if (list.length) {
        const nextSelected = list.find((order) => String(order.id) === String(selectedOrderId)) || list[0]
        setSelectedOrder(nextSelected || null)
        setSelectedOrderId(nextSelected ? String(nextSelected.id) : '')
      } else {
        setSelectedOrder(null)
        setSelectedOrderId('')
      }
      return list
    } catch (error) {
      setOrders([])
      setSelectedOrder(null)
      setSelectedOrderId('')
      notify(error.message, 'error')
      return []
    }
  }

  async function loadAdminOrders(username = orderAdminUser) {
    try {
      const data = await request({
        service: 'orders',
        path: `/v1/orders/${encodeURIComponent(username)}`,
        label: 'Load admin orders',
      })
      const list = toList(data)
      setAdminOrders(list)
      return list
    } catch (error) {
      setAdminOrders([])
      notify(error.message, 'error')
      return []
    }
  }

  async function loadInventoryHistory(itemNo = inventoryForm.itemNo) {
    try {
      const data = await request({
        service: 'inventory',
        path: `/inventory/items/${encodeURIComponent(itemNo)}`,
        label: 'Load inventory',
      })
      const list = toList(data)
      setInventoryRows(list)
      return list
    } catch (error) {
      setInventoryRows([])
      notify(error.message, 'error')
      return []
    }
  }

  async function loadInventoryPage(itemNo = inventoryForm.itemNo) {
    try {
      const query = new URLSearchParams({
        pageIndex: inventoryForm.pageIndex || '1',
        pageSize: inventoryForm.pageSize || '10',
      })
      if (inventoryForm.searchTerm) query.set('searchTerm', inventoryForm.searchTerm)
      const data = await request({
        service: 'inventory',
        path: `/inventory/items/${encodeURIComponent(itemNo)}/paging?${query.toString()}`,
        label: 'Load inventory page',
      })
      const list = toList(data)
      setInventoryPageRows(list)
      return list
    } catch (error) {
      setInventoryPageRows([])
      notify(error.message, 'error')
      return []
    }
  }

  async function ensureStock(itemNo) {
    if (!token || !itemNo) return null
    const current = stockCacheRef.current[itemNo]
    if (current?.status === 'ready' || stockRequestRef.current.has(itemNo)) {
      return current || null
    }

    stockRequestRef.current.add(itemNo)
    setStockCache((currentCache) => ({
      ...currentCache,
      [itemNo]: {
        status: 'loading',
        total: currentCache[itemNo]?.total ?? null,
        entries: currentCache[itemNo]?.entries ?? [],
      },
    }))

    try {
      const data = await request({
        service: 'inventory',
        path: `/inventory/items/${encodeURIComponent(itemNo)}`,
        label: `Load stock ${itemNo}`,
      })
      const entries = toList(data)
      const total = entries.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0)
      const next = {
        status: 'ready',
        total,
        entries,
        updatedAt: Date.now(),
      }
      setStockCache((currentCache) => ({
        ...currentCache,
        [itemNo]: next,
      }))
      return next
    } catch (error) {
      setStockCache((currentCache) => ({
        ...currentCache,
        [itemNo]: {
          status: 'error',
          total: null,
          entries: [],
          error: error.message,
        },
      }))
      return null
    } finally {
      stockRequestRef.current.delete(itemNo)
    }
  }

  async function login() {
    try {
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: authForm.clientId,
        client_secret: authForm.clientSecret,
        username: authForm.username,
        password: authForm.password,
        scope: 'openid profile email roles tedu_microservices_api.read tedu_microservices_api.write',
      })
      const data = await request({
        service: 'identity',
        path: '/connect/token',
        method: 'POST',
        body,
        auth: false,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        label: 'Login',
      })
      const accessToken = data?.access_token || data?.AccessToken
      if (!accessToken) {
        throw new Error('Login did not return an access token')
      }
      setToken(accessToken)
      setSheet('account')
      notify('Signed in', 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  function logout() {
    localStorage.removeItem('access_token')
    setToken('')
    setAccount(null)
    setCustomer(null)
    setPermissions([])
    setProducts([])
    setSelectedProductNo('')
    setProductDraft(DEFAULT_PRODUCT_FORM)
    setBasket(null)
    setOrders([])
    setSelectedOrder(null)
    setSelectedOrderId('')
    setAdminOrders([])
    setView('shop')
    setSheet('auth')
    notify('Signed out', 'info')
  }

  async function refreshStorefront() {
    if (!token) return
    await Promise.all([loadProducts(), loadBasket(activeUserName), loadOrders(activeUserName)])
    notify('Storefront refreshed', 'success')
  }

  function openProduct(product) {
    setSelectedProductNo(product.no)
    setSheetQty('1')
    setSheet('product')
  }

  function openAccountSheet() {
    setSheet('account')
  }

  function openAuthSheet() {
    setSheet('auth')
  }

  async function copyToken() {
    if (!token) return
    await navigator.clipboard.writeText(token)
    notify('Token copied', 'success')
  }

  async function loadProductByNo(productNo) {
    try {
      const data = await request({
        service: 'catalog',
        path: `/products/get-product-by-no/${encodeURIComponent(productNo)}`,
        label: 'Find product',
      })
      const product = normalizeProduct(data)
      if (product?.no) {
        setSelectedProductNo(product.no)
        setProductDraft({
          id: String(product.id || ''),
          no: product.no || '',
          name: product.name || '',
          summary: product.summary || '',
          description: product.description || '',
          price: String(product.price ?? '0'),
        })
        setView('admin')
        setAdminTab('catalog')
        setSheet('product')
      }
      return product
    } catch (error) {
      notify(error.message, 'error')
      return null
    }
  }

  async function createProduct() {
    if (!requireAuth()) return
    try {
      const payload = {
        no: productDraft.no.trim(),
        name: productDraft.name.trim(),
        summary: productDraft.summary.trim(),
        description: productDraft.description.trim(),
        price: Number(productDraft.price || 0),
      }
      const data = await request({
        service: 'catalog',
        path: '/products',
        method: 'POST',
        body: payload,
        label: 'Create product',
      })
      const created = normalizeProduct(data)
      if (created?.no) {
        setProducts((current) => [created, ...current.filter((item) => item.id !== created.id)])
        setSelectedProductNo(created.no)
        setProductDraft({
          id: String(created.id || ''),
          no: created.no || '',
          name: created.name || '',
          summary: created.summary || '',
          description: created.description || '',
          price: String(created.price ?? '0'),
        })
      }
      notify('Product created', 'success')
      await loadProducts()
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function updateProduct() {
    const target = products.find((item) => String(item.id) === String(productDraft.id) || item.no === productDraft.no)
    if (!target?.id) {
      notify('Select a product first', 'warning')
      return
    }

    try {
      const payload = {
        name: productDraft.name.trim(),
        summary: productDraft.summary.trim(),
        description: productDraft.description.trim(),
        price: Number(productDraft.price || 0),
      }
      const data = await request({
        service: 'catalog',
        path: `/products/${target.id}`,
        method: 'PUT',
        body: payload,
        label: 'Update product',
      })
      const updated = normalizeProduct(data)
      if (updated?.id) {
        setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)))
        setSelectedProductNo(updated.no || target.no)
      }
      notify('Product updated', 'success')
      await loadProducts()
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function deleteProduct(targetProduct = null) {
    const target =
      targetProduct ||
      products.find((item) => String(item.id) === String(productDraft.id) || item.no === productDraft.no)
    if (!target?.id) {
      notify('Select a product first', 'warning')
      return
    }

    try {
      await request({
        service: 'catalog',
        path: `/products/${target.id}`,
        method: 'DELETE',
        label: 'Delete product',
      })
      setProducts((current) => current.filter((item) => item.id !== target.id))
      if (selectedProductNo === target.no) setSelectedProductNo('')
      setProductDraft(DEFAULT_PRODUCT_FORM)
      notify('Product deleted', 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function addToBasket(product, quantity = 1) {
    if (!requireAuth()) return
    const itemQuantity = Math.max(1, Number(quantity || 1))
    const currentBasket = basket || createEmptyBasket(activeUserName, checkoutForm.emailAddress)
    const nextItems = [...(currentBasket.items || [])]
    const existing = nextItems.find((item) => item.itemNo === product.no)
    if (existing) {
      existing.quantity += itemQuantity
      existing.itemPrice = Number(product.price || existing.itemPrice || 0)
      existing.itemName = product.name || existing.itemName
    } else {
      nextItems.push({
        quantity: itemQuantity,
        itemPrice: Number(product.price || 0),
        itemNo: product.no,
        itemName: product.name,
      })
    }

    const nextBasket = {
      username: activeUserName,
      emailAddress: checkoutForm.emailAddress || customer?.emailAddress || account?.email || currentBasket.emailAddress,
      items: nextItems,
    }

    try {
      const data = await request({
        service: 'basket',
        path: '/baskets',
        method: 'POST',
        body: nextBasket,
        label: 'Save basket',
      })
      const saved = normalizeBasket(data)
      setBasket(saved)
      setView('cart')
      notify(`${product.name} added to cart`, 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function updateBasketItem(itemNo, nextQuantity) {
    if (!requireAuth()) return
    const currentBasket = basket || createEmptyBasket(activeUserName, checkoutForm.emailAddress)
    const updatedItems = (currentBasket.items || [])
      .map((item) =>
        item.itemNo === itemNo
          ? {
              ...item,
              quantity: Math.max(1, Number(nextQuantity)),
            }
          : item,
      )
      .filter((item) => item.quantity > 0)

    try {
      const data = await request({
        service: 'basket',
        path: '/baskets',
        method: 'POST',
        body: {
          username: activeUserName,
          emailAddress: currentBasket.emailAddress || checkoutForm.emailAddress || customer?.emailAddress || account?.email || '',
          items: updatedItems,
        },
        label: 'Update basket',
      })
      setBasket(normalizeBasket(data))
      notify('Basket updated', 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function removeBasketItem(itemNo) {
    if (!requireAuth()) return
    const currentBasket = basket || createEmptyBasket(activeUserName, checkoutForm.emailAddress)
    const updatedItems = (currentBasket.items || []).filter((item) => item.itemNo !== itemNo)

    try {
      const data = await request({
        service: 'basket',
        path: '/baskets',
        method: 'POST',
        body: {
          username: activeUserName,
          emailAddress: currentBasket.emailAddress || checkoutForm.emailAddress || customer?.emailAddress || account?.email || '',
          items: updatedItems,
        },
        label: 'Remove basket item',
      })
      setBasket(normalizeBasket(data))
      notify('Item removed', 'info')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function clearBasket() {
    if (!requireAuth()) return
    try {
      await request({
        service: 'basket',
        path: `/baskets/${encodeURIComponent(activeUserName)}`,
        method: 'DELETE',
        label: 'Clear basket',
      })
      setBasket(createEmptyBasket(activeUserName, checkoutForm.emailAddress))
      notify('Basket cleared', 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function checkoutBasket() {
    if (!requireAuth()) return
    if (!basket?.items?.length) {
      notify('Cart is empty', 'warning')
      return
    }

    try {
      await request({
        service: 'basket',
        path: '/baskets/checkout',
        method: 'POST',
        body: {
          userName: activeUserName,
          firstName: checkoutForm.firstName,
          lastName: checkoutForm.lastName,
          emailAddress: checkoutForm.emailAddress,
          shippingAddress: checkoutForm.shippingAddress,
          invoiceAddress: checkoutForm.invoiceAddress,
        },
        label: 'Checkout basket',
      })
      setBasket(createEmptyBasket(activeUserName, checkoutForm.emailAddress))
      notify('Checkout submitted', 'success')
      window.setTimeout(() => {
        void loadOrders(activeUserName)
      }, 1200)
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function loadOrderById(id = selectedOrderId) {
    if (!id) return null
    try {
      const data = await request({
        service: 'orders',
        path: `/v1/orders/by-id/${encodeURIComponent(id)}`,
        label: 'Load order detail',
      })
      const order = normalizeOrder(data)
      setSelectedOrder(order)
      setSelectedOrderId(String(order?.id || id))
      return order
    } catch (error) {
      notify(error.message, 'error')
      return null
    }
  }

  async function createOrder() {
    if (!requireAuth()) return
    try {
      const payload = {
        userName: orderAdminForm.userName,
        totalPrice: Number(orderAdminForm.totalPrice || 0),
        firstName: orderAdminForm.firstName,
        lastName: orderAdminForm.lastName,
        emailAddress: orderAdminForm.emailAddress,
        shippingAddress: orderAdminForm.shippingAddress,
        invoiceAddress: orderAdminForm.invoiceAddress,
      }
      const data = await request({
        service: 'orders',
        path: '/v1/orders',
        method: 'POST',
        body: payload,
        label: 'Create order',
      })
      const created = normalizeOrderCreate(data)
      setOrderAdminId(String(created || ''))
      notify('Order created', 'success')
      await loadAdminOrders(orderAdminUser)
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function updateOrder() {
    if (!requireAuth()) return
    const id = orderAdminId || orderAdminForm.id
    if (!id) {
      notify('Order id is required', 'warning')
      return
    }

    try {
      const payload = {
        totalPrice: Number(orderAdminForm.totalPrice || 0),
        firstName: orderAdminForm.firstName,
        lastName: orderAdminForm.lastName,
        emailAddress: orderAdminForm.emailAddress,
        shippingAddress: orderAdminForm.shippingAddress,
        invoiceAddress: orderAdminForm.invoiceAddress,
      }
      const data = await request({
        service: 'orders',
        path: `/v1/orders/${encodeURIComponent(id)}`,
        method: 'PUT',
        body: payload,
        label: 'Update order',
      })
      const updated = normalizeOrder(data)
      if (updated?.id) {
        setSelectedOrder(updated)
        setSelectedOrderId(String(updated.id))
      }
      notify('Order updated', 'success')
      await loadAdminOrders(orderAdminUser)
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function deleteOrderById() {
    if (!requireAuth()) return
    const id = orderAdminId || orderAdminForm.id || selectedOrderId
    if (!id) {
      notify('Order id is required', 'warning')
      return
    }

    try {
      await request({
        service: 'orders',
        path: `/v1/orders/${encodeURIComponent(id)}`,
        method: 'DELETE',
        label: 'Delete order',
      })
      setSelectedOrder(null)
      setSelectedOrderId('')
      setOrderAdminId('')
      notify('Order deleted', 'success')
      await loadAdminOrders(orderAdminUser)
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function deleteOrderByDocument() {
    if (!requireAuth()) return
    const documentNo = orderAdminDocumentNo || selectedOrder?.documentNo
    if (!documentNo) {
      notify('Document no is required', 'warning')
      return
    }

    try {
      await request({
        service: 'orders',
        path: `/v1/orders/document-no/${encodeURIComponent(documentNo)}`,
        method: 'DELETE',
        label: 'Delete order document',
      })
      setOrderAdminDocumentNo('')
      notify('Order deleted by document no', 'success')
      await loadAdminOrders(orderAdminUser)
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function addPermission() {
    if (!requireAuth()) return
    try {
      await request({
        service: 'identity',
        path: `/api/permissions/roles/${encodeURIComponent(roleId)}`,
        method: 'POST',
        body: {
          function: permissionForm.function,
          command: permissionForm.command,
        },
        label: 'Add permission',
      })
      await loadPermissions(roleId)
      notify('Permission added', 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function deletePermission(permission) {
    if (!requireAuth()) return
    try {
      await request({
        service: 'identity',
        path: `/api/permissions/roles/${encodeURIComponent(roleId)}/function/${encodeURIComponent(permission.function)}/command/${encodeURIComponent(permission.command)}`,
        method: 'DELETE',
        label: 'Delete permission',
      })
      await loadPermissions(roleId)
      notify('Permission deleted', 'info')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function syncPermissions() {
    if (!requireAuth()) return
    try {
      await request({
        service: 'identity',
        path: `/api/permissions/roles/${encodeURIComponent(roleId)}/update-permissions`,
        method: 'POST',
        body: permissions.map((permission) => ({
          function: permission.function,
          command: permission.command,
        })),
        label: 'Sync permissions',
      })
      await loadPermissions(roleId)
      notify('Permissions synced', 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function purchaseInventory() {
    if (!requireAuth()) return
    try {
      await request({
        service: 'inventory',
        path: `/inventory/purchase/${encodeURIComponent(inventoryForm.itemNo)}`,
        method: 'POST',
        body: {
          quantity: Number(inventoryForm.quantity || 0),
        },
        label: 'Purchase inventory',
      })
      await loadInventoryHistory(inventoryForm.itemNo)
      await ensureStock(inventoryForm.itemNo)
      notify('Inventory purchased', 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function saleInventory() {
    if (!requireAuth()) return
    try {
      await request({
        service: 'inventory',
        path: `/inventory/sales/${encodeURIComponent(inventoryForm.itemNo)}`,
        method: 'POST',
        body: {
          externalDocNo: inventoryForm.externalDocNo,
          quantity: Number(inventoryForm.quantity || 0),
        },
        label: 'Sale inventory',
      })
      await loadInventoryHistory(inventoryForm.itemNo)
      await ensureStock(inventoryForm.itemNo)
      notify('Inventory sale recorded', 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function saleOrderInventory() {
    if (!requireAuth()) return
    try {
      const data = await request({
        service: 'inventory',
        path: `/inventory/sales/order-no/${encodeURIComponent(inventoryForm.saleOrderNo || `ORD-${Date.now()}`)}`,
        method: 'POST',
        body: {
          saleItems: [
            {
              itemNo: inventoryForm.itemNo,
              quantity: Number(inventoryForm.quantity || 0),
            },
          ],
        },
        label: 'Sale order inventory',
      })
      const docNo = data?.docNo || data?.DocNo || data?.data || ''
      notify(docNo ? `Order stock posted: ${docNo}` : 'Order stock posted', 'success')
      await loadInventoryHistory(inventoryForm.itemNo)
      await ensureStock(inventoryForm.itemNo)
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function deleteInventoryEntry() {
    if (!requireAuth()) return
    const id = inventoryDeleteId.trim()
    if (!id) {
      notify('Inventory id is required', 'warning')
      return
    }

    try {
      await request({
        service: 'inventory',
        path: `/inventory/${encodeURIComponent(id)}`,
        method: 'DELETE',
        label: 'Delete inventory entry',
      })
      setInventoryDeleteId('')
      await loadInventoryHistory(inventoryForm.itemNo)
      await ensureStock(inventoryForm.itemNo)
      notify('Inventory entry deleted', 'info')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function loadJobPreview() {
    if (!requireAuth()) return
    try {
      const data = await request({
        service: 'basket',
        path: '/baskets/email',
        method: 'POST',
        body: {},
        label: 'Load email preview',
      })
      setEmailPreview(typeof data === 'string' ? data : JSON.stringify(data, null, 2))
      notify('Email template loaded', 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function sendEmailJob() {
    if (!requireAuth()) return
    try {
      const data = await request({
        service: 'jobs',
        path: '/schedule-job/send-email',
        method: 'POST',
        body: {
          email: jobForm.email,
          subject: jobForm.subject,
          content: jobForm.content,
          enqueue: new Date(jobForm.enqueue).toISOString(),
        },
        label: 'Schedule email job',
      })
      setJobId(String(data || ''))
      notify('Email job scheduled', 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function deleteJob() {
    if (!requireAuth()) return
    if (!jobId) {
      notify('Job id is required', 'warning')
      return
    }

    try {
      await request({
        service: 'jobs',
        path: `/schedule-job/delete/jobId/${encodeURIComponent(jobId)}`,
        method: 'DELETE',
        label: 'Delete job',
      })
      notify('Job delete request sent', 'info')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function runWelcome(action) {
    if (!requireAuth()) return
    try {
      const data = await request({
        service: 'jobs',
        path: `/welcome/${encodeURIComponent(action)}`,
        method: 'POST',
        body: {},
        label: `Run ${action}`,
      })
      notify(typeof data === 'string' ? data : `Job queued: ${action}`, 'success')
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  async function openAdminOrder(order) {
    setView('admin')
    setAdminTab('orders')
    if (order) {
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
      await loadAdminOrders(order.userName || orderAdminUser)
    } else {
      await loadAdminOrders(orderAdminUser)
    }
  }

  async function saveAccountToken() {
    await copyToken()
  }

  const displayProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase()
    const filtered = products.filter((product) => {
      if (!query) return true
      return [product.no, product.name, product.summary, product.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    })

    const sorted = [...filtered]
    sorted.sort((left, right) => {
      const leftStock = stockCache[left.no]?.total ?? -1
      const rightStock = stockCache[right.no]?.total ?? -1

      if (sortMode === 'name') return String(left.name || '').localeCompare(String(right.name || ''))
      if (sortMode === 'price-asc') return Number(left.price || 0) - Number(right.price || 0)
      if (sortMode === 'price-desc') return Number(right.price || 0) - Number(left.price || 0)
      if (sortMode === 'stock') return rightStock - leftStock
      return rightStock - leftStock || Number(right.price || 0) - Number(left.price || 0) || String(left.name || '').localeCompare(String(right.name || ''))
    })

    return sorted
  }, [products, productQuery, sortMode, stockCache])

  const visibleProducts = useMemo(() => displayProducts.slice(0, displayCount), [displayProducts, displayCount])
  const selectedProductRows = selectedProductStock?.entries || []
  const quickMetrics = [
    { label: 'Catalog', value: formatNumber(productCount) },
    { label: 'Basket items', value: formatNumber(cartCount) },
    { label: 'Orders', value: formatNumber(orderCount) },
    { label: 'Permissions', value: formatNumber(permissions.length) },
    { label: 'Stock total', value: formatNumber(totalInventoryMoves) },
  ]

  const store = {
    token,
    tokenClaims,
    authForm,
    setAuthForm,
    busy,
    alerts,
    account,
    customer,
    permissions,
    roleId,
    setRoleId,
    view,
    setView,
    adminTab,
    setAdminTab,
    sheet,
    setSheet,
    sheetQty,
    setSheetQty,
    activeUserName,
    activeDisplayName,
    productCount,
    cartCount,
    orderCount,
    totalInventoryMoves,
    quickMetrics,
    products,
    stockCache,
    productQuery,
    setProductQuery,
    sortMode,
    setSortMode,
    displayCount,
    setDisplayCount,
    displayProducts,
    visibleProducts,
    selectedProductNo,
    setSelectedProductNo,
    selectedProduct,
    selectedProductStock,
    selectedProductRows,
    productDraft,
    setProductDraft,
    basket,
    checkoutForm,
    setCheckoutForm,
    orders,
    selectedOrderId,
    setSelectedOrderId,
    selectedOrder,
    orderAdminUser,
    setOrderAdminUser,
    orderAdminForm,
    setOrderAdminForm,
    orderAdminId,
    setOrderAdminId,
    orderAdminDocumentNo,
    setOrderAdminDocumentNo,
    adminOrders,
    inventoryForm,
    setInventoryForm,
    inventoryRows,
    inventoryPageRows,
    inventoryDeleteId,
    setInventoryDeleteId,
    permissionForm,
    setPermissionForm,
    jobForm,
    setJobForm,
    jobId,
    setJobId,
    emailPreview,
    can,
    notify,
    requireAuth,
    request,
    loadAccount,
    loadCustomerProfile,
    loadPermissions,
    loadProducts,
    loadBasket,
    loadOrders,
    loadAdminOrders,
    loadInventoryHistory,
    loadInventoryPage,
    ensureStock,
    login,
    logout,
    refreshStorefront,
    navigateView,
    openProduct,
    openAccountSheet,
    openAuthSheet,
    copyToken,
    loadProductByNo,
    createProduct,
    updateProduct,
    deleteProduct,
    addToBasket,
    updateBasketItem,
    removeBasketItem,
    clearBasket,
    checkoutBasket,
    loadOrderById,
    createOrder,
    updateOrder,
    deleteOrderById,
    deleteOrderByDocument,
    addPermission,
    deletePermission,
    syncPermissions,
    purchaseInventory,
    saleInventory,
    saleOrderInventory,
    deleteInventoryEntry,
    loadJobPreview,
    sendEmailJob,
    deleteJob,
    runWelcome,
    openAdminOrder,
    saveAccountToken,
  }

  return (
    <StorefrontProvider value={store}>
      <BrowserRouter>
        <Routes>
          <Route element={<StorefrontLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="product/:productNo" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>
          <Route element={<MerchantLayout />}>
            <Route path="studio" element={<StudioOverviewPage />} />
            <Route path="studio/catalog" element={<StudioCatalogPage />} />
            <Route path="studio/inventory" element={<StudioInventoryPage />} />
            <Route path="studio/orders" element={<StudioOrdersPage />} />
            <Route path="studio/access" element={<StudioAccessPage />} />
            <Route path="studio/jobs" element={<StudioJobsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <NoticeRail busy={busy} alerts={alerts} />
    </StorefrontProvider>
  )
}

export default App
