import { Boxes, ClipboardList, LayoutGrid, Mail, Package, ShieldCheck, ShoppingBag, Store, Sparkles, User } from 'lucide-react'
import { toLocalDateTimeValue } from './format'

export const ADMIN_ROLE_ID = 'b6105f01-18f5-433c-91e0-dbd80d27e7f4'

export const LOGIN_DEFAULTS = {
  username: 'alicesmith@example.com',
  password: 'alice123',
  clientId: 'tedu_microservices_postman',
  clientSecret: 'SuperStrongSecret',
}

export const DEFAULT_CHECKOUT = {
  userName: 'customer1',
  firstName: 'Alice',
  lastName: 'Smith',
  emailAddress: 'customer1@local.com',
  shippingAddress: 'Wollongong',
  invoiceAddress: 'Australia',
}

export const DEFAULT_PRODUCT_FORM = {
  id: '',
  no: '',
  name: '',
  summary: '',
  description: '',
  price: '0',
}

export const DEFAULT_INVENTORY_FORM = {
  itemNo: 'Lotus',
  quantity: '1',
  externalDocNo: 'EXT-001',
  saleOrderNo: 'ORD-001',
  pageIndex: '1',
  pageSize: '10',
  searchTerm: '',
}

export const DEFAULT_ORDER_FORM = {
  id: '',
  userName: 'customer1',
  totalPrice: '0',
  firstName: 'Alice',
  lastName: 'Smith',
  emailAddress: 'customer1@local.com',
  shippingAddress: 'Wollongong',
  invoiceAddress: 'Australia',
}

export const DEFAULT_PERMISSION_FORM = {
  function: 'PRODUCT',
  command: 'VIEW',
}

export function createDefaultJobForm() {
  return {
    email: 'customer1@local.com',
    subject: 'Order reminder',
    content: 'Thanks for shopping with us',
    enqueue: toLocalDateTimeValue(new Date(Date.now() + 15 * 60 * 1000)),
  }
}

export const STORE_NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Store, to: '/' },
  { id: 'shop', label: 'Shop', icon: LayoutGrid, to: '/shop' },
  { id: 'new', label: 'New In', icon: Sparkles, to: '/shop?sort=new' },
  { id: 'cart', label: 'Cart', icon: ShoppingBag, to: '/cart' },
  { id: 'orders', label: 'Orders', icon: ClipboardList, to: '/orders' },
  { id: 'account', label: 'Account', icon: User, to: '/account' },
]

export const NAV_ITEMS = STORE_NAV_ITEMS

export const COLLECTIONS = [
  { id: 'women', label: 'Women', query: 'women' },
  { id: 'men', label: 'Men', query: 'men' },
  { id: 'dresses', label: 'Dresses', query: 'dress' },
  { id: 'outerwear', label: 'Outerwear', query: 'coat jacket blazer' },
  { id: 'accessories', label: 'Accessories', query: 'bag shoe belt cap' },
  { id: 'sale', label: 'Sale', query: 'sale discount' },
]

export const ADMIN_TABS = [
  { id: 'catalog', label: 'Catalog', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'access', label: 'Access', icon: ShieldCheck },
  { id: 'jobs', label: 'Jobs', icon: Mail },
]

export const ADMIN_NAV = [
  { id: 'studio', label: 'Overview', icon: Store, to: '/studio' },
  { id: 'catalog', label: 'Catalog', icon: Package, to: '/studio/catalog' },
  { id: 'inventory', label: 'Inventory', icon: Boxes, to: '/studio/inventory' },
  { id: 'orders', label: 'Orders', icon: ClipboardList, to: '/studio/orders' },
  { id: 'access', label: 'Access', icon: ShieldCheck, to: '/studio/access' },
  { id: 'jobs', label: 'Jobs', icon: Mail, to: '/studio/jobs' },
]

export const PRODUCT_FUNCTIONS = ['ROLE', 'PRODUCT', 'CUSTOMER', 'BASKET', 'ORDER', 'INVENTORY', 'SCHEDULE_JOB']
export const PERMISSION_COMMANDS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE']
export const ORDER_STATUS = {
  1: 'New',
  2: 'Pending',
  3: 'Paid',
  4: 'Shipping',
  5: 'Fulfilled',
}
export const DOCUMENT_TYPES = {
  0: 'All',
  101: 'Purchase',
  102: 'Purchase internal',
  201: 'Sale',
  202: 'Sale internal',
}
