import { Edit3, Eye, Heart, ShoppingCart } from 'lucide-react'
import { Chip } from './Chip'
import { accentTone, formatMoney, formatNumber } from '../storefront/format'
import { FashionImage } from './FashionImage'
import { fallbackMedia, productMedia } from '../storefront/media'

export function ProductCard({ product, stock, onView, onAdd, canEdit, onEdit }) {
  const amount = stock?.status === 'ready' ? stock.total : null
  const tone = accentTone(product.no)
  const label = amount === null ? 'Stock pending' : amount > 0 ? `${formatNumber(amount)} in stock` : 'Out of stock'

  return (
    <article className="productCard" style={{ '--accent': tone.accent, '--accent-soft': tone.soft }}>
      <div className="productVisual">
        <FashionImage src={productMedia(product.no)} fallback={fallbackMedia()} alt="" className="productImage" aria-hidden="true" />
        <div className="productVisualBadge">
          <Chip tone={amount === null ? 'neutral' : amount > 0 ? 'positive' : 'warning'}>{label}</Chip>
          <Chip tone="info">{product.no}</Chip>
        </div>
      </div>
      <div className="productBody">
        <div className="productHeading">
          <div>
            <strong>{product.name}</strong>
            <p>{product.summary}</p>
          </div>
          <span className="priceTag">{formatMoney(product.price)}</span>
        </div>
        <p className="productCopy">{product.description}</p>
        <div className="cardActions">
          <button type="button" className="ghostButton" onClick={onView}>
            <Eye size={16} />
            <span>View</span>
          </button>
          <button type="button" className="ghostButton" onClick={onAdd} disabled={amount === 0}>
            <Heart size={16} />
            <span>Save</span>
          </button>
          <button type="button" className="primaryButton" onClick={onAdd} disabled={amount === 0}>
            <ShoppingCart size={16} />
            <span>Add</span>
          </button>
          {canEdit ? (
            <button type="button" className="iconButton" onClick={onEdit} title="Edit">
              <Edit3 size={14} />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
