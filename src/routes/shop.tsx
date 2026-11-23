import { createFileRoute } from '@tanstack/react-router'
import { ShopTui } from '~/components/shop/ShopTui'

export const Route = createFileRoute('/shop')({
  head: () => ({
    meta: [{ title: 'Shape Shop | Kade Angell' }],
  }),
  component: ShopTui,
})
