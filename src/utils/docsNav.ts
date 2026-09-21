// Auto-discovers the Doc-Navi (SectionNav) for a docs section (e.g.
// 'starterkit') from its pages under src/pages/<section>/**, the same way
// Navigation.astro derives the main header menu from frontmatter - instead
// of a hand-maintained data file. A page directly in src/pages/<section>/
// becomes a flat, ungrouped entry; a page one folder deeper (a subfolder's
// own index.mdx plus its siblings) becomes a titled group, with the
// subfolder's index.mdx supplying both the group's title and its own url
// (the group label links straight to it instead of listing it again among
// its children). Order otherwise follows the page's own `sort` frontmatter
// field (default 99).

export interface DocNavPage {
  url: string
  title: string
}

export interface DocNavGroup {
  title?: string
  url?: string
  pages: DocNavPage[]
}

const modules = await Promise.all(
  Object.entries(import.meta.glob('../pages/**/*.mdx')).map(
    async ([path, load]) => [path, await load()] as [string, any]
  )
)

function pageTitle(mod: any): string {
  return mod.frontmatter?.navTitle || mod.frontmatter?.title || ''
}

function pageSort(mod: any): number {
  return mod.frontmatter?.sort ?? 99
}

export function getSectionNav(section: string): {
  label: string
  groups: DocNavGroup[]
} {
  const rootPrefix = `../pages/${section}/`

  let label = section
  let rootPage: DocNavPage | undefined
  const flatPages: (DocNavPage & { sort: number })[] = []
  const groups = new Map<
    string,
    {
      title?: string
      indexPage?: DocNavPage
      pages: (DocNavPage & { sort: number })[]
    }
  >()

  for (const [path, mod] of modules) {
    if (
      path === `../pages/${section}.mdx` ||
      path === `${rootPrefix}index.mdx`
    ) {
      label = pageTitle(mod)
      rootPage = { url: mod.url, title: label }
      continue
    }

    if (!path.startsWith(rootPrefix)) continue

    const rest = path.slice(rootPrefix.length).replace(/\.mdx$/, '')
    const segments = rest.split('/')
    const page = { url: mod.url, title: pageTitle(mod), sort: pageSort(mod) }

    if (segments.length === 1) {
      flatPages.push(page)
    } else if (segments.length === 2) {
      const [groupSlug, fileSlug] = segments
      const group = groups.get(groupSlug) ?? { pages: [] }

      if (fileSlug === 'index') {
        group.title = page.title
        group.indexPage = { url: page.url, title: page.title }
      } else {
        group.pages.push(page)
      }

      groups.set(groupSlug, group)
    }
  }

  flatPages.sort((a, b) => a.sort - b.sort)

  const result: DocNavGroup[] = []
  const flatResult = flatPages.map(({ sort, ...page }) => page)
  if (rootPage) flatResult.unshift(rootPage)
  if (flatResult.length) result.push({ pages: flatResult })

  for (const group of groups.values()) {
    group.pages.sort((a, b) => a.sort - b.sort)
    const pages = group.pages.map(({ sort, ...page }) => page)
    result.push({ title: group.title, url: group.indexPage?.url, pages })
  }

  return { label, groups: result }
}

/**
 * Flattens a section's Doc-Navi into the single reading order it's
 * displayed in (each group's own page first, then its children, in the
 * same order as the sidebar) and returns the pages immediately before and
 * after the given URL - used for the "previous/next" footer navigation
 * between pages that build on one another.
 */
export function getAdjacentPages(
  section: string,
  currentUrl: string
): { prev?: DocNavPage; next?: DocNavPage } {
  const { groups } = getSectionNav(section)

  const flat: DocNavPage[] = []
  for (const group of groups) {
    if (group.url) flat.push({ url: group.url, title: group.title ?? '' })
    flat.push(...group.pages)
  }

  const currentPath = currentUrl.replace(/\/$/, '')
  const index = flat.findIndex((page) => page.url === currentPath)
  if (index === -1) return {}

  return {
    prev: flat[index - 1],
    next: flat[index + 1]
  }
}
