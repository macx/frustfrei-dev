type StudiumPage = {
  url: string
  default?: {
    url?: string
    frontmatter?: {
      title?: string
      description?: string
      heroImage?: string
    }
  }
  frontmatter?: {
    title?: string
    description?: string
    heroImage?: string
  }
}

const pages = import.meta.glob<StudiumPage>('../pages/startklar/*.mdx', {
  eager: true
})

export const abgabe = pages['../pages/startklar/abgabe.mdx']
export const seminarplan = pages['../pages/startklar/seminarplan.mdx']

export const entries = [
  {
    key: 'seminarplan',
    page: seminarplan,
    cta: 'Zum Seminarplan',
    fallback: {
      url: '/startklar/seminarplan',
      title: 'Seminarplan',
      description:
        'Alle Seminare im Semester mit Ort, Kurzinfo und direkten Links zu Aufzeichnungen und Dateien.',
      heroImage: '/src/images/pages/laptop-ide-rocket.png'
    }
  },
  {
    key: 'abgabe',
    page: abgabe,
    cta: 'Zum finalen Check',
    fallback: {
      url: '/startklar/abgabe',
      title: 'Finaler Check',
      description:
        'Hier findest du alles, was du für einen erfolgreichen Abschluss deines Projekts wissen musst. Nutze diese Seite als interaktiven Leitfaden, um dein Projekt selbst zu bewerten.',
      heroImage: '/src/images/pages/laptop-website-rocket.png'
    }
  }
]
  .filter((entry) => entry.page)
  .map((entry) => {
    const frontmatter =
      entry.page.frontmatter ?? entry.page.default?.frontmatter

    return {
      ...entry,
      url: entry.page.url ?? entry.page.default?.url ?? entry.fallback.url,
      title: frontmatter?.title ?? entry.fallback.title,
      description: frontmatter?.description ?? entry.fallback.description,
      heroImage: frontmatter?.heroImage ?? entry.fallback.heroImage
    }
  })
