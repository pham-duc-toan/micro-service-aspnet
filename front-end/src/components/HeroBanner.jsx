import { LogIn, RefreshCcw, ShoppingBag, Sparkles } from 'lucide-react'
import { FashionImage } from './FashionImage'
import { fallbackMedia, heroMedia } from '../storefront/media'

export function HeroBanner({ token, heroImage = heroMedia, quickMetrics, onPrimary, onSecondary }) {
  return (
    <section className="heroBand">
      <FashionImage className="heroImage" src={heroImage} fallback={fallbackMedia()} alt="" aria-hidden="true" />
      <div className="heroContent">
        <p className="eyebrow">
          <Sparkles size={14} />
          Premium clothing boutique
        </p>
        <h1>Nova Atelier</h1>
        <p className="heroCopy">
          A modern clothing shop for curated looks, fast checkout, and live stock from the backend.
        </p>
        <div className="heroActions">
          <button type="button" className="primaryButton" onClick={onPrimary}>
            {token ? <RefreshCcw size={16} /> : <LogIn size={16} />}
            <span>{token ? 'Refresh catalog' : 'Sign in to shop'}</span>
          </button>
          <button type="button" className="secondaryButton" onClick={onSecondary}>
            <ShoppingBag size={16} />
            <span>Open cart</span>
          </button>
        </div>
        <div className="metricRow">
          {quickMetrics.map((metric) => (
            <div key={metric.label} className="metricChip">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
