/** Repara texto UTF-8 leído erróneamente como Latin-1 (ej. DiabÃ©tica → Diabética). */
export function repararTextoUtf8(texto: string | null | undefined): string {
  if (!texto) return ""
  if (!/[\u00C2\u00C3\u00E2\uFFFD]/.test(texto)) return texto

  try {
    const bytes = Uint8Array.from(texto, (char) => char.charCodeAt(0) & 0xff)
    const reparado = new TextDecoder("utf-8", { fatal: false }).decode(bytes)
    if (reparado.includes("\uFFFD") || reparado.length === 0) return texto
    return reparado
  } catch {
    return texto
  }
}

export function repararTextoOpcional(
  texto: string | null | undefined,
): string | null | undefined {
  if (texto == null) return texto
  return repararTextoUtf8(texto)
}
