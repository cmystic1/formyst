import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultFormDefinition, parseFormDefinition } from '../lib/form-schema.ts'
import { answerKnownHelpQuestion, isRestrictedAssistantRequest } from '../lib/assistant-guidance.ts'
import { allowedThemeKeys, completeThemePatch, editPlanSchema, glassDirectionFromPlan, includeNamedThemeAreas, normalizePatchColors, reconcileGlassDirection, validateEditPlan } from '../lib/assistant-planner.ts'

test('older forms gain a valid glass opacity without losing their theme', () => {
  const old = defaultFormDefinition()
  delete old.theme.glassOpacity
  const parsed = parseFormDefinition(old)
  assert.equal(parsed.ok, true)
  assert.equal(parsed.value.theme.glassOpacity, 0.68)
})

test('edit plans need an instruction and a scoped target', () => {
  assert.equal(validateEditPlan(editPlanSchema.parse({ action: 'edit', scopes: [], themeAreas: [], instruction: 'make it elegant', reply: '' })), null)
  assert.equal(validateEditPlan(editPlanSchema.parse({ action: 'edit', scopes: ['theme'], themeAreas: ['page'], instruction: '', reply: '' })), null)
  const plan = validateEditPlan(editPlanSchema.parse({ action: 'edit', scopes: ['theme', 'theme'], themeAreas: ['page'], instruction: 'make the page background blue', reply: '' }))
  assert.deepEqual(plan.scopes, ['theme'])
  assert.deepEqual([...allowedThemeKeys(plan.themeAreas)].sort(), ['pageBg', 'surface'])
  assert.equal(validateEditPlan(editPlanSchema.parse({ action: 'help', scopes: ['fields'], themeAreas: [], instruction: '', reply: '' })), null)
  const whole = validateEditPlan(editPlanSchema.parse({ action: 'edit', scopes: ['visualDesign'], themeAreas: ['whole'], instruction: 'make it elegant', reply: '' }))
  assert.deepEqual(whole.scopes, ['theme', 'fieldStyle'])
  const incompleteWhole = validateEditPlan(editPlanSchema.parse({ action: 'edit', scopes: ['theme'], themeAreas: ['whole'], instruction: 'redesign the whole form', reply: '' }))
  assert.deepEqual(incompleteWhole.scopes, ['theme', 'fieldStyle'])
  const mixed = includeNamedThemeAreas(editPlanSchema.parse({
    action: 'edit', scopes: ['theme'], themeAreas: ['card'], instruction: 'Make the card more opaque', reply: '',
  }), 'make the card more opaque and button larger')
  assert.deepEqual(mixed.themeAreas, ['card', 'button'])
})

test('product help stays accurate and account or security requests are restricted', () => {
  assert.match(answerKnownHelpQuestion('How do I export responses?'), /Export CSV.*all responses/)
  assert.equal(isRestrictedAssistantRequest('change my password'), true)
  assert.equal(isRestrictedAssistantRequest('add an email field'), false)
})

test('glass instructions obey the actual opacity control', () => {
  const transparent = reconcileGlassDirection(editPlanSchema.parse({
    action: 'edit', scopes: ['theme'], themeAreas: ['card'], instruction: 'Increase glass opacity from 55% to more transparent', reply: '',
  }))
  assert.match(transparent.instruction, /decrease glass opacity/i)
  assert.match(transparent.instruction, /lower than its current value/i)
  assert.equal(glassDirectionFromPlan(transparent), 'lower')
  const opaque = reconcileGlassDirection(editPlanSchema.parse({
    action: 'edit', scopes: ['theme'], themeAreas: ['card'], instruction: 'Decrease glass opacity to make the card more opaque', reply: '',
  }))
  assert.match(opaque.instruction, /increase glass opacity/i)
  const theme = defaultFormDefinition().theme
  assert.equal(completeThemePatch({ glassOpacity: 0.4 }, theme).cardMaterial, 'glass')
  assert.equal(completeThemePatch({ glassOpacity: 0.9 }, { ...theme, cardMaterial: 'glass', glassOpacity: 0.55 }, 'lower').glassOpacity, 0.4)
  assert.equal(completeThemePatch({ cardMaterial: 'solid', glassOpacity: 0.4 }, theme).cardMaterial, 'solid')
  assert.equal(completeThemePatch({ buttonColor: '#006400', buttonTextColor: '#006400' }, theme).buttonTextColor, '')
  assert.equal(normalizePatchColors({ fieldStyle: { inputBorder: '1px solid #e0e0e0' } }).fieldStyle.inputBorder, '#e0e0e0')
  assert.deepEqual(normalizePatchColors({ theme: { button: 'full', buttonWidthCustom: '' } }), { theme: { button: 'full' } })
})
