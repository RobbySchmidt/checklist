// Nur veröffentlichte Felder des Dienstes (keine domains, E-Mails, Vorlagen).
export function publicEmployer(e: any) {
  if (!e) return e
  return {
    id: e.id, status: e.status, name: e.name, slug: e.slug, legal_name: e.legal_name, logo: e.logo,
    color_primary: e.color_primary, color_secondary: e.color_secondary,
    address_street: e.address_street, address_zip: e.address_zip, address_city: e.address_city,
    phone: e.phone, website: e.website, imprint_url: e.imprint_url, privacy_url: e.privacy_url, service_area: e.service_area, about: e.about,
    schedule_model: e.schedule_model, benefits: e.benefits, is_demo: e.is_demo,
  }
}
