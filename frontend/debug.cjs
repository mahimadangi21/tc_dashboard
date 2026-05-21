const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE_ERROR:', err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE_ERROR:', msg.text());
    }
  });

  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:5173/dashboard');
  
  // Wait for React to render
  await new Promise(r => setTimeout(r, 2000));
  
  if (page.url().includes('login')) {
    console.log('Logging in...');
    await page.type('input[type="email"]', 'admin@tckade.com');
    await page.type('input[type="password"]', 'Welcome@123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await page.goto('http://localhost:5173/dashboard');
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('Clicking toggle...');
  await page.click('button[title="Toggle Theme"]');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  if (content.includes('Dashboard rendering crashed')) {
     console.log('ERROR_BOUNDARY_TEXT:', await page.evaluate(() => document.body.innerText));
  } else {
     console.log('No ErrorBoundary text found. Checking body text snippet:');
     console.log((await page.evaluate(() => document.body.innerText)).substring(0, 500));
  }
  
  await browser.close();
})();
