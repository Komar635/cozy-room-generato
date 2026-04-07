import { expect, test } from '@playwright/test'

test('user can open room setup and validate room dimensions', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Создатель Уютных Комнат' })).toBeVisible()
  await page.getByRole('link', { name: /Создать комнату/i }).click()

  await expect(page).toHaveURL(/\/room/)
  await expect(page.getByRole('heading', { name: 'Создание комнаты' })).toBeVisible()

  await page.locator('#width').fill('5')
  await page.locator('#height').fill('3')
  await page.locator('#depth').fill('4')
  await page.getByRole('button', { name: 'Применить' }).click()

  await expect(page.getByText('Площадь пола: 20 м² (сервер)')).toBeVisible()
  await expect(page.getByText('Периметр: 18 м')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Продолжить к мебели' })).toBeVisible()
})

test('user can request AI recommendations in demo flow', async ({ page }) => {
  await page.route('**/api/ai/recommendations', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          recommendations: [
            {
              id: 'demo-1',
              name: 'Диван для теста',
              category: 'furniture',
              price: 28000,
              priceFormatted: '28 000 ₽',
              reason: 'Подходит по стилю и бюджету',
              confidence: 0.91,
              adaptedForRussia: true
            }
          ],
          totalEstimatedCost: 28000,
          budgetUtilization: 0.28,
          source: 'local-ai',
          currency: 'RUB',
          adaptedForRussia: true
        }
      })
    })
  })

  await page.goto('/api-demo')
  await expect(page.getByRole('heading', { name: /API/i })).toBeVisible()

  await page.getByRole('button', { name: 'Получить ИИ рекомендации' }).click()

  await expect(page.getByText('Диван для теста')).toBeVisible()
  await expect(page.getByText('Подходит по стилю и бюджету')).toBeVisible()
  await expect(page.getByText('28 000 ₽')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Добавить в комнату' })).toBeVisible()
})
