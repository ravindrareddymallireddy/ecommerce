import { supabase } from './supabaseClient'

export type Category = 'All' | 'Dresses' | 'Tops' | 'Denim' | 'Outerwear'
export type Product = {
  id: number | string
  slug: string
  name: string
  category: Exclude<Category, 'All'>
  price: number
  color: string
  tag?: string
  image: string
  imageAlt: string
  description: string
  sizes: string[]
  inventory: number
}

export const fallbackProducts: Product[] = [
  { id: 1, slug: 'sculpted-cotton-dress', name: 'Sculpted cotton dress', category: 'Dresses', price: 168, color: 'bone', tag: 'New', image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=900&q=85', imageAlt: 'Woman in an ivory sculpted cotton dress', description: 'A softly structured cotton dress with a clean neckline, generous movement, and a shape that holds its own.', sizes: ['XS', 'S', 'M', 'L', 'XL'], inventory: 12 },
  { id: 2, slug: 'mara-wide-leg-jean', name: 'Mara wide-leg jean', category: 'Denim', price: 148, color: 'indigo', tag: 'Best seller', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85', imageAlt: 'Model wearing wide-leg indigo jeans', description: 'A high-rise, relaxed wide leg in washed indigo denim, finished with considered utility pockets.', sizes: ['24', '26', '28', '30', '32'], inventory: 24 },
  { id: 3, slug: 'linen-volume-shirt', name: 'Linen volume shirt', category: 'Tops', price: 98, color: 'chalk', image: 'https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&w=900&q=85', imageAlt: 'White linen button-up shirt', description: 'An airy linen shirt with dropped shoulders and a generous fit designed for layering.', sizes: ['XS', 'S', 'M', 'L', 'XL'], inventory: 18 },
  { id: 4, slug: 'longline-wool-coat', name: 'Longline wool coat', category: 'Outerwear', price: 298, color: 'charcoal', tag: 'Limited', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=85', imageAlt: 'Model in a tailored charcoal wool coat', description: 'A long, tailored wool coat with an easy shoulder and a warm brushed finish for the colder months.', sizes: ['XS', 'S', 'M', 'L'], inventory: 6 },
  { id: 5, slug: 'bias-silk-slip-dress', name: 'Bias silk slip dress', category: 'Dresses', price: 210, color: 'clay', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85', imageAlt: 'Woman in a clay silk slip dress', description: 'Fluid silk cut on the bias, with a considered drape that moves from day into evening.', sizes: ['XS', 'S', 'M', 'L'], inventory: 9 },
  { id: 6, slug: 'relaxed-merino-knit', name: 'Relaxed merino knit', category: 'Tops', price: 128, color: 'moss', image: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?auto=format&fit=crop&w=900&q=85', imageAlt: 'Soft green merino knit sweater', description: 'A soft merino knit with a relaxed silhouette, ribbed cuffs, and just enough structure.', sizes: ['XS', 'S', 'M', 'L', 'XL'], inventory: 14 },
  { id: 7, slug: 'atelier-pleated-trouser', name: 'Atelier pleated trouser', category: 'Denim', price: 138, color: 'ink', image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85', imageAlt: 'Tailored pleated trouser in ink', description: 'A pleated trouser with a relaxed leg and a precise waist, cut for everyday movement.', sizes: ['24', '26', '28', '30', '32'], inventory: 21 },
  { id: 8, slug: 'everyday-utility-jacket', name: 'Everyday utility jacket', category: 'Outerwear', price: 188, color: 'olive', image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=900&q=85', imageAlt: 'Olive utility jacket', description: 'A lightweight cotton jacket with practical pockets and a shape that layers easily.', sizes: ['XS', 'S', 'M', 'L', 'XL'], inventory: 11 },
]

export async function loadProducts(): Promise<Product[]> {
  if (!supabase) return fallbackProducts
  const { data, error } = await supabase.from('products').select('*').eq('is_published', true).order('created_at', { ascending: false })
  if (error || !data?.length) return fallbackProducts
  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    color: row.color,
    tag: row.tag ?? undefined,
    image: row.image_url,
    imageAlt: row.image_alt ?? row.name,
    description: row.description,
    sizes: row.sizes ?? ['XS', 'S', 'M', 'L'],
    inventory: row.inventory ?? 0,
  })) as Product[]
}
