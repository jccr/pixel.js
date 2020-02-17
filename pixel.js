const process = require('process')
const path = require('path')
const fsp = require('fs').promises
const playwright = require('playwright')

const iPhoneSE = playwright.devices['iPhone SE']

const args = process.argv.slice(2);

; (async () => {
  const browser = await playwright[args[0]].launch({ headless: true });
  const context = await browser.newContext({
    viewport: iPhoneSE.viewport,
    userAgent: iPhoneSE.userAgent
  })
  const page = await context.newPage()

  console.log('Navigate to login')
  await page.goto('https://instagram.com/accounts/login/')

  console.log('Type username')
  await page.type("input[name=username]", args[1])

  console.log('Type password')
  await page.type("input[name=password]", args[2])

  console.log('Click login')
  await page.click('text="Log In"')

  console.log('Wait for navigation')
  await page.waitForNavigation()

  console.log('Go to root')
  await page.goto('https://instagram.com')

  console.log('Wait 3s')
  await page.waitFor(3)

  page.on('filechooser', () => { })

  console.log('Click new post')
  await page.click('[data-testid="new-post-button"]')

  const input = await page.$('input[type="file"]')
  await input.setInputFiles({
    name: 'photo.jpg',
    type: 'image/jpeg',
    data: await fsp.readFile(args[3], 'base64')
  })

  console.log('Wait for photo preview')
  await page.waitFor('[style*="blob:https://www.instagram.com"]')

  await page.screenshot({ path: 'debug/next.png' })

  console.log('Click next')
  await page.click('text="Next"')

  console.log('Wait for upload preview')
  await page.waitFor('[alt="Preview of photo to be uploaded"]')

  await page.screenshot({ path: 'debug/share.png' })

  console.log('Click share')
  await page.click('text="Share"')
})()
