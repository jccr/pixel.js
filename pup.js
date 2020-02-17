const process = require('process')
const path = require('path')
const fsp = require('fs').promises
const puppeteer = require('puppeteer')
const iPhone = puppeteer.devices['iPhone 6']

const args = process.argv.slice(2)

const escapeXpathString = str => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};

const clickByText = async (page, text) => {
  const escapedText = escapeXpathString(text);
  const linkHandlers = await page.$x(`//*[contains(text(), ${escapedText})]`);

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error(`Link not found: ${text}`);
  }
};

; (async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.emulate(iPhone)

  console.log('Navigate to login')
  await page.goto('https://instagram.com/accounts/login/')

  await page.screenshot({ path: 'debug/next.png' })

  console.log('Type username')
  await page.type("input[name=username]", args[1])

  console.log('Type password')
  await page.type("input[name=password]", args[2])

  console.log('Click login')
  await clickByText(page, 'Log In')

  console.log('Wait for navigation')
  await page.waitForNavigation()

  console.log('Go to root')
  await page.goto('https://instagram.com')

  console.log('Wait 3s')
  await page.waitFor(3)

  console.log('Click new post')

  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click('[data-testid="new-post-button"]'),
  ]);
  await fileChooser.accept([args[3]]);

  console.log('Wait for photo preview')
  await page.waitFor('[style*="blob:https://www.instagram.com"]')

  await page.screenshot({ path: 'debug/next.png' })

  console.log('Click next')
  await clickByText(page, 'Next')

  console.log('Wait for upload preview')
  await page.waitFor('[alt="Preview of photo to be uploaded"]')

  await page.screenshot({ path: 'debug/share.png' })

  console.log('Click share')
  await clickByText(page, 'Share')

  // other actions...
  await browser.close();
})()
