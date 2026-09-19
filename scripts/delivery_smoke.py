import os
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:5173"
DEMO_MODE = os.environ.get("POWERFIT_SMOKE_MODE") == "demo"
ARTIFACTS = Path(os.environ.get("TEMP", ".")) / "powerfit-delivery-smoke"
ARTIFACTS.mkdir(parents=True, exist_ok=True)


def wait_for_app(page):
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_selector("body")
    assert "PowerFit" in page.title()


def assert_no_runtime_errors(errors):
    ignored = ("favicon", "ERR_BLOCKED_BY_CLIENT")
    relevant = [message for message in errors if not any(token in message for token in ignored)]
    assert not relevant, f"Erros no console: {relevant}"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome", headless=True)

    if not DEMO_MODE:
        context = browser.new_context(viewport={"width": 1440, "height": 1000})
        page = context.new_page()
        console_errors = []
        page.on("pageerror", lambda error: console_errors.append(str(error)))
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)

        wait_for_app(page)
        assert page.get_by_text("Gestao de alunos", exact=True).is_visible()
        page.screenshot(path=str(ARTIFACTS / "landing.png"), full_page=True)

        page.goto(f"{BASE_URL}/auth", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.get_by_role("button", name="Entrar", exact=True).first.wait_for(timeout=10000)
        auth_body = page.locator("body").inner_text()
        assert page.get_by_role("button", name="Entrar", exact=True).first.is_visible(), f"Tela de login não abriu: url={page.url} body={auth_body[:500]}"
        assert "trainer.demo@powerfit.test" not in page.locator("body").inner_text()

        for route, expected in (
            ("/termos", "Termos"),
            ("/privacidade", "Privacidade"),
            ("/seguranca", "Segurança"),
            ("/reset-password", "nova senha"),
        ):
            page.goto(f"{BASE_URL}{route}", wait_until="networkidle")
            page.wait_for_timeout(1000)
            page.get_by_text(expected, exact=False).first.wait_for(timeout=10000)
            body_text = page.locator("body").inner_text()
            assert expected.lower() in body_text.lower(), f"Conteúdo ausente em {route}: {expected}"

        page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")
        page.wait_for_url("**/auth", timeout=10000)
        assert "/auth" in page.url
        assert_no_runtime_errors(console_errors)
        context.close()
    else:
        for email, expected_path in (
            ("trainer.demo@powerfit.test", "/dashboard"),
            ("student.demo@powerfit.test", "/aluno"),
        ):
            context = browser.new_context(viewport={"width": 1365, "height": 900})
            page = context.new_page()
            console_errors = []
            failed_requests = []
            page.on("pageerror", lambda error: console_errors.append(str(error)))
            page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
            page.on("requestfailed", lambda request: failed_requests.append(f"{request.url} ({request.failure})"))

            page.goto(f"{BASE_URL}/auth", wait_until="networkidle")
            page.wait_for_timeout(2000)
            page.get_by_text("Ambiente demo/preview", exact=False).first.wait_for(timeout=10000)
            assert page.get_by_text("Ambiente demo/preview", exact=False).first.is_visible(), page.locator("body").inner_text()[:500]
            page.locator('input[type="email"]').fill(email)
            page.locator('input[type="password"]').fill("demo123")
            page.locator('button[type="submit"]').click()
            page.wait_for_url(f"**{expected_path}")
            page.wait_for_load_state("networkidle")
            assert expected_path in page.url
            assert "Algo deu errado" not in page.locator("body").inner_text()
            page.screenshot(path=str(ARTIFACTS / f"{expected_path[1:]}.png"), full_page=True)
            if failed_requests:
                print(f"failed-requests {failed_requests!r}")
            assert_no_runtime_errors(console_errors)
            context.close()

    browser.close()

print(f"smoke-ok mode={'demo' if DEMO_MODE else 'production'} artifacts={ARTIFACTS}")
