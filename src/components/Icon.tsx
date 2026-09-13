export type IconName =
  | 'search' | 'bag' | 'heart' | 'user' | 'arrow' | 'close' | 'menu' | 'chevron'
  | 'grid' | 'tag' | 'box' | 'chart' | 'logout' | 'plus' | 'minus' | 'edit' | 'trash' | 'store'

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (name === 'search') return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
  if (name === 'bag') return <svg {...common}><path d="M5 8.5h14l1 12H4l1-12Z" /><path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9" /></svg>
  if (name === 'heart') return <svg {...common}><path d="M20.8 8.9c0 5.4-8.8 10.3-8.8 10.3S3.2 14.3 3.2 8.9A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.8 2.2Z" /></svg>
  if (name === 'user') return <svg {...common}><circle cx="12" cy="8" r="3.4" /><path d="M5.1 20c.6-3.4 3-5.2 6.9-5.2s6.3 1.8 6.9 5.2" /></svg>
  if (name === 'arrow') return <svg {...common}><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></svg>
  if (name === 'close') return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>
  if (name === 'menu') return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
  if (name === 'grid') return <svg {...common}><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></svg>
  if (name === 'tag') return <svg {...common}><path d="M4 4h7l9 9-7 7-9-9V4Z" /><circle cx="8.5" cy="8.5" r="1.4" /></svg>
  if (name === 'box') return <svg {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M4 7.5 12 12l8-4.5" /><path d="M12 12v9" /></svg>
  if (name === 'chart') return <svg {...common}><path d="M6 20v-9" /><path d="M12 20V5" /><path d="M18 20v-6" /><path d="M3 20h18" /></svg>
  if (name === 'logout') return <svg {...common}><path d="M9 4H5v16h4" /><path d="m14 8 4 4-4 4" /><path d="M18 12H8" /></svg>
  if (name === 'plus') return <svg {...common}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
  if (name === 'minus') return <svg {...common}><path d="M5 12h14" /></svg>
  if (name === 'edit') return <svg {...common}><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m13.5 6.5 3 3" /></svg>
  if (name === 'trash') return <svg {...common}><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="m6 7 1 13h10l1-13" /><path d="M10 11v5M14 11v5" /></svg>
  if (name === 'store') return <svg {...common}><path d="M4 9 5.5 4h13L20 9" /><path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" /><path d="M5 11v9h14v-9" /><path d="M9 20v-5h6v5" /></svg>
  return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>
}
