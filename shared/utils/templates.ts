export const DEFAULT_TEMPLATE_INVITE = `Hallo {name},

vielen Dank für Ihre Bewerbung als {stelle} bei {dienst}. Wir würden Sie gern kennenlernen. Wann passt es Ihnen für ein kurzes Gespräch, gern auch telefonisch?

Herzliche Grüße
{ansprechperson}
{dienst} · {telefon}`

export const DEFAULT_TEMPLATE_REJECT = `Hallo {name},

vielen Dank für Ihre Bewerbung als {stelle} bei {dienst}. Wir haben uns für eine andere Bewerberin oder einen anderen Bewerber entschieden. Wir wünschen Ihnen für Ihren weiteren Weg alles Gute.

Herzliche Grüße
{ansprechperson}
{dienst}`

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key]! : m))
}
