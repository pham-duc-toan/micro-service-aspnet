import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Chip } from '../components/Chip'
import { FashionImage } from '../components/FashionImage'
import { TextField } from '../components/Field'
import { fallbackMedia, productMedia } from '../storefront/media'
import { createEmptyBasket } from '../storefront/normalizers'
import { formatMoney, formatNumber } from '../storefront/format'
import { useStorefront } from '../storefront/StorefrontContext'

export function CartPage() {
  const {
    token,
    activeUserName,
    account,
    customer,
    basket,
    products,
    checkoutForm,
    setCheckoutForm,
    updateBasketItem,
    removeBasketItem,
    clearBasket,
    checkoutBasket,
  } = useStorefront()

  const currentBasket = basket || createEmptyBasket(activeUserName, checkoutForm.emailAddress)
  const items = currentBasket.items || []
  const total = Number(currentBasket.totalPrice || items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.itemPrice || 0), 0))

  return (
    <div className="pageStack">
      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Cart</h2>
            <p>Review the basket, adjust quantities, and finish checkout against the live backend.</p>
          </div>
          <div className="sectionTools">
            <Chip tone={token ? 'positive' : 'warning'}>{token ? 'Signed in' : 'Sign in required'}</Chip>
            <Link className="ghostButton" to="/shop">
              Continue shopping
            </Link>
          </div>
        </div>

        {!token ? (
          <div className="emptyState large">
            <div>
              <strong>Sign in to use the basket</strong>
              <p>The basket API requires authenticated access in this project.</p>
              <Link className="secondaryButton" to="/account">
                Go to account
              </Link>
            </div>
          </div>
        ) : null}

        <div className="splitView">
          <div className="pane">
            {items.length ? (
              <div className="cartList">
                {items.map((item) => {
                  const product = products.find((entry) => entry.no === item.itemNo)
                  return (
                    <article key={item.itemNo} className="cartItem">
                      <div className="cartPreview">
                        <FashionImage src={productMedia(item.itemNo)} fallback={fallbackMedia()} alt="" aria-hidden="true" />
                      </div>
                      <div>
                        <strong>{item.itemName || product?.name || item.itemNo}</strong>
                        <p>{product?.summary || item.itemNo}</p>
                        <div className="chipRow">
                          <Chip tone="neutral">{item.itemNo}</Chip>
                        </div>
                      </div>
                      <div className="cartMeta">
                        <strong>{formatMoney(item.itemPrice)}</strong>
                        <span>{formatMoney(Number(item.itemPrice || 0) * Number(item.quantity || 0))}</span>
                      </div>
                      <div className="cartActions">
                        <div className="quantityStepper">
                          <button type="button" onClick={() => updateBasketItem(item.itemNo, Number(item.quantity || 1) - 1)}>
                            <Minus size={14} />
                          </button>
                          <strong>{formatNumber(item.quantity)}</strong>
                          <button type="button" onClick={() => updateBasketItem(item.itemNo, Number(item.quantity || 0) + 1)}>
                            <Plus size={14} />
                          </button>
                        </div>
                        <button type="button" className="iconButton danger" onClick={() => removeBasketItem(item.itemNo)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="emptyState large">
                <div>
                  <strong>Your cart is empty</strong>
                  <p>Browse the shop and add a few items to continue.</p>
                </div>
              </div>
            )}
          </div>

          <div className="pane">
            <div className="sectionHeader compact">
              <div>
                <h3>Checkout</h3>
                <p>Customer details are reused from the linked profile when available.</p>
              </div>
            </div>

            <div className="summaryBox">
              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(total)}</strong>
              </div>
              <div>
                <span>Profile</span>
                <strong>{account?.email || customer?.emailAddress || checkoutForm.emailAddress}</strong>
              </div>
              <div>
                <span>Items</span>
                <strong>{formatNumber(items.length)}</strong>
              </div>
            </div>

            <div className="formGrid">
              <TextField label="First name" value={checkoutForm.firstName} onChange={(value) => setCheckoutForm((current) => ({ ...current, firstName: value }))} />
              <TextField label="Last name" value={checkoutForm.lastName} onChange={(value) => setCheckoutForm((current) => ({ ...current, lastName: value }))} />
              <TextField label="Email" value={checkoutForm.emailAddress} onChange={(value) => setCheckoutForm((current) => ({ ...current, emailAddress: value }))} />
              <TextField label="Shipping" value={checkoutForm.shippingAddress} onChange={(value) => setCheckoutForm((current) => ({ ...current, shippingAddress: value }))} />
              <TextField label="Invoice" value={checkoutForm.invoiceAddress} onChange={(value) => setCheckoutForm((current) => ({ ...current, invoiceAddress: value }))} />
            </div>

            <div className="stackButtons">
              <button type="button" className="primaryButton" onClick={checkoutBasket} disabled={!token || !items.length}>
                Place order
              </button>
              <button type="button" className="secondaryButton" onClick={clearBasket} disabled={!token || !items.length}>
                Clear basket
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

