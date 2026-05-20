import { Edit3, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { Table } from '../../components/Table'
import { TextAreaField, TextField } from '../../components/Field'
import { formatMoney } from '../../storefront/format'
import { useStorefront } from '../../storefront/StorefrontContext'

export function StudioCatalogPage() {
  const {
    products,
    productDraft,
    setProductDraft,
    setSelectedProductNo,
    createProduct,
    updateProduct,
    deleteProduct,
    setProductQuery,
  } = useStorefront()

  function selectProduct(product) {
    setSelectedProductNo(product.no)
    setProductDraft({
      id: String(product.id || ''),
      no: product.no || '',
      name: product.name || '',
      summary: product.summary || '',
      description: product.description || '',
      price: String(product.price ?? '0'),
    })
  }

  return (
    <div className="pageStack">
      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Catalog</h2>
            <p>Create and maintain products that the storefront consumes.</p>
          </div>
          <div className="sectionTools">
            <label className="inputShell compactInput">
              <Search size={16} />
              <input value={productDraft.no} onChange={(event) => setProductDraft((current) => ({ ...current, no: event.target.value }))} placeholder="Find SKU" />
            </label>
            <button type="button" className="ghostButton" onClick={() => setProductQuery(productDraft.no)}>
              <Search size={16} />
              <span>Search shop</span>
            </button>
          </div>
        </div>

        <div className="splitView">
          <div className="pane">
            <div className="formGrid">
              <TextField label="Id" value={productDraft.id} onChange={(value) => setProductDraft((current) => ({ ...current, id: value }))} />
              <TextField label="SKU" value={productDraft.no} onChange={(value) => setProductDraft((current) => ({ ...current, no: value }))} />
              <TextField label="Name" value={productDraft.name} onChange={(value) => setProductDraft((current) => ({ ...current, name: value }))} />
              <TextField label="Price" type="number" value={productDraft.price} onChange={(value) => setProductDraft((current) => ({ ...current, price: value }))} />
              <TextField label="Summary" value={productDraft.summary} onChange={(value) => setProductDraft((current) => ({ ...current, summary: value }))} />
              <TextAreaField label="Description" value={productDraft.description} onChange={(value) => setProductDraft((current) => ({ ...current, description: value }))} />
            </div>

            <div className="stackButtons">
              <button type="button" className="primaryButton" onClick={createProduct}>
                <Plus size={16} />
                <span>Create</span>
              </button>
              <button type="button" className="secondaryButton" onClick={updateProduct}>
                <RefreshCcw size={16} />
                <span>Update</span>
              </button>
              <button type="button" className="ghostButton danger" onClick={deleteProduct}>
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="pane">
            <Table
              rows={products}
              empty="No products loaded"
              columns={[
                { key: 'no', label: 'SKU' },
                { key: 'name', label: 'Name' },
                { key: 'price', label: 'Price', render: (row) => formatMoney(row.price) },
                {
                  key: 'actions',
                  label: '',
                  render: (row) => (
                    <div className="tableActions">
                      <button type="button" className="iconButton" onClick={() => selectProduct(row)} title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="iconButton danger"
                        onClick={() => deleteProduct(row)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
