import { ArrowLeft, Boxes, ShoppingCart } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Chip } from '../components/Chip'
import { FashionImage } from '../components/FashionImage'
import { Table } from '../components/Table'
import { TextField } from '../components/Field'
import { fallbackMedia, productMedia } from '../storefront/media'
import { DOCUMENT_TYPES } from '../storefront/constants'
import { formatMoney, formatNumber } from '../storefront/format'
import { useStorefront } from '../storefront/StorefrontContext'

export function ProductPage() {
  const navigate = useNavigate()
  const { productNo } = useParams()
  const {
    products,
    selectedProductNo,
    setSelectedProductNo,
    selectedProduct,
    selectedProductStock,
    selectedProductRows,
    sheetQty,
    setSheetQty,
    addToBasket,
    can,
    ensureStock,
  } = useStorefront()

  useEffect(() => {
    if (productNo && productNo !== selectedProductNo) {
      setSelectedProductNo(productNo)
    }
    if (productNo) {
      void ensureStock(productNo)
    }
  }, [productNo, selectedProductNo, setSelectedProductNo, ensureStock])

  const product = selectedProduct || products.find((item) => item.no === productNo) || null

  if (!product) {
    return (
      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Product not found</h2>
            <p>The selected item is not in the current catalog state.</p>
          </div>
        </div>
        <Link className="secondaryButton" to="/shop">
          <ArrowLeft size={16} />
          <span>Back to shop</span>
        </Link>
      </section>
    )
  }

  const stockTotal = selectedProductStock?.status === 'ready' ? selectedProductStock.total : null

  return (
    <div className="pageStack">
      <section className="band productDetail">
        <div className="detailVisual">
          <FashionImage src={productMedia(product.no)} fallback={fallbackMedia()} alt="" aria-hidden="true" />
        </div>

        <div className="detailCopy">
          <div className="detailHeader">
            <div className="chipRow">
              <Chip tone="info">{product.no}</Chip>
              <Chip tone={stockTotal > 0 ? 'positive' : 'warning'}>
                {stockTotal === null ? 'Stock pending' : `${formatNumber(stockTotal)} in stock`}
              </Chip>
            </div>
            <h2>{product.name}</h2>
            <p>{product.summary}</p>
            <strong className="priceTag detailPrice">{formatMoney(product.price)}</strong>
          </div>

          <p className="productCopy">{product.description}</p>

          <div className="formGrid">
            <TextField label="Quantity" type="number" value={sheetQty} onChange={setSheetQty} />
          </div>

          <div className="stackButtons">
            <button type="button" className="primaryButton" onClick={() => addToBasket(product, Number(sheetQty || 1))}>
              <ShoppingCart size={16} />
              <span>Add to basket</span>
            </button>
            <Link className="secondaryButton" to="/cart">
              <span>Go to cart</span>
            </Link>
            {can('PRODUCT', 'UPDATE') ? (
              <Link className="ghostButton" to="/studio/catalog">
                <Boxes size={16} />
                <span>Edit catalog</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="band splitView">
        <div className="pane">
          <div className="sectionHeader compact">
            <div>
              <h3>Stock history</h3>
              <p>Warehouse movements served from the inventory API.</p>
            </div>
          </div>
          <Table
            rows={selectedProductRows}
            empty="No stock history"
            columns={[
              { key: 'documentNo', label: 'Doc no' },
              {
                key: 'documentType',
                label: 'Type',
                render: (row) => DOCUMENT_TYPES[row.documentType] || row.documentType,
              },
              { key: 'quantity', label: 'Qty' },
              { key: 'externalDocumentNo', label: 'External' },
            ]}
          />
        </div>

        <div className="pane">
          <div className="sectionHeader compact">
            <div>
              <h3>More styles</h3>
              <p>Related products from the same live catalog.</p>
            </div>
          </div>
          <div className="productGrid compactGrid">
            {products
              .filter((item) => item.no !== product.no)
              .slice(0, 4)
              .map((item) => (
                <button key={item.no} type="button" className="miniProduct" onClick={() => navigate(`/product/${item.no}`)}>
                  <FashionImage src={productMedia(item.no)} fallback={fallbackMedia()} alt="" aria-hidden="true" />
                  <strong>{item.name}</strong>
                  <span>{formatMoney(item.price)}</span>
                </button>
              ))}
          </div>
        </div>
      </section>
    </div>
  )
}

