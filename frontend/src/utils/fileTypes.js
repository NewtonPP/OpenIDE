
const EXTENSION_LANGUAGES = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
  ts: 'typescript', mts: 'typescript', cts: 'typescript', tsx: 'typescript',
  json: 'json', html: 'html', htm: 'html', css: 'css', scss: 'scss', less: 'less',
  md: 'markdown', markdown: 'markdown', py: 'python', go: 'go', rs: 'rust',
  java: 'java', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp', cs: 'csharp',
  php: 'php', rb: 'ruby', sh: 'shell', bash: 'shell', zsh: 'shell',
  yml: 'yaml', yaml: 'yaml', xml: 'xml', svg: 'xml', sql: 'sql', kt: 'kotlin',
  swift: 'swift', dart: 'dart', lua: 'lua', r: 'r', toml: 'ini', ini: 'ini',
  dockerfile: 'dockerfile', graphql: 'graphql', vue: 'html',
}

const LANGUAGE_LABELS = {
  javascript: 'JavaScript', typescript: 'TypeScript', json: 'JSON', html: 'HTML',
  css: 'CSS', scss: 'SCSS', less: 'Less', markdown: 'Markdown', python: 'Python',
  go: 'Go', rust: 'Rust', java: 'Java', c: 'C', cpp: 'C++', csharp: 'C#',
  php: 'PHP', ruby: 'Ruby', shell: 'Shell Script', yaml: 'YAML', xml: 'XML',
  sql: 'SQL', kotlin: 'Kotlin', swift: 'Swift', dart: 'Dart', lua: 'Lua', r: 'R',
  ini: 'INI', dockerfile: 'Dockerfile', graphql: 'GraphQL', plaintext: 'Plain Text',
}

const EXTENSION_VISUALS = {
  js: { glyph: 'JS', color: '#e8d44d' },
  mjs: { glyph: 'JS', color: '#e8d44d' },
  cjs: { glyph: 'JS', color: '#e8d44d' },
  ts: { glyph: 'TS', color: '#3b8eea' },
  mts: { glyph: 'TS', color: '#3b8eea' },
  jsx: { kind: 'react', color: '#61dafb' },
  tsx: { kind: 'react', color: '#3b8eea' },
  json: { glyph: '{}', color: '#e5c07b' },
  html: { glyph: '<>', color: '#e44d26' },
  htm: { glyph: '<>', color: '#e44d26' },
  css: { glyph: '#', color: '#42a5f5' },
  scss: { glyph: '#', color: '#f06292' },
  less: { glyph: '#', color: '#5c8fd6' },
  md: { glyph: 'M↓', color: '#7fb4e8' },
  py: { glyph: 'PY', color: '#4b8bbe' },
  go: { glyph: 'GO', color: '#00add8' },
  rs: { glyph: 'RS', color: '#dea584' },
  java: { glyph: 'J', color: '#f89820' },
  c: { glyph: 'C', color: '#649ad2' },
  h: { glyph: 'H', color: '#a074c4' },
  cpp: { glyph: 'C+', color: '#f34b7d' },
  cs: { glyph: 'C#', color: '#9b4f96' },
  php: { glyph: 'PHP', color: '#8892bf' },
  rb: { glyph: 'RB', color: '#e0524b' },
  sh: { glyph: '$', color: '#89e051' },
  bash: { glyph: '$', color: '#89e051' },
  zsh: { glyph: '$', color: '#89e051' },
  yml: { glyph: '≡', color: '#cb7cdb' },
  yaml: { glyph: '≡', color: '#cb7cdb' },
  toml: { glyph: '≡', color: '#9c8cdb' },
  xml: { glyph: '<>', color: '#e37933' },
  sql: { glyph: 'DB', color: '#e38c00' },
  txt: { glyph: '≡', color: '#8b919e' },
  env: { glyph: '⚙', color: '#e5c07b' },
  lock: { kind: 'lock', color: '#8b919e' },
  png: { kind: 'image', color: '#a074c4' },
  jpg: { kind: 'image', color: '#a074c4' },
  jpeg: { kind: 'image', color: '#a074c4' },
  gif: { kind: 'image', color: '#a074c4' },
  webp: { kind: 'image', color: '#a074c4' },
  ico: { kind: 'image', color: '#a074c4' },
  svg: { kind: 'image', color: '#ffb13b' },
}

const FILENAME_VISUALS = {
  '.gitignore': { glyph: '◆', color: '#e06c4b' },
  '.env': { glyph: '⚙', color: '#e5c07b' },
  dockerfile: { glyph: '🐳', color: '#2496ed' },
  'package.json': { glyph: '{}', color: '#89c24a' },
  'package-lock.json': { kind: 'lock', color: '#89c24a' },
  'readme.md': { glyph: 'ℹ', color: '#7fb4e8' },
}

const FOLDER_COLORS = {
  src: '#5b9bff',
  components: '#c678dd',
  public: '#e8a33d',
  assets: '#e8a33d',
  node_modules: '#6b8e5a',
  '.git': '#e06c4b',
  test: '#52c49a',
  tests: '#52c49a',
  __tests__: '#52c49a',
  dist: '#8b919e',
  build: '#8b919e',
  utils: '#4fc1c9',
  lib: '#4fc1c9',
  context: '#d19a66',
  providers: '#d19a66',
}

export const getExtension = (name = '') => {
  const lower = name.toLowerCase()
  if (lower === 'dockerfile') return 'dockerfile'
  const idx = lower.lastIndexOf('.')
  return idx > 0 ? lower.slice(idx + 1) : ''
}

export const getFileVisual = (name = '') => {
  const lower = name.toLowerCase()
  if (FILENAME_VISUALS[lower]) return FILENAME_VISUALS[lower]
  if (lower.startsWith('.env')) return FILENAME_VISUALS['.env']
  return EXTENSION_VISUALS[getExtension(name)] || { kind: 'file', color: '#8b919e' }
}

export const getFolderColor = (name = '') => FOLDER_COLORS[name.toLowerCase()] || '#c9a26b'

export const getLanguage = (path = '') => {
  const name = path.split('/').pop() || ''
  return EXTENSION_LANGUAGES[getExtension(name)] || 'plaintext'
}

export const getLanguageLabel = (language) => LANGUAGE_LABELS[language] || language

export const normalizePath = (path = '') => String(path || '').replace(/^\.\//, '').replace(/^\/+/, '')
