export function FashionImage({ src, fallback, alt = '', className, ...props }) {
  return (
    <img
      {...props}
      className={className}
      src={src || fallback}
      alt={alt}
      onError={(event) => {
        if (event.currentTarget.src !== fallback) {
          event.currentTarget.src = fallback
        }
      }}
    />
  )
}
