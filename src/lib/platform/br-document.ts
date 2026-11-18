/** CPF e CNPJ brasileiros: normalização e dígitos verificadores. */

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function allSameDigit(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

export function isValidCpf(input: string): boolean {
  const cpf = digitsOnly(input);
  if (cpf.length !== 11 || allSameDigit(cpf)) return false;

  for (const length of [9, 10]) {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index);
    }
    const check = ((sum * 10) % 11) % 10;
    if (check !== Number(cpf[length])) return false;
  }
  return true;
}

export function isValidCnpj(input: string): boolean {
  const cnpj = digitsOnly(input);
  if (cnpj.length !== 14 || allSameDigit(cnpj)) return false;

  for (const length of [12, 13]) {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(cnpj[index]) * weights[index];
    }
    const remainder = sum % 11;
    const check = remainder < 2 ? 0 : 11 - remainder;
    if (check !== Number(cnpj[length])) return false;
  }
  return true;
}

export type BrDocumentKind = "cpf" | "cnpj";

export function detectBrDocument(input: string): BrDocumentKind | null {
  const digits = digitsOnly(input);
  if (digits.length === 11 && isValidCpf(digits)) return "cpf";
  if (digits.length === 14 && isValidCnpj(digits)) return "cnpj";
  return null;
}

export function formatBrDocument(digits: string | null | undefined): string {
  if (!digits) return "";
  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  if (digits.length === 14) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
  }
  return digits;
}
