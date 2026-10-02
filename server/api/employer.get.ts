// Dienst der aktuellen Domain, für die öffentlichen Seiten.
export default defineEventHandler((event) => {
  if (event.context.employerError) throw createError({ statusCode: 503, statusMessage: 'Dienst gerade nicht erreichbar' })
  const employer = event.context.employer
  if (!employer) throw createError({ statusCode: 404, statusMessage: 'Kein Dienst für diese Adresse' })
  return employer
})
