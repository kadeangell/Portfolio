import { parseObj, type Model } from './obj'
import questionObj from './models/question.obj?raw'
import questionMtl from './models/question.mtl?raw'
import circleObj from './models/circle.obj?raw'
import circleMtl from './models/circle.mtl?raw'
import circlePhoto from './images/circle.png'

export interface Product {
  id: string
  name: string
  tagline: string
  description: string
  model: Model
  /** Photos shown in the detail view, after the ASCII views */
  images?: string[]
}

/** One way of looking at a product in the detail view. */
export type ProductView =
  | { kind: 'shaded'; label: string }
  | { kind: 'wire'; label: string }
  | { kind: 'photo'; label: string; src: string }

export function productViews(p: Product): ProductView[] {
  const views: ProductView[] = [
    { kind: 'shaded', label: 'Shaded' },
    { kind: 'wire', label: 'Wireframe' },
  ]
  const photos = p.images ?? []
  photos.forEach((src, i) =>
    views.push({ kind: 'photo', label: photos.length > 1 ? `Photo ${i + 1}` : 'Photo', src }),
  )
  return views
}

export const PRODUCTS: Product[] = [
  {
    id: 'question',
    name: 'Question Mark',
    tagline: '$ unknown',
    description: 'Coming soon.',
    model: parseObj(questionObj, questionMtl),
  },
  {
    id: 'circle',
    name: 'Circle',
    tagline: 'Test product',
    description: 'This is a test product.',
    model: parseObj(circleObj, circleMtl),
    images: [circlePhoto],
  },
]
