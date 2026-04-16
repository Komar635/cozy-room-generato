import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
})

test('user can open room setup and validate room dimensions', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Создатель Уютных Комнат' })).toBeVisible()
  await page.getByRole('link', { name: /Создать комнату/i }).click()

  await expect(page).toHaveURL(/\/room/)
  await expect(page.getByTestId('room-creator-title')).toBeVisible()

  await page.getByTestId('room-width-input').fill('5')
  await page.getByTestId('room-height-input').fill('3')
  await page.getByTestId('room-depth-input').fill('4')
  await page.getByTestId('room-apply-button').click()

  await expect(page.getByTestId('room-floor-area-server')).toContainText('20 м²')
  await expect(page.getByTestId('room-perimeter-server')).toContainText('18 м')
  await expect(page.getByTestId('room-info-width')).toHaveText('5.0 м')
  await expect(page.getByTestId('room-info-floor-area')).toHaveText('20.0 м²')
  await expect(page.getByTestId('room-continue-button')).toBeVisible()
})

test('user can apply style and save project locally', async ({ page }) => {
  await page.route('**/api/ai/recommendations', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          recommendations: [
            {
              id: 'style-1',
              name: 'Кресло для стиля',
              category: 'furniture',
              price: 18000,
              priceFormatted: '18 000 ₽',
              reason: 'Поддерживает выбранный стиль',
              confidence: 0.82,
              adaptedForRussia: true,
            },
          ],
          totalEstimatedCost: 18000,
          budgetUtilization: 0.18,
          source: 'local-ai',
          currency: 'RUB',
          adaptedForRussia: true,
        },
      }),
    })
  })

  await page.goto('/room')
  await page.getByTestId('room-apply-button').click()
  await expect(page.getByTestId('room-info-title')).toBeVisible()

  await page.getByTestId('style-card-scandinavian').click()
  await expect(page.getByText('Стиль применен')).toBeVisible()
  await expect(page.getByTestId('project-furniture-count')).not.toHaveText('Предметов: 0')
  await expect(page.getByTestId('budget-spent-value')).not.toHaveText('0 ₽')

  await page.getByTestId('project-name-input').fill('E2E проект')
  await page.getByTestId('project-local-save-button').click()

  await expect(page.getByText('Сохранено в браузере')).toBeVisible()
  await expect(page.getByText('E2E проект')).toBeVisible()
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
              adaptedForRussia: true,
            },
          ],
          totalEstimatedCost: 28000,
          budgetUtilization: 0.28,
          source: 'local-ai',
          currency: 'RUB',
          adaptedForRussia: true,
        },
      }),
    })
  })

  await page.goto('/api-demo')
  await expect(page.getByTestId('api-demo-title')).toBeVisible()
  await expect(page.getByTestId('ai-recommendations-title')).toBeVisible({ timeout: 15000 })

  await page.getByTestId('room-apply-button').click()
  await expect(page.getByTestId('budget-panel-title')).toBeVisible()

  await page.getByTestId('ai-recommendations-trigger').click()

  await expect(page.getByTestId('ai-recommendation-name-demo-1')).toHaveText('Диван для теста')
  await expect(page.getByTestId('ai-recommendation-reason-demo-1')).toHaveText('Подходит по стилю и бюджету')
  await expect(page.getByTestId('ai-recommendation-price-demo-1')).toHaveText('28 000 ₽')
  await expect(page.getByTestId('ai-status-panel')).toBeVisible()
  await expect(page.getByTestId('ai-add-recommendation-demo-1')).toBeVisible()

  await page.getByTestId('ai-add-recommendation-demo-1').click()
  await expect(page.getByTestId('ai-context-furniture-count')).toContainText('1 предметов')
  await expect(page.getByTestId('budget-item-rec_demo-1')).toBeVisible()
  await expect(page.getByTestId('budget-item-name-rec_demo-1')).toHaveText('Диван для теста')
  await expect(page.getByTestId('budget-spent-value')).toHaveText('28 000 ₽')
  await expect(page.getByTestId('budget-status-message')).toContainText('Бюджет в норме')
})
