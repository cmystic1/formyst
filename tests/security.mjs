import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createField, defaultFormDefinition, parseFormDefinition, validateSubmission, visibleFieldIds,
} from '../lib/form-schema.ts'
import { isAllowedWebhookUrl, isServiceWebhookUrl } from '../lib/webhook-url.ts'

test('form definitions reject blank labels and reserved answer keys', () => {
  const form = defaultFormDefinition()
  form.fields[0].id = '__proto__'
  assert.equal(parseFormDefinition(form).ok, false)
  form.fields[0].id = 'f_name'
  form.fields[0].label = '   '
  assert.equal(parseFormDefinition(form).ok, false)
})

test('answers are checked against the owner-authored field types', () => {
  const form = defaultFormDefinition()
  form.fields = [createField('number'), createField('date'), createField('url')]
  for (const field of form.fields) field.required = true
  const [number, date, url] = form.fields
  const good = {
    [number.id]: '12.5', [date.id]: '2026-10-24', [url.id]: 'https://example.com',
  }
  assert.equal(validateSubmission(form, good).ok, true)
  assert.equal(validateSubmission(form, { ...good, [number.id]: {} }).ok, false)
  assert.equal(validateSubmission(form, { ...good, [date.id]: '2026-02-30' }).ok, false)
  assert.equal(validateSubmission(form, { ...good, [url.id]: 'javascript:alert(1)' }).ok, false)
})

test('checkbox answers reject duplicate option IDs', () => {
  const form = defaultFormDefinition()
  const field = createField('checkbox')
  form.fields = [field]
  assert.equal(validateSubmission(form, { [field.id]: [field.options[0].id, field.options[0].id] }).ok, false)
})

test('conditional fields only accept and store answers when visible', () => {
  const form = defaultFormDefinition()
  const choice = createField('dropdown')
  const followup = createField('checkbox')
  const detail = createField('text')
  followup.showWhen = { sourceFieldId: choice.id, optionId: choice.options[0].id }
  detail.showWhen = { sourceFieldId: followup.id, optionId: followup.options[0].id }
  detail.required = true
  form.fields = [choice, followup, detail]

  assert.equal(parseFormDefinition(form).ok, true)
  const hiddenInput = {
    [choice.id]: choice.options[1].id,
    [followup.id]: [followup.options[0].id],
    [detail.id]: 'A forged hidden answer',
  }
  assert.deepEqual([...visibleFieldIds(form, hiddenInput)], [choice.id])
  const hidden = validateSubmission(form, hiddenInput)
  assert.equal(hidden.ok, true)
  assert.deepEqual(hidden.answers, { [choice.id]: choice.options[1].id })

  const visibleInput = {
    [choice.id]: choice.options[0].id,
    [followup.id]: [followup.options[0].id],
  }
  assert.equal(validateSubmission(form, visibleInput).ok, false)
  const complete = validateSubmission(form, { ...visibleInput, [detail.id]: 'Shown answer' })
  assert.equal(complete.ok, true)
  assert.equal(complete.answers[detail.id], 'Shown answer')
})

test('conditional rules reject missing options and circular dependencies', () => {
  const form = defaultFormDefinition()
  const first = createField('radio')
  const second = createField('dropdown')
  form.fields = [first, second]
  second.showWhen = { sourceFieldId: first.id, optionId: 'missing' }
  assert.equal(parseFormDefinition(form).ok, false)
  second.showWhen.optionId = first.options[0].id
  first.showWhen = { sourceFieldId: second.id, optionId: second.options[0].id }
  assert.equal(parseFormDefinition(form).ok, false)
})

test('button styles persist and older forms keep automatic button colors', () => {
  const form = defaultFormDefinition()
  const oldTheme = { ...form.theme }
  delete oldTheme.buttonColor
  delete oldTheme.buttonTextColor
  delete oldTheme.buttonShape
  delete oldTheme.buttonSize
  delete oldTheme.buttonAlign
  const oldForm = parseFormDefinition({ ...form, theme: oldTheme })
  assert.equal(oldForm.ok, true)
  assert.equal(oldForm.value.theme.buttonColor, '')
  assert.equal(oldForm.value.theme.buttonShape, 'auto')
  assert.equal(oldForm.value.theme.buttonAlign, 'auto')

  form.theme.buttonColor = '#fefefe'
  form.theme.buttonTextColor = ''
  form.theme.buttonShape = 'pill'
  form.theme.buttonSize = 'large'
  form.theme.buttonAlign = 'right'
  const updated = parseFormDefinition(form)
  assert.equal(updated.ok, true)
  assert.equal(updated.value.theme.buttonColor, '#fefefe')
  assert.equal(updated.value.theme.buttonTextColor, '')
  assert.equal(updated.value.theme.buttonShape, 'pill')
  assert.equal(updated.value.theme.buttonSize, 'large')
  assert.equal(updated.value.theme.buttonAlign, 'right')
})

test('webhooks require an exact allowed HTTPS host', () => {
  const previous = process.env.WEBHOOK_ALLOWED_HOSTS
  process.env.WEBHOOK_ALLOWED_HOSTS = 'n8n.example.com'
  try {
    assert.equal(isAllowedWebhookUrl('https://n8n.example.com/webhook/abc'), true)
    assert.equal(isAllowedWebhookUrl('http://n8n.example.com/webhook/abc'), false)
    assert.equal(isAllowedWebhookUrl('https://n8n.example.com.evil.test/webhook'), false)
    assert.equal(isAllowedWebhookUrl('https://n8n.example.com:8443/webhook'), false)
    assert.equal(isAllowedWebhookUrl('https://user:pass@n8n.example.com/webhook'), false)
  } finally {
    if (previous === undefined) delete process.env.WEBHOOK_ALLOWED_HOSTS
    else process.env.WEBHOOK_ALLOWED_HOSTS = previous
  }
})

test('service webhooks require their own endpoint shape and an allowed host', () => {
  const previous = process.env.WEBHOOK_ALLOWED_HOSTS
  process.env.WEBHOOK_ALLOWED_HOSTS = 'hooks.slack.com,discord.com,hooks.zapier.com'
  try {
    assert.equal(isServiceWebhookUrl('https://hooks.slack.com/services/T/B/token', 'slack'), true)
    assert.equal(isServiceWebhookUrl('https://discord.com/api/webhooks/123/token', 'discord'), true)
    assert.equal(isServiceWebhookUrl('https://hooks.slack.com/other', 'slack'), false)
    assert.equal(isServiceWebhookUrl('https://discord.com/api/webhooks/123/token', 'slack'), false)
    assert.equal(isServiceWebhookUrl('https://discord.com.evil.test/api/webhooks/123/token', 'discord'), false)
    assert.equal(isAllowedWebhookUrl('https://hooks.zapier.com/hooks/catch/1/abc'), true)
  } finally {
    if (previous === undefined) delete process.env.WEBHOOK_ALLOWED_HOSTS
    else process.env.WEBHOOK_ALLOWED_HOSTS = previous
  }
})
