// Dienst der aktuellen Domain, für die öffentlichen Seiten. Nur veröffentlichte Felder (keine domains, E-Mails, Vorlagen).
export default defineEventHandler((event) => {
  if (event.context.employerError) throw createError({ statusCode: 503, statusMessage: 'Dienst gerade nicht erreichbar' })
  const e = event.context.employer
  if (!e) throw createError({ statusCode: 404, statusMessage: 'Kein Dienst für diese Adresse' })
  return {
    id: e.id, status: e.status, name: e.name, slug: e.slug, legal_name: e.legal_name, logo: e.logo,
    color_primary: e.color_primary, color_secondary: e.color_secondary,
    address_street: e.address_street, address_zip: e.address_zip, address_city: e.address_city,
    phone: e.phone, website: e.website, service_area: e.service_area, about: e.about,
    schedule_model: e.schedule_model, benefits: e.benefits, is_demo: e.is_demo,
  }
})
