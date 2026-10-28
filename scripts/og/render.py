"""Renderiza scripts/og/og.html em public/og-image.jpg (1200x630)."""
from pathlib import Path
from playwright.sync_api import sync_playwright

raiz = Path(__file__).resolve().parents[2]
html = raiz / "scripts" / "og" / "og.html"
saida = raiz / "public" / "og-image.jpg"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1200, "height": 630})
    pg.goto(html.as_uri(), wait_until="networkidle")
    pg.wait_for_timeout(500)
    pg.screenshot(path=str(saida), type="jpeg", quality=88)
    b.close()
print(saida, saida.stat().st_size // 1024, "KB")
