/**
 * Núcleo compartilhado da plataforma: usuário no formato nome.sobrenome é
 * convertido para um e-mail interno determinístico usado apenas pelo
 * mecanismo de autenticação. O usuário nunca vê esse e-mail.
 */
export const INTERNAL_EMAIL_DOMAIN = "portal.interno";

export function normalizeUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_EMAIL_DOMAIN}`;
}

export const PERMISSION_ADMIN = "administracao";
