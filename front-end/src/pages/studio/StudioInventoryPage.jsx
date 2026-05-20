import { Boxes, Minus, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { Table } from '../../components/Table'
import { TextField } from '../../components/Field'
import { formatNumber } from '../../storefront/format'
import { useStorefront } from '../../storefront/StorefrontContext'

export function StudioInventoryPage() {
  const {
    inventoryForm,
    setInventoryForm,
    inventoryRows,
    inventoryPageRows,
    inventoryDeleteId,
    setInventoryDeleteId,
    loadInventoryHistory,
    loadInventoryPage,
    purchaseInventory,
    saleInventory,
    saleOrderInventory,
    deleteInventoryEntry,
  } = useStorefront()

  return (
    <div className="pageStack">
      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Inventory</h2>
            <p>Inspect stock history and post movements through the inventory API.</p>
          </div>
        </div>

        <div className="splitView">
          <div className="pane">
            <div className="formGrid">
              <TextField label="Item no" value={inventoryForm.itemNo} onChange={(value) => setInventoryForm((current) => ({ ...current, itemNo: value }))} />
              <TextField label="Quantity" type="number" value={inventoryForm.quantity} onChange={(value) => setInventoryForm((current) => ({ ...current, quantity: value }))} />
              <TextField label="External doc" value={inventoryForm.externalDocNo} onChange={(value) => setInventoryForm((current) => ({ ...current, externalDocNo: value }))} />
              <TextField label="Sale order" value={inventoryForm.saleOrderNo} onChange={(value) => setInventoryForm((current) => ({ ...current, saleOrderNo: value }))} />
              <TextField label="Page index" type="number" value={inventoryForm.pageIndex} onChange={(value) => setInventoryForm((current) => ({ ...current, pageIndex: value }))} />
              <TextField label="Page size" type="number" value={inventoryForm.pageSize} onChange={(value) => setInventoryForm((current) => ({ ...current, pageSize: value }))} />
              <TextField label="Search" value={inventoryForm.searchTerm} onChange={(value) => setInventoryForm((current) => ({ ...current, searchTerm: value }))} />
              <TextField label="Delete id" value={inventoryDeleteId} onChange={setInventoryDeleteId} />
            </div>

            <div className="stackButtons">
              <button type="button" className="ghostButton" onClick={() => loadInventoryHistory(inventoryForm.itemNo)}>
                <Search size={16} />
                <span>History</span>
              </button>
              <button type="button" className="ghostButton" onClick={() => loadInventoryPage(inventoryForm.itemNo)}>
                <Boxes size={16} />
                <span>Paging</span>
              </button>
              <button type="button" className="primaryButton" onClick={purchaseInventory}>
                <Plus size={16} />
                <span>Purchase</span>
              </button>
              <button type="button" className="secondaryButton" onClick={saleInventory}>
                <Minus size={16} />
                <span>Sale</span>
              </button>
              <button type="button" className="ghostButton" onClick={saleOrderInventory}>
                <RefreshCcw size={16} />
                <span>Sale order</span>
              </button>
              <button type="button" className="ghostButton danger" onClick={deleteInventoryEntry}>
                <Trash2 size={16} />
                <span>Delete entry</span>
              </button>
            </div>
          </div>

          <div className="pane">
            <div className="sectionHeader compact">
              <div>
                <h3>History</h3>
                <p>Current movements for the selected item.</p>
              </div>
            </div>
            <Table
              rows={inventoryRows}
              empty="No history loaded"
              columns={[
                { key: 'documentNo', label: 'Doc no' },
                { key: 'itemNo', label: 'Item' },
                { key: 'quantity', label: 'Qty', render: (row) => formatNumber(row.quantity) },
                { key: 'externalDocumentNo', label: 'External' },
              ]}
            />

            <div className="sectionHeader compact inventorySubhead">
              <div>
                <h3>Paging</h3>
                <p>Server-side slice of inventory movements.</p>
              </div>
            </div>
            <Table
              rows={inventoryPageRows}
              empty="No paging data loaded"
              columns={[
                { key: 'documentNo', label: 'Doc no' },
                { key: 'itemNo', label: 'Item' },
                { key: 'quantity', label: 'Qty' },
                { key: 'externalDocumentNo', label: 'External' },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
