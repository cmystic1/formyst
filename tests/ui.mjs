import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultFormDefinition, parseFormDefinition } from '../lib/form-schema.ts'
import { filterFormLibrary } from '../lib/form-library.ts'

test('custom CSS for the form, background, header, button, and field survives save parsing', () => {
  const form = defaultFormDefinition()
  form.customCss = '.fy-card { padding: 2rem; }'
  form.backgroundCss = ':scope { background-color: #f2e8dd; }'
  form.headerCss = '.fy-title { letter-spacing: .03em; }'
  form.buttonCss = '.fy-button { text-transform: uppercase; }'
  form.fields[0].customCss = '.fy-input { background: #fffaf2; }'

  const parsed = parseFormDefinition(form)
  assert.equal(parsed.ok, true)
  assert.equal(parsed.value.customCss, form.customCss)
  assert.equal(parsed.value.backgroundCss, form.backgroundCss)
  assert.equal(parsed.value.headerCss, form.headerCss)
  assert.equal(parsed.value.buttonCss, form.buttonCss)
  assert.equal(parsed.value.fields[0].customCss, form.fields[0].customCss)
})

test('custom button width and size controls accept supported values', () => {
  const form = defaultFormDefinition()
  form.theme.button = 'custom'
  form.theme.buttonWidthCustom = '80%'
  form.theme.buttonSize = 'custom'
  form.theme.buttonFontSizeCustom = 18
  form.theme.buttonPaddingYCustom = 14
  form.theme.buttonPaddingXCustom = 24

  const parsed = parseFormDefinition(form)
  assert.equal(parsed.ok, true)
  assert.equal(parsed.value.theme.button, 'custom')
  assert.equal(parsed.value.theme.buttonWidthCustom, '80%')
  assert.equal(parsed.value.theme.buttonSize, 'custom')
  assert.equal(parsed.value.theme.buttonFontSizeCustom, 18)
  assert.equal(parsed.value.theme.buttonPaddingYCustom, 14)
  assert.equal(parsed.value.theme.buttonPaddingXCustom, 24)
})

test('custom CSS limits are enforced before a form is saved', () => {
  const form = defaultFormDefinition()
  form.fields[0].customCss = 'x'.repeat(5_001)
  assert.equal(parseFormDefinition(form).ok, false)

  form.fields[0].customCss = ''
  form.customCss = 'x'.repeat(12_001)
  assert.equal(parseFormDefinition(form).ok, false)
})

test('form library filters by status and case-insensitive title query', () => {
  const forms = [
    { id: 'a', title: 'Summer Survey', published: true },
    { id: 'b', title: 'Summer Signup', published: false },
    { id: 'c', title: 'Workshop Feedback', published: true },
  ]
  assert.deepEqual(filterFormLibrary(forms, 'all', 'SUMMER').map((form) => form.id), ['a', 'b'])
  assert.deepEqual(filterFormLibrary(forms, 'published', 'summer').map((form) => form.id), ['a'])
  assert.deepEqual(filterFormLibrary(forms, 'drafts', '').map((form) => form.id), ['b'])
  assert.deepEqual(filterFormLibrary(forms, 'all', 'missing'), [])
})

test('new forms use the copper brand accent', () => {
  const form = defaultFormDefinition()
  assert.equal(form.theme.accent, '#b85c3a')
  const parsed = parseFormDefinition(form)
  assert.equal(parsed.ok, true)
  assert.equal(parsed.value.theme.accent, '#b85c3a')
})

test('glass card material is preserved by form parsing', () => {
  const form = defaultFormDefinition()
  form.theme.cardMaterial = 'glass'
  const parsed = parseFormDefinition(form)
  assert.equal(parsed.ok, true)
  assert.equal(parsed.value.theme.cardMaterial, 'glass')
})
