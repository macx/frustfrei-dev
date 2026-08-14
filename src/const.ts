export interface siteConfig {
  site: string
  title: string
  description: string
  links: { [key: string]: string }
}

export const SITE_CONST: siteConfig = {
  site: 'https://frustfrei.dev',
  title: 'frustfrei.dev',
  description:
    'Lerne, wie du Websites mit HTML, CSS und guter UI/UX frustfrei erstellst.',
  links: {
    discord: 'https://discord.gg/Kke2BsapYu',
    github: 'https://github.com/hawk-gt1191'
  }
}

export interface TagAbbrevation {
  [key: string]: string
}

const tagAbbrevations: TagAbbrevation = {
  html: 'HTML',
  css: 'CSS',
  sass: 'Sass',
  js: 'JavaScript',
  ts: 'TypeScript',
  socialmedia: 'Social Media',
  showcase: 'Showcase',
  images: 'Bilder',
  typografie: 'Typografie',
  webfonts: 'Webfonts',
  zeichen: 'Zeichen',
  historie: 'Historie'
}

export function getTagLongform(tag: string): string {
  return tagAbbrevations[tag] || tag
}
