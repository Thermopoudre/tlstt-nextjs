/**
 * Saison sportive en cours, au format « 2026-2027 ».
 * La saison de tennis de table bascule au 1er juillet.
 */
export function saisonActuelle(separateur: '-' | '/' = '-'): string {
  const now = new Date()
  const annee = now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1
  return `${annee}${separateur}${annee + 1}`
}
