/** Local, conservative filtering for synthetic professional text; not real-data anonymization. */
const contact =
  /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}|https?:\/\/\S+|www\.\S+|\+?\d[\d ().-]{5,}\d|\b[A-Z]{2}\s*\d{2}(?:\s*\d){11,30}\b/giu;
const sensitive =
  /choruj[ęe]|cukrzyc|depresj|\bHIV\b|\bADHD\b|diagnoz|niepełnosprawnoś|jestem w ciąży|orientacj[aię] seksualn|wyznanie|pogląd[yi] politycz|przynależnoś.{0,20}związk|karalnoś|dane genetycz|dane biometrycz|hasło\s*[:=]|password\s*[:=]|api[_ -]?key\s*[:=]/iu;
const privateLine =
  /^\s*(?:adres|telefon|tel\.?|e-?mail|kontakt|pesel|nip|regon|data urodzenia|miejsce urodzenia|obywatelstwo|narodowość|stan cywilny|konto bankowe)\s*[:=]|\bul\.\s+\p{L}|\burodzon[ay]\b|urodzi[łl](?:em|am)/iu;
const namePair =
  /(?<![\p{L}\p{N}])[\p{Lu}][\p{Ll}]+(?:[-'][\p{Lu}]?[\p{Ll}]+)?\s+[\p{Lu}][\p{Ll}]+(?:[-'][\p{Lu}]?[\p{Ll}]+)?(?![\p{L}\p{N}])/gu;
const professionalRoles = new Set([
  "product manager",
  "project manager",
  "software engineer",
  "ux designer",
  "product designer",
  "data analyst",
  "data scientist",
]);
const replacement = "[dane usunięte]";

export function prepareProfessionalText(text: string, candidateName = ""): string {
  if (text.length > 12000) return "";
  const names = candidateName.split(/\s+/u).filter((part) => part.length >= 3);
  return text
    .normalize("NFC")
    .split(/\n/u)
    .flatMap((line) => {
      if (privateLine.test(line) || sensitive.test(line)) return [];
      let prepared = line.replace(contact, replacement);
      for (const name of names) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
        prepared = prepared.replace(
          new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu"),
          replacement,
        );
      }
      prepared = prepared
        .replace(namePair, (pair) =>
          professionalRoles.has(pair.toLowerCase()) ? pair : replacement,
        )
        .replace(/[ \t]+/gu, " ")
        .trim();
      const content = prepared
        .replace(/\[[^\]]*\]/gu, "")
        .replace(/(?<![\p{L}])(?:nazywam|się|telefon|tel|email|kontakt)(?![\p{L}])/giu, "")
        .replace(/[^\p{L}]/gu, "");
      return content.length >= 3 ? [prepared] : [];
    })
    .join("\n")
    .trim();
}

/** Independently checked at the HTTP boundary; only recognized patterns are covered. */
export function isPreparedProfessionalText(text: string): boolean {
  return !!text.trim() && prepareProfessionalText(text) === text;
}
export function prepareCandidateContext(input: { answer: string; cv: string; name: string }) {
  const applicationText = prepareProfessionalText(input.answer, input.name);
  const cvText = prepareProfessionalText(input.cv, input.name);
  return { applicationText, ...(cvText ? { cvText } : {}) };
}
