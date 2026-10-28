"""Percorre a Fábrica de Peças inteira (celular e desktop), envia o contato 'TESTE E2E' e confere o resultado.
Uso: python e2e/fluxo_e2e.py [URL]  (padrão http://localhost:4173)
Opcional:
  E2E_RESOLVE="questionario.aodigital.net.br 54.39.18.39"  força o IP (cache de DNS local).
  E2E_BLOQUEAR=1   não deixa nada chegar ao n8n (responde 200 localmente) e confere os envios.
  E2E_CAPTURAS=/caminho   pasta das capturas (padrão e2e/capturas)."""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"
CAPTURAS = Path(os.environ.get("E2E_CAPTURAS") or Path(__file__).resolve().parent / "capturas")
CAPTURAS.mkdir(parents=True, exist_ok=True)
ARGS = [f"--host-resolver-rules=MAP {os.environ['E2E_RESOLVE']}"] if os.environ.get("E2E_RESOLVE") else []
BLOQUEAR = os.environ.get("E2E_BLOQUEAR") == "1"

TELAS = [("celular", {"viewport": {"width": 390, "height": 844}, "is_mobile": True, "has_touch": True, "device_scale_factor": 3}),
         ("desktop", {"viewport": {"width": 1440, "height": 900}})]
ESTACOES = ["quem", "pecas", "custo", "horas", "mont", "dias", "mult", "maos", "trava", "furo", "ia"]


def jogar(pg, nome):
    enviados = []
    if BLOQUEAR:
        def responder(route):
            try:
                enviados.append(json.loads(route.request.post_data or "{}").get("evento"))
            except ValueError:
                enviados.append("?")
            route.fulfill(status=200, content_type="application/json", body='{"ok":true}')
        pg.route("**/webhook/**", responder)

    n = 0

    def topo(eid):
        pg.evaluate(f"document.getElementById('{eid}').scrollIntoView({{block: 'start'}})")
        pg.wait_for_timeout(250)

    def foto(rotulo):
        nonlocal n
        n += 1
        pg.wait_for_timeout(350)
        pg.screenshot(path=str(CAPTURAS / f"{nome}-{n:02d}-{rotulo}.png"))

    pg.goto(URL)
    pg.wait_for_timeout(2600)  # o logo termina de se montar
    foto("portao")
    pg.get_by_role("button", name="Ligar a fábrica").click(timeout=15000)
    pg.wait_for_timeout(1300)

    recepcao = pg.locator("#estacao-perfil")
    recepcao.get_by_role("radiogroup", name="Setor da empresa").get_by_role("radio").nth(0).click()
    recepcao.get_by_role("radiogroup", name="Faturamento anual").get_by_role("radio").nth(0).click()
    pg.wait_for_timeout(1600)  # deixa a rolagem automática acontecer antes de voltar para fotografar
    topo("estacao-perfil")
    foto("recepcao")

    for i, eid in enumerate(ESTACOES):
        secao = pg.locator(f"#estacao-{eid}")
        secao.scroll_into_view_if_needed()
        radios = secao.get_by_role("radio")
        expect(radios.first).to_be_enabled()
        radios.nth(min(2, radios.count() - 1)).click()
        pg.wait_for_timeout(1600)
        topo(f"estacao-{eid}")
        foto(f"estacao-{eid}")
        letreiro = {"quem": 0, "mult": 2, "ia": 3}.get(eid)  # mostra 3 dos 4 letreiros
        if letreiro is not None:
            topo(f"letreiro-{letreiro}")
            pg.wait_for_timeout(1500)  # número contando
            foto(f"letreiro-{letreiro}")

    expect(pg.get_by_role("progressbar", name="Progresso do diagnóstico")).to_have_attribute("aria-valuenow", "12")
    topo("cofre")
    pg.fill("#c-nome", "TESTE E2E")
    pg.fill("#c-email", "teste-e2e@aodigital.com.br")
    pg.fill("#c-empresa", "Teste")
    pg.fill("#c-cargo", "QA")
    foto("cofre")
    pg.get_by_role("button", name="Desbloquear").click()
    pg.wait_for_timeout(1200)
    foto("cofre-abrindo")
    expect(pg.get_by_text("Caso fechado").first).to_be_visible(timeout=10000)
    pg.wait_for_timeout(2200)
    expect(pg.get_by_text("R$ 161.200").first).to_be_visible()
    foto("painel")
    pg.mouse.wheel(0, 900)
    pg.wait_for_timeout(700)
    foto("painel-2")

    topo("expedicao")
    pg.wait_for_timeout(2500)  # robô 3D (desktop) e vídeo saindo do desfoque
    foto("expedicao")
    pg.get_by_role("button", name="Quero a sessão").click()
    expect(pg.get_by_text("Recebido. Respondemos em até um dia útil.")).to_be_visible()
    pg.wait_for_timeout(2500)  # dá tempo da atualização chegar ao n8n
    foto("expedicao-recebido")

    largura = pg.evaluate("document.documentElement.scrollWidth")
    vista = pg.evaluate("window.innerWidth")
    assert largura <= vista, f"rolagem lateral: {largura} > {vista}"
    if BLOQUEAR:
        assert enviados.count("desbloqueio") == 1, f"desbloqueio enviado {enviados.count('desbloqueio')} vezes: {enviados}"
        assert "atualizacao" in enviados, f"sessão não enviada: {enviados}"
    print(nome, "OK —", n, "capturas", f"envios={enviados}" if BLOQUEAR else "")


with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    for nome, opts in TELAS:
        ctx = b.new_context(**opts)
        jogar(ctx.new_page(), nome)
        ctx.close()
    b.close()
