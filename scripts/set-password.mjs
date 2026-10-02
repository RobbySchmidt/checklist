// Passwort für einen Portal-Nutzer setzen. Aufruf: yarn portal:password <email> <passwort>
import { directus, readItems, updateItem } from './lib/directus-admin.mjs';
import { hashPassword, isStrongEnough } from '../shared/utils/password.ts';

const [emailArg, password] = process.argv.slice(2);
if (!emailArg || !password) {
  console.error('Aufruf: yarn portal:password <email> <passwort>');
  process.exit(1);
}
if (!isStrongEnough(password)) {
  console.error('Passwort zu kurz (mindestens 10 Zeichen).');
  process.exit(1);
}
const email = emailArg.trim().toLowerCase();
const found = await directus.request(readItems('portal_users', { filter: { email: { _eq: email } }, fields: ['id'], limit: 1 }));
if (!found.length) {
  console.error(`Kein Portal-Nutzer mit der E-Mail ${email}.`);
  process.exit(1);
}
await directus.request(updateItem('portal_users', found[0].id, { password_hash: hashPassword(password) }));
console.log(`Passwort gesetzt für ${email}`);
