/**
 * Generic data table with column definitions.
 *
 * Usage:
 *   <DataTable
 *     columns={[{key:'name', label:'Name'}, {key:'code', label:'Code'}]}
 *     rows={items}
 *     actions={(row) => <button onClick={() => edit(row)}>Edit</button>}
 *     loading={loading}
 *   />
 */
export default function DataTable({ columns, rows, actions, loading, emptyText = 'No data found.' }) {
  if (loading) return <p className="text-neutral-400 text-sm py-6 text-center">Loading...</p>

  return (
    <div className="overflow-x-auto rounded-xl border border-primary-600/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary-800/80 text-neutral-400 text-left">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 font-medium whitespace-nowrap">
                {col.label}
              </th>
            ))}
            {actions && <th className="px-4 py-3 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center text-neutral-400 py-8">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id ?? i}
                className="border-t border-primary-600/10 hover:bg-primary-800/40 transition-colors"
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-2.5">
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-2.5 text-right space-x-2">{actions(row)}</td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
