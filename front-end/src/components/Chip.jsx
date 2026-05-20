export function Chip({ tone = 'neutral', children }) {
  return <span className={`chip ${tone}`}>{children}</span>
}
