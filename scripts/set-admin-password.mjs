/**
 * Generate a new admin password hash.
 *
 *   node scripts/set-admin-password.mjs
 *
 * Prompts for the password on stdin, so it never appears in your shell
 * history, in a file, or in any transcript. Prints the SQL to paste into the
 * Supabase SQL editor.
 *
 * The hashing here is copied exactly from src/lib/auth/admin-session.ts:
 *   salt = randomBytes(16).toString('hex')
 *   hash = scryptSync(password, salt, 64).toString('hex')
 *   stored as `${salt}:${hash}`
 * If that file ever changes, change this to match or logins will fail.
 */

import { randomBytes, scryptSync } from 'node:crypto';
import readline from 'node:readline';

const ADMIN_EMAIL = process.argv[2] ?? 'admin@boothop.com';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });

// Suppress echo so the password is not shown as it is typed.
const originalWrite = rl._writeToOutput?.bind(rl);
let muted = false;
rl._writeToOutput = function (str) {
  if (muted) return;
  if (originalWrite) originalWrite(str);
  else process.stdout.write(str);
};

const ask = (q) =>
  new Promise((resolve) => {
    rl.question(q, (answer) => resolve(answer));
    muted = true;
  });

const password = (await ask(`New password for ${ADMIN_EMAIL}: `)).trim();
muted = false;
process.stdout.write('\n');
rl.close();

if (password.length < 12) {
  console.error('\nRefusing: use at least 12 characters. This is the only admin account on the platform.\n');
  process.exit(1);
}

const stored = hashPassword(password);

console.log('\nPaste this into the Supabase SQL editor:\n');
console.log(`UPDATE public.admin_accounts`);
console.log(`   SET password_hash    = '${stored}',`);
console.log(`       is_temp_password = false`);
console.log(` WHERE email = '${ADMIN_EMAIL}';\n`);
console.log('Then sign in at https://www.boothop.com/admin/login\n');
console.log('The hash above is useless without the password you just typed —');
console.log('scrypt is one-way, which is why the old password could not be read back.\n');
