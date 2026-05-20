export function toList(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value.data)) return value.data
  if (Array.isArray(value.value)) return value.value
  if (Array.isArray(value.items)) return value.items
  return []
}

export function normalizeObject(value) {
  if (!value) return null
  if (value.value && typeof value.value === 'object') return value.value
  if (value.data && typeof value.data === 'object' && !Array.isArray(value.data)) return value.data
  return value
}

export function normalizeCustomer(value) {
  const unwrapped = normalizeObject(value)
  if (unwrapped?.value && typeof unwrapped.value === 'object') return unwrapped.value
  return unwrapped
}

export function normalizeBasket(value) {
  const basket = normalizeObject(value)
  if (!basket) return null
  return {
    ...basket,
    items: Array.isArray(basket.items) ? basket.items : [],
  }
}

export function normalizeProduct(value) {
  return normalizeObject(value)
}

export function normalizeOrder(value) {
  return normalizeObject(value)
}

export function normalizeOrderCreate(value) {
  const order = normalizeObject(value)
  return order?.data ?? order?.Data ?? order
}

export function mergePristineForm(current, defaults, next) {
  const merged = { ...current }
  Object.entries(next).forEach(([key, value]) => {
    if (current[key] === defaults[key] || current[key] === '' || current[key] === null || current[key] === undefined) {
      merged[key] = value
    }
  })
  return merged
}

export function createEmptyBasket(username, emailAddress) {
  return {
    username,
    emailAddress,
    items: [],
    totalPrice: 0,
  }
}
