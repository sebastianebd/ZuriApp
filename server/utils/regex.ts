/**
 * Escapes special regex characters from a user-supplied string.
 * Prevents ReDoS (Regular Expression Denial of Service) attacks
 * when constructing MongoDB regex queries from user input.
 */
export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
