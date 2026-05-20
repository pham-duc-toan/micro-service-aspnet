import { Database } from 'lucide-react'
import { asText } from '../storefront/format'

export function Table({ rows, columns, empty = 'No data' }) {
  const items = Array.isArray(rows) ? rows : []
  if (!items.length) {
    return (
      <div className="emptyState">
        <Database size={18} />
        <div>
          <strong>{empty}</strong>
          <p>Load data from the live backend.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => (
            <tr key={row.id || row.documentNo || row.itemNo || index}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : asText(row[column.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
