import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import type { Plugin } from 'vite'

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function serveLegacy(): Plugin {
  return {
    name: 'serve-legacy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/legacy')) return next()

        // Redirect /legacy to /legacy/ so relative asset paths resolve correctly
        if (req.url === '/legacy' || req.url === '/legacy?') {
          res.writeHead(302, { Location: '/legacy/' })
          res.end()
          return
        }

        const baseDir = join(process.cwd(), 'public')
        const urlPath = req.url.split('?')[0]
        const candidates = [
          join(baseDir, urlPath),
          join(baseDir, urlPath, 'index.html'),
        ]

        for (const filePath of candidates) {
          if (existsSync(filePath) && statSync(filePath).isFile()) {
            const ext = extname(filePath)
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
            res.end(readFileSync(filePath))
            return
          }
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    serveLegacy(),
    tsConfigPaths(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
    viteReact(),
  ],
})
