/**
 * Réduction des photos avant envoi.
 *
 * Les photos prises au téléphone pèsent couramment 3 à 8 Mo pour 4000 px de
 * large, alors qu'un site n'en affiche jamais plus de 1600 px. On les
 * redimensionne donc dans le navigateur avant l'envoi : les envois sont plus
 * rapides, les pages plus légères, et la limite de taille du stockage n'est
 * plus jamais atteinte.
 */

export type OptionsCompression = {
  /** Largeur ou hauteur maximale, en pixels. */
  tailleMax?: number
  /** Qualité JPEG/WebP entre 0 et 1. */
  qualite?: number
  /** En dessous de ce poids (octets), on n'y touche pas. */
  seuilOctets?: number
}

const DEFAUTS: Required<OptionsCompression> = {
  tailleMax: 1600,
  qualite: 0.82,
  seuilOctets: 400 * 1024,
}

function chargerImage(fichier: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Image illisible"))
    }
    img.src = url
  })
}

/**
 * Renvoie une version allégée du fichier, ou le fichier d'origine si la
 * compression n'est ni possible ni utile (GIF animé, SVG, petite image…).
 */
export async function compresserImage(
  fichier: File,
  options: OptionsCompression = {}
): Promise<File> {
  const { tailleMax, qualite, seuilOctets } = { ...DEFAUTS, ...options }

  if (typeof window === 'undefined' || typeof document === 'undefined') return fichier
  if (!fichier.type.startsWith('image/')) return fichier
  // formats qu'on ne doit pas ré-encoder
  if (/gif|svg/i.test(fichier.type)) return fichier

  try {
    const img = await chargerImage(fichier)
    const plusGrandCote = Math.max(img.width, img.height)

    // déjà légère et de taille raisonnable : on garde l'original
    if (fichier.size <= seuilOctets && plusGrandCote <= tailleMax) return fichier

    const ratio = plusGrandCote > tailleMax ? tailleMax / plusGrandCote : 1
    const largeur = Math.round(img.width * ratio)
    const hauteur = Math.round(img.height * ratio)

    const canvas = document.createElement('canvas')
    canvas.width = largeur
    canvas.height = hauteur
    const ctx = canvas.getContext('2d')
    if (!ctx) return fichier
    ctx.imageSmoothingQuality = 'high'
    // fond blanc : évite qu'un PNG transparent devienne noir en JPEG
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, largeur, hauteur)
    ctx.drawImage(img, 0, 0, largeur, hauteur)

    const typeSortie = fichier.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, typeSortie, qualite)
    )
    if (!blob || blob.size >= fichier.size) return fichier

    const extension = typeSortie === 'image/webp' ? 'webp' : 'jpg'
    const nom = fichier.name.replace(/\.[^.]+$/, '') + '.' + extension
    return new File([blob], nom, { type: typeSortie, lastModified: Date.now() })
  } catch {
    // en cas de souci, on envoie le fichier d'origine plutôt que de bloquer
    return fichier
  }
}

/** Formate un poids d'octets pour l'affichage (ex. « 2,4 Mo »). */
export function formaterPoids(octets: number): string {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
}
