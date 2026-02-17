/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { CRTOverlay } from '~/components/CRTOverlay'
import '~/styles/app.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Kade Angell' },
      { name: 'description', content: "Kade Angell's Portfolio" },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <NuqsAdapter>
        <Outlet />
      </NuqsAdapter>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator&&!window.crossOriginIsolated){navigator.serviceWorker.register("/coi-serviceworker.js").then(function(r){if(r.active&&!navigator.serviceWorker.controller){window.location.reload()}else if(!r.active){var s=r.installing||r.waiting;if(s)s.addEventListener("statechange",function(){if(s.state==="activated")window.location.reload()})}})}`,
          }}
        />
      </head>
      <body className="m-0 p-0 bg-black overflow-hidden">
        <div className="crt-warp h-screen w-screen overflow-auto">
          {children}
        </div>
        {/* <CRTOverlay /> */}
        <Scripts />
      </body>
    </html>
  )
}
