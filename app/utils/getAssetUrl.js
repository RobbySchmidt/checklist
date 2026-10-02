const getAssetUrl = () => {
  const config = useRuntimeConfig()
  return config.public.directusUrl + '/assets/'
}

/**
 * URL für ein Directus-Bild mit Transformation, z. B. getAssetSrc(image, { width: 600 }).
 * Akzeptiert das Datei-Objekt (mit filename_disk/id) oder direkt die ID.
 */
const getAssetSrc = (image, params = {}) => {
  if (!image) return ''
  const file = typeof image === 'string' ? image : (image.filename_disk || image.id)
  if (!file) return ''
  const query = new URLSearchParams({ format: 'auto', ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)) })
  return `${getAssetUrl()}${file}?${query.toString()}`
}

export { getAssetUrl, getAssetSrc }
