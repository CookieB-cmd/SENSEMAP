import {expect,test} from '@playwright/test'
import {TEST_LIBRARY_ID} from './helpers'

test.use({locale:'nn-NO'})

test('language switching preserves route and semantic local preferences',async({page})=>{await page.goto('/needs');await page.getByLabel('Eg ønskjer lite lyd').check();await page.getByLabel('Eg treng sitjeplass').check();await page.getByRole('button',{name:'Lagre'}).click();const before=await page.evaluate(()=>localStorage.getItem('sensemap.preferences.v1'));await page.getByRole('button',{name:'English'}).click();await expect(page).toHaveURL(/\/needs$/);await expect(page.getByRole('heading',{name:'What helps you?'})).toBeVisible();const after=await page.evaluate(()=>localStorage.getItem('sensemap.preferences.v1'));expect(after).toBe(before);await page.goto(`/places/${TEST_LIBRARY_ID}`);await expect(page.getByText('Noise',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Nynorsk'}).click();await expect(page).toHaveURL(new RegExp(`/places/${TEST_LIBRARY_ID}$`));await expect(page.getByText('Lyd',{exact:true})).toBeVisible()})
