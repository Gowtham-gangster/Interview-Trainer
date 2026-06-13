/**
 * Generates PNG PWA icons from public/icons/icon.svg.
 * Requires: npm install sharp (devDependency) — run once before generate:pwa-icons.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const svgPath = path.join(root, 'public', 'icons', 'icon.svg')
const outDir = path.join(root, 'public', 'icons')

async function main() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error(
      'Missing sharp. Run: npm install --save-dev sharp\nThen: npm run generate:pwa-icons',
    )
    process.exit(1)
  }

  const svg = await readFile(svgPath)
  await mkdir(outDir, { recursive: true })

  const sizes = [
    { name: 'icon-192.png', size: 192, padding: 0 },
    { name: 'icon-512.png', size: 512, padding: 0 },
    { name: 'icon-maskable-512.png', size: 512, padding: 64 },
  ]

  for (const { name, size, padding } of sizes) {
    const inner = size - padding * 2
    const png = await sharp(svg)
      .resize(inner, inner)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 8, g: 145, b: 178, alpha: 1 },
      })
      .png()
      .toBuffer()

    await writeFile(path.join(outDir, name), png)
    console.log(`Wrote ${name}`)
  }

  console.log('PWA icons generated in public/icons/')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
