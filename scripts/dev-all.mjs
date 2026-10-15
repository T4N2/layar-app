import { spawn } from 'node:child_process'
import process from 'node:process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* Menjalankan server media + Vite dev server sekaligus. */

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

const children = []
let stopping = false

function shutdown() {
  if (stopping) return
  stopping = true
  for (const child of children) {
    try {
      child.kill()
    } catch {
      /* sudah mati */
    }
  }
  process.exit(0)
}

function run(name, script, args = []) {
  // stdin diabaikan: saat dijalankan tanpa TTY, 'inherit' bikin spawn gagal
  // ("stdin is not a tty").
  const child = spawn(process.execPath, [script, ...args], {
    cwd: root,
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  children.push(child)
  child.on('exit', (code) => {
    if (stopping) return
    console.log(`[dev:all] ${name} berhenti (kode ${code})`)
    shutdown()
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

run('media', path.join(root, 'server', 'media-server.mjs'))
run('vite', path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'))
