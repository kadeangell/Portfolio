import { createFileRoute } from '@tanstack/react-router'
import { useQueryState, parseAsString } from 'nuqs'
import { Terminal } from '~/components/Terminal'
import { isDirectory } from '~/terminal/fs'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [cwd, setCwd] = useQueryState('cwd', parseAsString.withDefault('/'))
  const validCwd = isDirectory(cwd) ? cwd : '/'
  return <Terminal cwd={validCwd} setCwd={setCwd} />
}
