import { z } from 'zod'
import { defaultFormDefinition } from '../lib/form-schema.ts'
import { formEditSystemPrompt } from '../lib/assistant-design-prompt.ts'
import { allowedThemeKeys, completeThemePatch, normalizePatchColors } from '../lib/assistant-planner.ts'

const model = process.env.OLLAMA_MODEL || 'qwen3:4b'
const endpoint = new URL('/api/chat', process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434')
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/)
const optionalHex = z.string().regex(/^(?:$|#[0-9a-fA-F]{6})$/)
const theme = z.object({
  accent: hex, radius: z.enum(['square', 'soft', 'round', 'pill']), surface: z.enum(['light', 'dark']),
  cardMaterial: z.enum(['solid', 'glass']), glassOpacity: z.number().min(0.2).max(0.9),
  font: z.enum(['sans', 'serif', 'mono']), fontCustom: z.string().max(300), pageBg: optionalHex, cardBg: optionalHex,
  button: z.enum(['auto', 'full', 'custom']), buttonWidthCustom: z.string().regex(/^\d{1,4}(?:px|rem|em|%)$/),
  buttonColor: optionalHex, buttonTextColor: optionalHex, buttonShape: z.enum(['auto', 'square', 'soft', 'round', 'pill']),
  buttonSize: z.enum(['regular', 'large', 'custom']), buttonFontSizeCustom: z.number().int().min(10).max(32),
  buttonPaddingYCustom: z.number().int().min(4).max(32), buttonPaddingXCustom: z.number().int().min(8).max(48),
  buttonAlign: z.enum(['auto', 'left', 'center', 'right']),
  align: z.enum(['left', 'center']),
}).partial().strict()
const fieldStyle = z.object({
  labelColor: optionalHex, inputBg: optionalHex, inputText: optionalHex, inputBorder: optionalHex,
  accent: optionalHex, radius: z.enum(['auto', 'square', 'soft', 'round', 'pill']),
  size: z.enum(['small', 'regular', 'large']), borderWidth: z.enum(['auto', 'thin', 'medium', 'thick']),
}).strict()

const cases = [
  {
    request: 'make the glassy bg more not so visible so background can be seen',
    instruction: 'Decrease glass opacity to make the background more visible',
    scopes: ['theme'], areas: ['card'], startOpacity: 0.68, direction: 'lower',
    check: (patch, before) => patch.theme?.cardMaterial === 'glass' && patch.theme.glassOpacity < before,
  },
  {
    request: 'more', instruction: 'Make the glass card more transparent than its current value by decreasing glass opacity',
    scopes: ['theme'], areas: ['card'], startOpacity: 0.55, direction: 'lower', conversation: [{ role: 'assistant', content: 'I set glass opacity to 55% so the background shows through.' }],
    check: (patch, before) => patch.theme?.glassOpacity < before,
  },
  {
    request: 'make the submit button wider and dark green',
    instruction: 'Make the submit button wider and dark green', scopes: ['theme'], areas: ['button'], startOpacity: 0.68,
    check: (patch) => Boolean(patch.theme?.buttonColor) && ['full', 'custom'].includes(patch.theme?.button),
  },
  {
    request: 'redesign this wedding RSVP form to feel elegant',
    instruction: 'Redesign the whole form to feel elegant while preserving question content',
    scopes: ['theme', 'fieldStyle'], areas: ['whole'], startOpacity: 0.68,
    check: (patch) => Object.keys(patch.theme ?? {}).length >= 3 && Object.keys(patch.fieldStyle ?? {}).length >= 2,
  },
]

const selectedCases = process.env.ASSISTANT_EVAL_CASE ? cases.filter((item) => item.request.includes(process.env.ASSISTANT_EVAL_CASE)) : cases
let failures = 0
for (const item of selectedCases) {
  const form = defaultFormDefinition()
  form.title = 'Wedding RSVP'
  form.background = 'data:image/png;base64,AA=='
  form.theme.glassOpacity = item.startOpacity
  if (item.request === 'more') form.theme.cardMaterial = 'glass'
  const context = {
    title: form.title, description: form.description, submitLabel: form.submitLabel,
    hasBackgroundImage: true, theme: form.theme,
    fields: form.fields.map(({ id, type, label, required, options, style }) => ({ id, type, label, required, options, style })),
  }
  const themeShape = Object.fromEntries([...allowedThemeKeys(item.areas)].map((key) => [key, theme.shape[key]]))
  const shape = { theme: z.object(themeShape).strict() }
  if (item.scopes.includes('fieldStyle')) shape.fieldStyle = fieldStyle
  const schema = z.object(shape).strict()
  const format = { ...z.toJSONSchema(schema) }
  delete format.$schema
  const messages = [
    { role: 'system', content: formEditSystemPrompt() },
    { role: 'user', content: JSON.stringify({ originalRequest: item.request, conversation: item.conversation ?? [], instruction: item.instruction, scopes: item.scopes, themeAreas: item.areas, currentForm: context }) },
  ]
  let raw = ''
  let parsed = null
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, stream: false, think: false, format,
        options: { temperature: 0, num_predict: 1400, num_ctx: 8192 }, messages }),
      signal: AbortSignal.timeout(120_000),
    })
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
    raw = (await response.json()).message?.content ?? ''
    try { parsed = schema.safeParse(normalizePatchColors(JSON.parse(raw))) } catch { parsed = null }
    if (parsed?.success || attempt === 1) break
    const issues = parsed?.error?.issues?.slice(0, 4).map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ') || 'The reply was not valid JSON.'
    messages.push({ role: 'assistant', content: raw.slice(0, 3500) })
    messages.push({ role: 'user', content: `Repair your JSON patch. ${issues} Return only the corrected JSON object. Keep the same requested edit and scopes.` })
  }
  const completed = parsed?.success ? { ...parsed.data, theme: completeThemePatch(parsed.data.theme, form.theme, item.direction) } : null
  const correct = completed && item.check(completed, item.startOpacity)
  if (!correct) failures++
  process.stdout.write(`${correct ? 'PASS' : 'FAIL'} ${JSON.stringify(item.request)} => ${JSON.stringify(completed ?? raw)}\n`)
}
process.stdout.write(`${selectedCases.length - failures}/${selectedCases.length} generated patches passed the requested-change checks\n`)
process.exitCode = failures ? 1 : 0
