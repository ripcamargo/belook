import { FirebaseError } from 'firebase/app'

const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento e tente novamente.',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
  'auth/popup-closed-by-user': 'Login cancelado.',
  'auth/cancelled-popup-request': 'Login cancelado.',
  'auth/popup-blocked': 'O navegador bloqueou a janela de login. Permita pop-ups e tente novamente.',
  'auth/account-exists-with-different-credential': 'Já existe uma conta com este e-mail usando outro método de login.',
  'permission-denied': 'Você não tem permissão para realizar esta ação.',
  unavailable: 'Sem conexão com o servidor. Tente novamente.',
}

/** Converte erros do Firebase em mensagens amigáveis para exibir ao usuário. */
export function friendlyFirebaseError(error: unknown): string {
  if (error instanceof FirebaseError) {
    const code = error.code.replace('auth/', 'auth/').replace('firestore/', '')
    return MESSAGES[error.code] ?? MESSAGES[code] ?? 'Ocorreu um erro. Tente novamente.'
  }
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado. Tente novamente.'
}
