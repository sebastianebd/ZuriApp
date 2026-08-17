/**
 * Convierte un string a Title Case (ej: " jUaN  pÉrEz " -> "Juan Pérez")
 * Remueve espacios duplicados. Ideal para nombres propios y ubicaciones.
 */
export const toTitleCase = (text: string): string => {
  if (!text) return text;
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, index) => {
      // Excepciones culturales comunes para nombres y apellidos, a menos que sea la primera palabra
      const lowers = ['de', 'del', 'la', 'las', 'los', 'y', 'e'];
      if (index > 0 && lowers.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      
      // Manejar apellidos como "McDonald" o "O'Connor"
      if (word.toLowerCase().startsWith('mc') && word.length > 2) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
      }
      if (word.toLowerCase().startsWith("o'") && word.length > 2) {
        return "O'" + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
      }
      if (word.toLowerCase().startsWith("mac") && word.length > 3) {
        return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4).toLowerCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Convierte un string a Sentence Case (ej: "  sistema de rH " -> "Sistema de rH")
 * Remueve espacios duplicados y solo capitaliza la primera letra.
 * Ideal para descripciones largas donde se deben preservar acrónimos interiores.
 */
export const toSentenceCase = (text: string): string => {
  if (!text) return text;
  const cleanText = text.trim().replace(/\s+/g, ' ');
  return cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
};

/**
 * Reemplaza vocales por clases de caracteres que ignoran acentos para usar en expresiones regulares.
 * Ideal para búsquedas en MongoDB sin índices de texto.
 */
export const buildAccentInsensitiveRegex = (term: string): string => {
  return term
    .replace(/[aáAÁ]/g, '[aáAÁ]')
    .replace(/[eéEÉ]/g, '[eéEÉ]')
    .replace(/[iíIÍ]/g, '[iíIÍ]')
    .replace(/[oóOÓ]/g, '[oóOÓ]')
    .replace(/[uúüUÚÜ]/g, '[uúüUÚÜ]')
    .replace(/[nñNÑ]/g, '[nñNÑ]');
};
