import { test, expect } from '@playwright/test'

test('smoke: navigation and pages', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Products')
  await expect(page.locator('h2')).toContainText('Products')
  await page.click('text=Feed')
  await expect(page.locator('h2')).toContainText('Feed')
})
