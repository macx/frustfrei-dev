import { getCollection, type CollectionEntry } from 'astro:content'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { OGImageRoute } from 'astro-og-canvas'

const tutorials = await getCollection('tutorials', ({ data }) => {
  return import.meta.env.PROD ? data.isDraft !== true : true
})

const pages = Object.fromEntries(
  tutorials.map((tutorial) => [tutorial.id, tutorial])
)

const COVER_CACHE_DIR = './node_modules/.cache/og-covers'

// astro-og-canvas draws bgImage fully opaque, with no blur/scrim support of
// its own (unlike our previous @vercel/og layout). To keep title/description
// text legible over busy tutorial cover photos, pre-bake a blurred + lightly
// tinted version of each cover with sharp and use that as the background
// instead of the original.
async function getLegibleBackground(coverImagePath: string): Promise<string> {
  await fs.mkdir(COVER_CACHE_DIR, { recursive: true })
  const cachePath = path.join(
    COVER_CACHE_DIR,
    `${coverImagePath.replaceAll('/', '_')}.jpg`
  )

  if (
    await fs
      .access(cachePath)
      .then(() => true)
      .catch(() => false)
  ) {
    return cachePath
  }

  const scrim = Buffer.from(
    `<svg width="1200" height="630"><rect width="100%" height="100%" fill="#edf0f2" fill-opacity="0.55"/></svg>`
  )

  await sharp(coverImagePath)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .blur(12)
    .composite([{ input: scrim, top: 0, left: 0 }])
    .jpeg({ quality: 82 })
    .toFile(cachePath)

  return cachePath
}

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  // Astro's routing already appends the literal "/og.png" from this file's
  // path — the slug only needs to be the plain tutorial id, not id + '.png'.
  getSlug: (id) => id,
  getImageOptions: async (_id, tutorial: CollectionEntry<'tutorials'>) => {
    const coverField = tutorial.data.cover
    const coverImagePath = coverField
      ? 'path' in coverField
        ? coverField.path.replace(/^\//, '')
        : (coverField as { image?: { src?: string } }).image?.src?.replace(
            /^\//,
            ''
          )
      : undefined

    const bgImagePath = coverImagePath
      ? await getLegibleBackground(coverImagePath)
      : undefined

    return {
      title: tutorial.data.title,
      description: tutorial.data.description,
      logo: {
        path: './src/images/frustfrei-wordmark-og.png',
        size: [200]
      },
      bgImage: bgImagePath
        ? { path: bgImagePath, fit: 'cover' as const }
        : undefined,
      bgGradient: [[237, 240, 242]],
      border: { color: [0, 79, 205], width: 8, side: 'block-end' as const },
      padding: 60,
      font: {
        title: {
          size: 58,
          lineHeight: 1.15,
          weight: 'Bold' as const,
          color: [21, 35, 45],
          families: ['Domine']
        },
        description: {
          size: 30,
          weight: 'SemiBold' as const,
          color: [21, 35, 45],
          families: ['Open Sans']
        }
      },
      fonts: [
        './src/fonts/Domine-Bold.ttf',
        './src/fonts/OpenSans-SemiBold.ttf'
      ]
    }
  }
})
