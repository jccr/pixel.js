const process = require('process')
const puppeteer = require('puppeteer')
const iPhone = puppeteer.devices['iPhone SE']

const args = process.argv.slice(2)

const escapeXpathString = str => {
  const splitQuotes = str.replace(/'/g, `', "'", '`)
  return `concat('${splitQuotes}', '')`
}

const clickByText = async (page, text, tag = '*') => {
  const escapedText = escapeXpathString(text)
  const linkHandlers = await page.$x(
    `//${tag}[contains(text(), ${escapedText})]`,
  )

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click()
  } else {
    throw new Error(`Link not found: ${text}`)
  }
}

let browser

async function main() {
  browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.setBypassCSP(true)
  await page.emulate(iPhone)

  console.log('Navigate to login')
  await page.goto('https://instagram.com/accounts/login/')

  await page.waitFor('input[name=username]')

  console.log('Type username')
  await page.type('input[name=username]', args[0])

  console.log('Type password')
  await page.type('input[name=password]', args[1])

  console.log('Click log in')
  await clickByText(page, 'Log In')

  console.log('Wait for navigation')
  try {
    await page.waitForNavigation()
  } catch (error) {
    console.error(error)
    console.log(await page.screenshot({encoding: 'base64'}))
    throw new Error('Log in error/timeout: Wrong credentials maybe?')
  }

  console.log('Go to root')
  await page.goto('https://instagram.com', { waitUntil: 'networkidle2' })

  console.log('Try to suppress any popup dialogs')
  try {
    await page.click('[role=dialog] button:nth-child(2)')
    await page.waitFor(1000)
  } catch (_) {}
  try {
    await page.click('[role=dialog] button:nth-child(2)')
    await page.waitFor(1000)
  } catch (_) {}
  try {
    await page.click('[role=dialog] button:nth-child(2)')
    await page.waitFor(1000)
  } catch (_) {}

  console.log('Click new post')
  page.waitFor('[data-testid="new-post-button"]')

  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click('[data-testid="new-post-button"]'),
  ])
  console.log('Place photo')
  await fileChooser.accept([args[2]])

  console.log('Wait for photo preview')
  await page.waitFor('[style*="blob:https://www.instagram.com"]')

  console.log('Click next')
  await clickByText(page, 'Next', 'button')

  console.log('Wait for post preview')
  await page.waitFor('[alt="Preview of photo to be uploaded"]')

  if (args[3]) {
    console.log('Type caption')
    await page.type('textarea[aria-label="Write a caption…"]', args[3])
  }

  console.log('Click share')
  await clickByText(page, 'Share', 'button')

  console.log('Wait for navigation')
  await page.waitForNavigation()
  await page.waitFor(10000)

  console.log('Done!')
  console.log(await page.screenshot({encoding: 'base64'}))
  await browser.close()
}

main().catch(async error => {
  console.error(error)
  await browser.close()
  process.exit(1)
})
