import type { Contato } from "@/flow/quiz";

type Campo = keyof Contato;
export type Validacao = { ok: true; contato: Contato } | { ok: false; campo: Campo; mensagem: string };

const corta = (v: string, max: number) => String(v || "").trim().slice(0, max);

export function validarContato(c: Contato): Validacao {
  const nome = corta(c.nome, 120);
  const email = corta(c.email, 254).toLowerCase();
  const empresa = corta(c.empresa, 120);
  const cargo = corta(c.cargo, 120);
  const whatsapp = String(c.whatsapp || "").replace(/\D/g, "").slice(0, 15);

  if (!nome) return { ok: false, campo: "nome", mensagem: "Informe seu nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, campo: "email", mensagem: "Informe um e-mail corporativo válido." };
  if (!empresa) return { ok: false, campo: "empresa", mensagem: "Informe a empresa." };
  if (!cargo) return { ok: false, campo: "cargo", mensagem: "Informe seu cargo." };
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 13)) return { ok: false, campo: "whatsapp", mensagem: "Confira o WhatsApp (DDD + número)." };
  return { ok: true, contato: { nome, email, empresa, cargo, whatsapp } };
}
