import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div>
      <h1>Kade Angell</h1>
      <p>New portfolio coming soon.</p>
      <p>
        <a href="/legacy">View previous portfolio</a>
      </p>
    </div>
  )
}
