import { Filter, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { SelectField } from '../components/Field'
import { COLLECTIONS } from '../storefront/constants'
import { useStorefront } from '../storefront/StorefrontContext'

export function ShopPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    products,
    visibleProducts,
    displayProducts,
    displayCount,
    setDisplayCount,
    productQuery,
    setProductQuery,
    sortMode,
    setSortMode,
    stockCache,
    addToBasket,
    ensureStock,
  } = useStorefront()

  const searchValue = searchParams.get('q') ?? productQuery

  useEffect(() => {
    const query = searchParams.get('q') ?? ''
    if (query !== productQuery) {
      setProductQuery(query)
    }
    const sortParam = searchParams.get('sort')
    if (sortParam) {
      const nextSort = sortParam === 'new' ? 'featured' : sortParam
      if (nextSort !== sortMode) {
        setSortMode(nextSort)
      }
    }
  }, [searchParams, productQuery, sortMode, setProductQuery, setSortMode])

  function updateQuery(value) {
    setProductQuery(value)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  function resetFilters() {
    setProductQuery('')
    setSortMode('featured')
    setDisplayCount(12)
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="pageStack">
      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Shop</h2>
            <p>Search the catalog, filter by collection, and add items straight to basket.</p>
          </div>
          <div className="sectionTools">
            {COLLECTIONS.slice(0, 3).map((collection) => (
              <button key={collection.id} type="button" className="ghostButton" onClick={() => updateQuery(collection.query)}>
                {collection.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sectionTools shopTools">
          <label className="inputShell">
            <Search size={16} />
            <input value={searchValue} onChange={(event) => updateQuery(event.target.value)} placeholder="Search jackets, dresses, denim..." />
          </label>
          <SelectField
            label="Sort"
            value={sortMode}
            onChange={setSortMode}
            options={[
              ['featured', 'Featured'],
              ['stock', 'Stock'],
              ['price-desc', 'Price high'],
              ['price-asc', 'Price low'],
              ['name', 'Name'],
            ]}
            icon={<SlidersHorizontal size={16} />}
          />
          <button type="button" className="ghostButton" onClick={resetFilters}>
            <Filter size={16} />
            <span>Reset</span>
          </button>
          <Link className="secondaryButton" to="/cart">
            <span>Cart</span>
          </Link>
        </div>
      </section>

      <section className="band">
        <div className="productGrid">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.no}
              product={product}
              stock={stockCache[product.no]}
              onView={() => navigate(`/product/${product.no}`)}
              onAdd={() => {
                void ensureStock(product.no)
                void addToBasket(product, 1)
              }}
              canEdit={false}
            />
          ))}
        </div>

        {visibleProducts.length < displayProducts.length ? (
          <div className="loadMoreRow">
            <button type="button" className="secondaryButton" onClick={() => setDisplayCount(displayCount + 12)}>
              Load more
            </button>
          </div>
        ) : null}

        {!products.length ? (
          <div className="emptyState large">
            <div>
              <strong>No products loaded</strong>
              <p>Sign in or refresh the storefront to fetch catalog data.</p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
