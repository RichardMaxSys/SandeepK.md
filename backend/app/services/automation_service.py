from playwright.async_api import async_playwright
import asyncio

async def run_dry_run(job_url: str, user_data: dict):
    """
    Opens a job application page and attempts to pre-fill fields.
    Stops before any final submission.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False) # Keep it visible for the user
        page = await browser.new_page()
        print(f"Opening: {job_url}")
        await page.goto(job_url)

        # Example logic for common field names
        # Note: In a real scenario, this would use AI to map fields to user_data

        # Fill Name
        if await page.query_selector('input[name*="name"], input[id*="name"]'):
            await page.fill('input[name*="name"], input[id*="name"]', user_data.get('full_name', ''))

        # Fill Email
        if await page.query_selector('input[type="email"]'):
            await page.fill('input[type="email"]', user_data.get('email', ''))

        print("Dry run complete. Fields pre-filled where possible.")
        print("Waiting for manual review... (browser will stay open for 60s)")
        await asyncio.sleep(60)
        await browser.close()

if __name__ == "__main__":
    mock_data = {"full_name": "John Doe", "email": "john@example.com"}
    # asyncio.run(run_dry_run("https://example.com/apply", mock_data))
    print("Playwright automation script ready.")
