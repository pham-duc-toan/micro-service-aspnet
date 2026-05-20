import fallbackHero from '../assets/hero.png'

const FASHION_MEDIA = [
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
]

export const heroMedia = FASHION_MEDIA[0]
export const collectionMedia = {
  women: FASHION_MEDIA[1],
  men: FASHION_MEDIA[2],
  accessories: FASHION_MEDIA[3],
  sale: FASHION_MEDIA[4],
}

export function productMedia(seed) {
  const hash = Array.from(String(seed || 'fashion')).reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return FASHION_MEDIA[hash % FASHION_MEDIA.length]
}

export function fallbackMedia() {
  return fallbackHero
}

