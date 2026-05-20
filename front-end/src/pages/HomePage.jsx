import { ArrowRight, RefreshCcw, ShoppingBag, Sparkles, Truck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { HeroBanner } from '../components/HeroBanner'
import { ProductCard } from '../components/ProductCard'
import { Chip } from '../components/Chip'
import { COLLECTIONS } from '../storefront/constants'
import { collectionMedia } from '../storefront/media'
import { formatNumber } from '../storefront/format'
import { useStorefront } from '../storefront/StorefrontContext'

export function HomePage() {
  const navigate = useNavigate()
  const { token, refreshStorefront, cartCount, productCount, orderCount, quickMetrics, visibleProducts, addToBasket, can } = useStorefront()
  const featuredProducts = visibleProducts.slice(0, 4)

  return (
    <div className="pageStack">
      <HeroBanner
        token={token}
        quickMetrics={quickMetrics}
        onPrimary={() => (token ? refreshStorefront() : navigate('/account'))}
        onSecondary={() => navigate('/shop')}
      />

      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Collections</h2>
            <p>Editorial picks shaped like a real clothing store, not a demo dashboard.</p>
          </div>
          <div className="sectionTools">
            <Chip tone="info">{formatNumber(productCount)} products</Chip>
            <Chip tone="positive">{formatNumber(cartCount)} in cart</Chip>
            <Chip tone="neutral">{formatNumber(orderCount)} orders</Chip>
          </div>
        </div>

        <div className="collectionGrid">
          {COLLECTIONS.map((collection) => (
            <Link key={collection.id} to={`/shop?q=${encodeURIComponent(collection.query)}`} className="collectionTile">
              <img src={collectionMedia[collection.id]} alt="" aria-hidden="true" />
              <div className="collectionMeta">
                <strong>{collection.label}</strong>
                <span>
                  Browse {collection.label.toLowerCase()} edits
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Featured looks</h2>
            <p>Fast access to the current live catalog and basket flow.</p>
          </div>
          <div className="sectionTools">
            <Link className="ghostButton" to="/shop">
              <ShoppingBag size={16} />
              <span>Shop all</span>
            </Link>
            {can('PRODUCT', 'VIEW') ? (
              <Link className="secondaryButton" to="/studio">
                <Sparkles size={16} />
                <span>Merchant center</span>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="productGrid">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.no}
              product={product}
              stock={null}
              onView={() => navigate(`/product/${product.no}`)}
              onAdd={() => addToBasket(product, 1)}
              canEdit={false}
            />
          ))}
        </div>
      </section>

      <section className="band">
        <div className="featureRail">
          <div className="featureItem">
            <Truck size={18} />
            <div>
              <strong>Live backend checkout</strong>
              <p>Basket, orders, and inventory all call through the gateway.</p>
            </div>
          </div>
          <div className="featureItem">
            <RefreshCcw size={18} />
            <div>
              <strong>One refresh, real data</strong>
              <p>Reload catalog, basket, and orders without leaving the storefront.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

