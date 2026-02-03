export const formatTitleCase = (text: string | null | undefined): string => {
  if (!text) return ''

  // Common acronyms to keep uppercase
  const acronyms = [
    'TENS',
    'UCI',
    'UTI',
    'UPC',
    'MQ',
    'SAU',
    'SAMU',
    'RRHH',
    'TI',
    'CEO',
    'CFO',
    'CTO'
  ]

  // Exceptions (connectors) to keep lowercase unless they are the first word
  const connectors = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'o', 'en', 'por', 'a', 'para']

  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      const upperWord = word.toUpperCase()
      // If it's a known acronym, return it uppercase
      if (acronyms.includes(upperWord)) return upperWord

      // If it's a connector and NOT the first word, return it lowercase
      if (connectors.includes(word) && index !== 0) return word

      // Otherwise, capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}
