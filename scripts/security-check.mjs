import { readFile } from 'node:fs/promises'

const files = {
  assistant: 'app/api/assistant/route.ts',
  export: 'app/api/privacy/export/route.ts',
}
const contents = {}
for (const [name, file] of Object.entries(files)) contents[name] = await readFile(file, 'utf8')
const checks = [
  ['assistant authenticates sessions', contents.assistant.includes('auth.getUser()')],
  ['assistant validates input with zod', contents.assistant.includes('bodySchema.safeParse')],
  ['assistant scopes queries to user id', contents.assistant.includes('.eq("user_id", user.id)')],
  ['assistant has a request cap', contents.assistant.includes('count ?? 0') && contents.assistant.includes('>= 10')],
  ['privacy export authenticates sessions', contents.export.includes('auth.getUser()')],
  ['privacy export scopes user data', contents.export.includes("eq('user_id',user.id)")],
  ['assistant does not import service role', !contents.assistant.includes('SERVICE_ROLE')],
]
const failed = checks.filter(([, passed]) => !passed)
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`)
if (failed.length) process.exit(1)
