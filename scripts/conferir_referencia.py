"""1) O script do maestro.com.ai/custo-da-fila ainda é igual a docs/referencia/custo-da-fila/calc.js?
2) O site ao vivo devolve R$ 161.200 e 'Caso fechado' para todas as respostas no índice 2?"""
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

raiz = Path(__file__).resolve().parents[1]
referencia = (raiz / "docs/referencia/custo-da-fila/calc.js").read_text()
URL = "https://www.maestro.com.ai/custo-da-fila"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1366, "height": 900})
    pg.goto(URL, wait_until="networkidle", timeout=60000)
    scripts = re.findall(r"<script(?![^>]*src=)[^>]*>(.*?)</script>", pg.content(), re.S)
    ao_vivo = max(scripts, key=len)
    igual = ao_vivo.strip() == referencia.strip()
    print("script igual à referência:", igual)

    pg.click("#start")
    for _ in range(11):
        pg.wait_for_selector("#opts button")
        if pg.is_visible("#setor"):
            pg.select_option("#setor", index=1)
            pg.select_option("#fat", index=1)
        botoes = pg.query_selector_all("#opts button")
        botoes[min(2, len(botoes) - 1)].click()
        pg.click("#next")
    pg.wait_for_selector("#r-valor")
    valor = pg.inner_text("#r-valor")
    veredicto = pg.inner_text("#r-vlamp-t")
    print("ao vivo:", valor, "·", veredicto)
    b.close()

ok = igual and valor == "R$ 161.200" and veredicto == "Caso fechado"
print("OK" if ok else "DIVERGÊNCIA: atualizar docs/referencia e rodar npm test")
sys.exit(0 if ok else 1)
