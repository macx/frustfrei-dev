// Curated file-type -> icon mapping for <FileTree>, using the iconify sets
// already installed in this project (material-symbols, simple-icons) instead
// of importing Starlight's own bundled Seti icon set. Covers the file types
// that actually show up in this project's file trees; anything unmatched
// falls back to DEFAULT_FILE_ICON.

export const FOLDER_ICON = 'material-symbols:folder-open-outline-rounded'
export const DEFAULT_FILE_ICON = 'material-symbols:draft-outline-rounded'

const fileIcons: Record<string, string> = {
  'package.json': 'simple-icons:npm',
  'package-lock.json': 'simple-icons:npm',
  'pnpm-lock.yaml': 'simple-icons:pnpm',
  'pnpm-workspace.yaml': 'simple-icons:pnpm',
  'yarn.lock': 'simple-icons:yarn',
  'tsconfig.json': 'material-symbols:settings-outline-rounded',
  '.gitignore': 'simple-icons:git',
  '.gitattributes': 'simple-icons:git',
  '.eslintrc': 'simple-icons:eslint',
  '.prettierrc': 'simple-icons:prettier',
  README: 'material-symbols:info-outline',
  'README.md': 'material-symbols:info-outline',
  'README.txt': 'material-symbols:info-outline'
}

const extensionIcons: Record<string, string> = {
  '.astro': 'simple-icons:astro',
  '.js': 'simple-icons:javascript',
  '.mjs': 'simple-icons:javascript',
  '.cjs': 'simple-icons:javascript',
  '.ts': 'simple-icons:typescript',
  '.mts': 'simple-icons:typescript',
  '.cts': 'simple-icons:typescript',
  '.jsx': 'simple-icons:react',
  '.tsx': 'simple-icons:react',
  '.json': 'material-symbols:data-object-rounded',
  '.md': 'simple-icons:markdown',
  '.mdx': 'simple-icons:markdown',
  '.html': 'simple-icons:html5',
  '.htm': 'simple-icons:html5',
  '.css': 'simple-icons:css3',
  '.scss': 'simple-icons:sass',
  '.sass': 'simple-icons:sass',
  '.svg': 'simple-icons:svg',
  '.png': 'material-symbols:image-outline-rounded',
  '.jpg': 'material-symbols:image-outline-rounded',
  '.jpeg': 'material-symbols:image-outline-rounded',
  '.gif': 'material-symbols:image-outline-rounded',
  '.webp': 'material-symbols:image-outline-rounded',
  '.avif': 'material-symbols:image-outline-rounded',
  '.yml': 'simple-icons:yaml',
  '.yaml': 'simple-icons:yaml',
  '.env': 'material-symbols:key-outline-rounded',
  '.lock': 'material-symbols:lock'
}

/** Return the icon name for a file based on its file name. */
export function getFileIconName(fileName: string): string {
  const trimmed = fileName.trim()
  const exact = fileIcons[trimmed]
  if (exact) return exact

  const firstDot = trimmed.indexOf('.')
  if (firstDot === -1) return DEFAULT_FILE_ICON

  let extension = trimmed.slice(firstDot)
  while (extension !== '') {
    const icon = extensionIcons[extension]
    if (icon) return icon
    const nextDot = extension.indexOf('.', 1)
    if (nextDot === -1) return DEFAULT_FILE_ICON
    extension = extension.slice(nextDot)
  }
  return DEFAULT_FILE_ICON
}
