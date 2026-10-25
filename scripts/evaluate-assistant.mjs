import { defaultFormDefinition } from '../lib/form-schema.ts'
import { editPlanJsonSchema, editPlanSchema, includeNamedThemeAreas, planSystemPrompt, reconcileGlassDirection, validateEditPlan } from '../lib/assistant-planner.ts'
import { FORMYST_HELP_GUIDE } from '../lib/assistant-guidance.ts'

const model = process.env.OLLAMA_MODEL || 'qwen3:4b'
const endpoint = new URL('/api/chat', process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434')
const form = defaultFormDefinition()
form.title = 'Wedding RSVP'
const currentForm = {
  title: form.title,
  description: form.description,
  submitLabel: form.submitLabel,
  hasBackgroundImage: true,
  theme: form.theme,
  fields: form.fields.map(({ id, type, label, required, options, style }) => ({ id, type, label, required, options, style })),
}

const cases = [
  { request: 'make the glassy bg more not so visible so background can be seen', action: 'edit', scopes: ['theme'], areas: ['card'] },
  { request: 'more', conversation: [{ role: 'user', content: 'make the card more transparent' }, { role: 'assistant', content: 'I set glass opacity to 55% so the background shows through.' }], theme: { cardMaterial: 'glass', glassOpacity: 0.55 }, action: 'edit', scopes: ['theme'], areas: ['card'] },
  { request: 'more', action: 'clarify', scopes: [], areas: [] },
  { request: 'make the submit button wider and dark green', action: 'edit', scopes: ['theme'], areas: ['button'] },
  { request: 'add a dietary restrictions question', action: 'edit', scopes: ['fields'], areas: [] },
  { request: 'make labels and inputs feel softer', action: 'edit', scopes: ['fieldStyle'], areas: [] },
  { request: 'redesign this wedding RSVP form to feel elegant', action: 'edit', scopes: ['theme', 'fieldStyle'], areas: ['whole'] },
  { request: 'change the title to Event registration', action: 'edit', scopes: ['copy'], areas: [] },
  { request: 'How do I export responses?', action: 'help', scopes: [], areas: [] },
  { request: 'make the background blue and add a phone question', action: 'edit', scopes: ['theme', 'fields'], areas: ['page'] },
  { request: 'make email optional', action: 'edit', scopes: ['fields'], areas: [] },
  { request: 'make the card more opaque and button larger', action: 'edit', scopes: ['theme'], areas: ['card', 'button'] },
  { request: 'some text cannot be seen or not that visible', action: 'edit', scopes: ['theme', 'fieldStyle'], areas: ['card'] },
]

const selectedCases = process.env.ASSISTANT_EVAL_CASE
  ? cases.filter((item) => item.request.includes(process.env.ASSISTANT_EVAL_CASE))
  : process.env.ASSISTANT_EVAL_LIMIT ? cases.slice(0, Number(process.env.ASSISTANT_EVAL_LIMIT)) : cases
let failures = 0
for (const item of selectedCases) {
  if (item.request.trim().split(/\s+/).length === 1 && !item.conversation?.length) {
    const correct = item.action === 'clarify'
    if (!correct) failures++
    process.stdout.write(`${correct ? 'PASS' : 'FAIL'} ${JSON.stringify(item.request)} => route asks for clarification without calling the model\n`)
    continue
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model, stream: false, think: false, format: editPlanJsonSchema,
      options: { temperature: 0, num_predict: 450, num_ctx: 8192 },
      messages: [
        { role: 'system', content: `${planSystemPrompt()} Product help guide: ${FORMYST_HELP_GUIDE}` },
        { role: 'user', content: JSON.stringify({ conversation: item.conversation ?? [], currentForm: item.theme ? { ...currentForm, theme: { ...currentForm.theme, ...item.theme } } : currentForm, request: item.request }) },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  })
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
  const raw = (await response.json()).message?.content
  const parsed = editPlanSchema.safeParse(JSON.parse(raw))
  const validated = parsed.success ? validateEditPlan(parsed.data) : null
  const plan = validated ? includeNamedThemeAreas(reconcileGlassDirection(validated), item.request) : null
  const correct = plan?.action === item.action &&
    [...plan.scopes].sort().join(',') === [...item.scopes].sort().join(',') &&
    item.areas.every((area) => plan.themeAreas.includes(area)) &&
    (item.action === 'edit' && item.areas.length ? !plan.themeAreas.includes('whole') || item.areas.includes('whole') : true) &&
    !(item.request === 'more' && item.conversation && /increase\s+(?:glass\s+)?opacity/i.test(plan.instruction))
  if (!correct) failures++
  process.stdout.write(`${correct ? 'PASS' : 'FAIL'} ${JSON.stringify(item.request)} => ${JSON.stringify(plan ?? raw)}\n`)
}
process.stdout.write(`${selectedCases.length - failures}/${selectedCases.length} cases matched expected intent and scope\n`)
process.exitCode = failures ? 1 : 0
