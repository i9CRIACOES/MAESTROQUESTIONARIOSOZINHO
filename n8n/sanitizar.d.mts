export const COLS: string[];
export function sanitizar(body: unknown): { _acao: "gravar" | "atualizar" | "ignorar" | "rejeitar"; [campo: string]: string | number };
