// Gera os ícones PWA / favicons / apple-touch-icon e o logo usado dentro do
// app a partir do arquivo-fonte public/logo_belook.jpg (o símbolo fica no
// canto esquerdo da logo horizontal — o texto "BELOOK" é recortado fora).
// Rodar com: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')
const assetsDir = path.join(root, 'src', 'assets')
mkdirSync(publicDir, { recursive: true })
mkdirSync(assetsDir, { recursive: true })

const source = path.join(publicDir, 'logo_belook.jpg')

// Recorte só do símbolo (barras + seta), sem o texto "BELOOK".
const mark = await sharp(source).extract({ left: 0, top: 0, width: 310, height: 304 }).toBuffer()

async function roundedCanvas({ size, radius, markScale }) {
  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#ffffff"/></svg>`),
      },
    ])
    .png()
    .toBuffer()

  const markWidth = Math.round(size * markScale)
  const resizedMark = await sharp(mark).resize({ width: markWidth }).toBuffer()

  return sharp(bg).composite([{ input: resizedMark, gravity: 'center' }]).png().toBuffer()
}

// Ícone padrão: fundo branco com cantos arredondados (mesmo estilo já usado no projeto).
const standard512 = await roundedCanvas({ size: 512, radius: 112, markScale: 0.7 })

// Ícone maskable: fundo branco 100% quadrado (o SO aplica a própria máscara),
// símbolo um pouco menor para respeitar a safe zone.
const maskable512 = await roundedCanvas({ size: 512, radius: 0, markScale: 0.6 })

const targets = [
  { buffer: standard512, out: 'icon-192.png', size: 192 },
  { buffer: standard512, out: 'icon-512.png', size: 512 },
  { buffer: standard512, out: 'apple-touch-icon.png', size: 180 },
  { buffer: standard512, out: 'favicon-32.png', size: 32 },
  { buffer: standard512, out: 'favicon-16.png', size: 16 },
  { buffer: maskable512, out: 'icon-maskable-192.png', size: 192 },
  { buffer: maskable512, out: 'icon-maskable-512.png', size: 512 },
]

for (const t of targets) {
  await sharp(t.buffer).resize(t.size, t.size).png().toFile(path.join(publicDir, t.out))
  console.log('generated', t.out)
}

// Logo usado dentro do app (tela de login, splash de carregamento) — o
// componente aplica arredondamento via CSS, então aqui basta um PNG nítido.
await sharp(standard512).resize(256, 256).png().toFile(path.join(assetsDir, 'logo-mark.png'))
console.log('generated src/assets/logo-mark.png')

console.log('done')
