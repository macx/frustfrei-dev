import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { unified } from '@astrojs/markdown-remark'
import icon from 'astro-icon'
import sitemap from '@astrojs/sitemap'
import rehypeExpressiveCode from 'rehype-expressive-code'
import { remarkModifiedTime } from './remark-plugins/remark-modified-time.mjs'
import { remarkReadingTime } from './remark-plugins/remark-reading-time.mjs'
import { remarkWidont } from './remark-plugins/remark-widont.mjs'
import {
  remarkDefinitionList,
  defListHastHandlers
} from 'remark-definition-list'

import rehypeExternalLinks from 'rehype-external-links'
import rehypeAutoLinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'

import rehypeMermaid from '@beoe/rehype-mermaid'
import { getCache } from '@beoe/cache'

const cache = await (async () => {
  try {
    return await getCache()
  } catch (error) {
    const reason =
      error instanceof Error && error.message
        ? ` (${error.message.split('\n')[0]})`
        : ''
    console.warn(
      `[astro] Falling back to in-memory Mermaid cache${reason}. ` +
        'Tip: run `pnpm rebuild better-sqlite3` after Node upgrades.'
    )
    return new Map()
  }
})()

// https://astro.build/config
export default defineConfig({
  site: 'https://frustfrei.dev',
  trailingSlash: 'never',
  build: { format: 'directory' },
  redirects: {
    '/grundlagen': { status: 301, destination: '/startklar' },
    '/studium': { status: 301, destination: '/startklar' },
    '/studium/starterkit': {
      status: 301,
      destination: '/starterkit/einfuehrung'
    },
    '/studium/seminarplan': {
      status: 301,
      destination: '/startklar/seminarplan'
    },
    '/studium/abgabe': { status: 301, destination: '/startklar/abgabe' },
    '/links': { status: 301, destination: '/dokumentation' },
    '/hilfe': '/dokumentation',
    '/starterkit/entwicklungsumgebung': {
      status: 301,
      destination: '/dokumentation/entwicklung'
    },
    '/starterkit/setup': {
      status: 301,
      destination: '/dokumentation/entwicklung'
    },
    '/starterkit/terminal': {
      status: 301,
      destination: '/dokumentation/entwicklung/terminal'
    },
    '/starterkit/nodejs': {
      status: 301,
      destination: '/dokumentation/entwicklung/nodejs'
    },
    '/starterkit/git': {
      status: 301,
      destination: '/dokumentation/entwicklung/git'
    },
    '/starterkit/corepack': {
      status: 301,
      destination: '/dokumentation/entwicklung/nodejs'
    },
    '/starterkit/homebrew-chocolatey': {
      status: 301,
      destination: '/dokumentation/entwicklung/nodejs'
    },
    '/starterkit/checks': {
      status: 301,
      destination: '/dokumentation/entwicklung/nodejs'
    },
    '/starterkit/troubleshooting': {
      status: 301,
      destination: '/dokumentation/entwicklung/troubleshooting'
    },
    '/seminar': '/',
    '/tutorials/lernpfade': '/tutorials/lernpfade/einfuehrung',
    '/tutorials/art-direction-im-kreditantragsprozess': {
      status: 301,
      destination: '/tutorials/responsive-images'
    }
  },
  markdown: {
    syntaxHighlight: false,
    processor: unified({
      gfm: true,
      smartypants: true,
      remarkRehype: {
        handlers: { ...defListHastHandlers },
        footnoteLabel: 'Fußnoten',
        footnoteBackLabel: 'Zurück zum Inhalt'
      },
      remarkPlugins: [
        remarkWidont,
        remarkDefinitionList,
        remarkModifiedTime,
        remarkReadingTime
      ],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeMermaid,
          {
            strategy: 'file',
            fsPath: 'public/beoe',
            webPath: '/beoe',
            darkScheme: 'class',
            cache
          }
        ],
        [
          rehypeAutoLinkHeadings,
          {
            content: {
              type: 'element',
              tagName: 'span',
              properties: { className: 'heading-icon' },
              children: []
            }
          }
        ],
        [
          rehypeExpressiveCode,
          {
            themes: ['catppuccin-frappe', 'catppuccin-latte'],
            themeCssSelector: (theme) => `[data-code-theme='${theme.name}']`,
            useDarkModeMediaQuery: false,
            styleOverrides: {}
          }
        ],
        [rehypeExternalLinks, {}]
      ]
    })
  },
  integrations: [
    mdx(),
    sitemap({
      lastmod: new Date(),
      filter: (page) =>
        page !== 'https://frustfrei.dev/impressum' &&
        page !== 'https://frustfrei.dev/datenschutz'
    }),
    icon({
      include: {
        materialSymbols: [
          'menu',
          'close',
          'monitor-outline',
          'arrow-upward-rounded',
          'keyboard-double-arrow-left',
          'keyboard-double-arrow-right',
          'keyboard-arrow-left',
          'keyboard-arrow-right',
          'schedule-outline'
        ],
        simpleIcons: ['discord', 'github']
      },
      svgoOptions: {
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,

                inlineStyles: { onlyMatchedOnce: false }
              }
            }
          }
        ]
      }
    })
  ],
  vite: {
    css: {
      devSourcemap: true,
      transformer: 'lightningcss'
    },
    build: {
      cssMinify: 'lightningcss'
    }
  },
  image: { responsiveStyles: true },
  experimental: {}
})
