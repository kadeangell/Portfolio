import { parseObj, type Model } from './obj'
import triangleObj from './models/triangle.obj?raw'
import triangleMtl from './models/triangle.mtl?raw'
import circleObj from './models/circle.obj?raw'
import circleMtl from './models/circle.mtl?raw'
import pentagonObj from './models/pentagon.obj?raw'
import pentagonMtl from './models/pentagon.mtl?raw'

export interface Product {
  id: string
  name: string
  tagline: string
  description: string
  model: Model
}

export const PRODUCTS: Product[] = [
  {
    id: 'triangle',
    name: 'Triangle',
    tagline: 'The simplest solid',
    description:
      'Three corners were never enough, so this one has four. A regular tetrahedron, every face an equilateral triangle, every face a different color.',
    model: parseObj(triangleObj, triangleMtl),
  },
  {
    id: 'circle',
    name: 'Circle',
    tagline: 'Round, mostly',
    description:
      'A circle that gave up on being flat. Approximated by 440 triangles and a firm belief that squinting helps. Painted in latitude bands.',
    model: parseObj(circleObj, circleMtl),
  },
  {
    id: 'pentagon',
    name: 'Pentagon',
    tagline: 'Five sides, one point',
    description:
      'A pentagonal pyramid with alternating side colors and a grey base to sit on. Sturdy, symmetrical, and slightly smug about it.',
    model: parseObj(pentagonObj, pentagonMtl),
  },
]
