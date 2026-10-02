// scripts/lib/fields.mjs
// Wiederverwendbare Feld-Bausteine für Directus-Schema-Skripte (setup-schema.mjs, projektspezifische Schemas).
// Jeder Baustein liefert ein Field-Objekt für ensureCollection({ fields: [...] }) bzw. ensureField().

export const pkInt = { field: 'id', type: 'integer', meta: { hidden: true, readonly: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } };
export const pkUuid = { field: 'id', type: 'uuid', meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] }, schema: { is_primary_key: true, length: 36 } };
export const sortField = { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} };

export const statusField = {
  field: 'status', type: 'string',
  meta: {
    interface: 'select-dropdown', width: 'full',
    options: { choices: [
      { text: 'Veröffentlicht', value: 'published', color: '#2ECDA7' },
      { text: 'Entwurf', value: 'draft', color: '#FFC23B' },
      { text: 'Archiviert', value: 'archived', color: '#A2B5CD' },
    ] },
    display: 'labels',
    display_options: { showAsDot: true, choices: [
      { text: 'Veröffentlicht', value: 'published', foreground: '#FFFFFF', background: '#2ECDA7' },
      { text: 'Entwurf', value: 'draft', foreground: '#18222F', background: '#FFC23B' },
      { text: 'Archiviert', value: 'archived', foreground: '#FFFFFF', background: '#A2B5CD' },
    ] },
  },
  schema: { default_value: 'draft', is_nullable: false },
};

export const auditFields = [
  { field: 'user_created', type: 'uuid', meta: { special: ['user-created'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half', display: 'user', options: { template: '{{avatar.$thumbnail}} {{first_name}} {{last_name}}' } }, schema: {} },
  { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true, width: 'half', display: 'datetime', display_options: { relative: true } }, schema: {} },
  { field: 'user_updated', type: 'uuid', meta: { special: ['user-updated'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half', display: 'user', options: { template: '{{avatar.$thumbnail}} {{first_name}} {{last_name}}' } }, schema: {} },
  { field: 'date_updated', type: 'timestamp', meta: { special: ['date-updated'], interface: 'datetime', readonly: true, hidden: true, width: 'half', display: 'datetime', display_options: { relative: true } }, schema: {} },
];

// Archivierbare Collection mit status-Feld: in ensureCollection({ meta: { ...archiveMeta, ... } })
export const archiveMeta = { archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft', archive_app_filter: true };

export const input = (field, note, { schema = {}, ...extra } = {}) => ({ field, type: 'string', meta: { interface: 'input', width: 'half', note, options: { trim: true }, ...extra }, schema });
export const slugField = (field, note, extra = {}) => input(field, note, { options: { slug: true, trim: true }, schema: { is_unique: true }, ...extra });
export const textarea = (field, note, { schema = {}, ...extra } = {}) => ({ field, type: 'text', meta: { interface: 'input-multiline', width: 'full', note, ...extra }, schema });
export const richText = (field, note, extra = {}) => ({ field, type: 'text', meta: { interface: 'input-rich-text-html', width: 'full', note, options: { toolbar: ['bold', 'italic', 'underline', 'h2', 'h3', 'h4', 'numlist', 'bullist', 'link', 'removeformat', 'code'] }, ...extra }, schema: {} });
export const fileField = (field, note, extra = {}) => ({ field, type: 'uuid', meta: { interface: 'file-image', special: ['file'], display: 'image', width: 'half', note, ...extra }, schema: {} });
export const boolField = (field, note, def = false, extra = {}) => ({ field, type: 'boolean', meta: { interface: 'boolean', special: ['cast-boolean'], width: 'half', note, ...extra }, schema: { default_value: def } });
export const intField = (field, note, extra = {}) => ({ field, type: 'integer', meta: { interface: 'input', width: 'half', note, ...extra }, schema: {} });
export const dateField = (field, note, extra = {}) => ({ field, type: 'date', meta: { interface: 'datetime', display: 'datetime', width: 'half', note, ...extra }, schema: {} });
export const m2oField = (field, template, extra = {}) => ({ field, type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'half', options: { template }, ...extra }, schema: {} });
export const o2mField = (field, template, extra = {}) => ({ field, type: 'alias', meta: { interface: 'list-o2m', special: ['o2m'], width: 'full', options: { template }, ...extra }, schema: null });
export const select = (field, choices, def, note, extra = {}) => ({
  field, type: 'string',
  meta: { interface: 'select-dropdown', width: 'half', note, options: { choices: choices.map(([value, text]) => ({ value, text })) }, ...extra },
  schema: { default_value: def },
});

// Flächenfarben der Blöcke – Werte sind shadcn-Tokens (BlockSection.vue mappt sie auf bg-background / bg-primary / bg-secondary).
// Pro Projekt mit eigenen Labels überschreibbar: blockCommon('white', [['white', 'Weiß'], ['primary', 'Kupfer'], …]).
export const BG_CHOICES = [['white', 'Weiß'], ['background', 'Hintergrund'], ['primary', 'Primärfarbe'], ['secondary', 'Sekundärfarbe']];

// Gemeinsame Felder auf JEDEM Block: Flächenfarbe + Anker + Abstand nach unten (beim Anlegen neuer Blöcke mit `...blockCommon()` einbauen)
// paddingBottom: BlockSection setzt immer pt, pb nur per Flag → an bei Flächenwechsel/vor dem Footer, aus bei gleicher Fläche (sonst doppelter Abstand)
export const blockCommon = (defaultBg = 'white', bgChoices = BG_CHOICES) => [
  select('background', bgChoices, defaultBg, 'Flächenfarbe der Sektion'),
  input('anchor', 'Anker für #deeplinks aus dem Menü, z. B. "leistungen"', { options: { slug: true, trim: true } }),
  boolField('paddingBottom', 'Abstand nach unten – einschalten, wenn der nächste Block eine andere Flächenfarbe hat (oder der Footer folgt); aus, wenn er dieselbe hat'),
];
