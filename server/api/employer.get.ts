// Dienst der aktuellen Domain, für die öffentlichen Seiten. Nur veröffentlichte Felder (keine domains, E-Mails, Vorlagen).
export default defineEventHandler((event) => {
  if (event.context.employerError) throw createError({ statusCode: 503, statusMessage: 'Dienst gerade nicht erreichbar' })
  const e = event.context.employer
  if (!e) throw createError({ statusCode: 404, statusMessage: 'Kein Dienst für diese Adresse' })
  return publicEmployer(e)
})
