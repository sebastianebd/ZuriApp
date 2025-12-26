import { chromium, type FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Capture client-side logs
    page.on('console', (msg) => console.log(`BROWSER: ${msg.text()}`))
    page.on('pageerror', (err) => console.log(`BROWSER ERROR: ${err.message}`))

    // 1. Navigate to Login (Root path)
    console.log('Navigating to ' + baseURL + '/')
    await page.goto(baseURL + '/', { waitUntil: 'networkidle', timeout: 60000 })

    // Debug: Wait a bit and dump content if selector fails
    try {
      await page.waitForSelector('#rut', { state: 'visible', timeout: 10000 })
    } catch (e) {
      console.log('Timeout waiting for #rut. Dumping body:')
      const body = await page.content()
      console.log(body)
      throw e
    }

    // 2. Perform Login
    console.log('Filling credentials...')
    await page.fill('#rut', '12345678-5')
    await page.fill('input[type="password"]', 'admin123')

    // Start waiting for the login response
    const loginResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/auth/login') && response.status() === 200
    )

    await page.click('button[type="submit"]')

    // Wait for the response and capture token
    let authState: any = null
    try {
      const response = await loginResponsePromise
      if (response.status() === 200) {
        const body = await response.json()
        authState = {
          accessToken: body.access_token,
          user: body.user,
          authReady: true
        }
        console.log('Login success, captured token.')
      } else {
        console.error('Login failed with status:', response.status())
      }
    } catch (e) {
      console.log('Login API failed or timed out')
      throw e
    }

    // 3. Wait for success redirection
    console.log('Waiting for redirection...')
    await page.waitForURL(/\/app/)

    // Manually inject (bypass persistence race condition)
    if (authState) {
      await page.evaluate((state) => {
        localStorage.setItem('auth', JSON.stringify(state))
      }, authState)
      console.log('Manually injected auth state into localStorage')
    }

    // Explicitly wait for localStorage to be populated with 'auth' key
    await page.waitForFunction(
      () => {
        const auth = localStorage.getItem('auth')
        if (!auth) return false
        try {
          const parsed = JSON.parse(auth)
          return !!parsed.accessToken
        } catch {
          return false
        }
      },
      null,
      { timeout: 15000 }
    )

    // 4. Save signed-in state to 'storageState.json'.
    console.log('Saving storage state...')
    console.log('Storage state path:', storageState)

    // Ensure directory exists
    const storageDir = path.dirname(storageState as string)
    if (!fs.existsSync(storageDir)) {
      console.log('Creating directory:', storageDir)
      fs.mkdirSync(storageDir, { recursive: true })
    }

    await page.context().storageState({ path: storageState as string })
    console.log('Storage state saved successfully!')

    // Verify file exists
    if (fs.existsSync(storageState as string)) {
      const stats = fs.statSync(storageState as string)
      console.log('File size:', stats.size, 'bytes')
      console.log('Absolute path:', path.resolve(storageState as string))
    } else {
      console.error('WARNING: Storage state file was not created!')
    }
  } catch (e) {
    console.error('Global Setup Failed:', e)
    await page.screenshot({ path: 'global-setup-failure.png' })
    throw e
  } finally {
    await browser.close()
  }
}

export default globalSetup
