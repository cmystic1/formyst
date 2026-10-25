import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultFormDefinition, parseFormDefinition } from '../lib/form-schema.ts'
import { contrastRatio, isReadabilityRequest, repairFormReadability } from '../lib/form-readability.ts'

test('a vague text-visibility complaint repairs card, labels, inputs, and button', () => {
  assert.equal(isReadabilityRequest('some text cannot be seen or not that visible'), true)
  const form = defaultFormDefinition()
  form.background = 'data:image/png;base64,AA=='
  form.theme.cardMaterial = 'glass'
  form.theme.glassOpacity = 0.25
  form.theme.buttonColor = '#ffffff'
  form.theme.buttonTextColor = '#ffffff'
  form.fields[0].style = {
    labelColor: '#ffffff', inputBg: '#ffffff', inputText: '#ffffff', inputBorder: '', accent: '',
    radius: 'auto', size: 'regular', borderWidth: 'auto',
  }

  const repaired = repairFormReadability(form)
  assert.ok(repaired.changes.length >= 3)
  assert.ok(repaired.form.theme.glassOpacity >= 0.8)
  assert.ok(contrastRatio(repaired.form.fields[0].style.labelColor, '#cccccc') >= 4.5)
  assert.ok(contrastRatio(repaired.form.fields[0].style.inputText, '#ffffff') >= 4.5)
  assert.ok(contrastRatio(repaired.form.theme.buttonTextColor, '#ffffff') >= 4.5)
  assert.deepEqual(repaired.form.fields.map(({ id, label, required }) => ({ id, label, required })),
    form.fields.map(({ id, label, required }) => ({ id, label, required })))
  assert.equal(parseFormDefinition(repaired.form).ok, true)
})

test('an already readable form is unchanged', () => {
  const form = defaultFormDefinition()
  const result = repairFormReadability(form)
  assert.equal(result.form, form)
  assert.deepEqual(result.changes, [])
  assert.ok(contrastRatio('#64748b', '#ffffff') >= 4.5)
  assert.ok(contrastRatio('#cbd5e1', '#0f172a') >= 4.5)
})

test('a strong readability repair changes a mid-gray control when text color alone cannot reach the target', () => {
  const form = defaultFormDefinition()
  form.theme.buttonColor = '#777777'
  form.theme.buttonTextColor = '#777777'
  form.fields[0].style = {
    labelColor: '', inputBg: '#777777', inputText: '#777777', inputBorder: '', accent: '',
    radius: 'auto', size: 'regular', borderWidth: 'auto',
  }
  const repaired = repairFormReadability(form, 7)
  const style = repaired.form.fields[0].style
  assert.ok(contrastRatio(style.inputText, style.inputBg) >= 7)
  assert.ok(contrastRatio(repaired.form.theme.buttonTextColor, repaired.form.theme.buttonColor) >= 7)
})
