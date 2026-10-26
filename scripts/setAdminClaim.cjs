/**
 * Script to set Firebase Custom Claims:
 * - admin: true
 * - mosqueEditor: true
 * - schoolEditor: true
 * - hospitalEditor: true
 * - transportEditor: true
 *
 * Usage:
 * 1. Download your Firebase Service Account JSON from Firebase Console:
 *    Project Settings -> Service Accounts -> Generate New Private Key
 *    Save it in this directory as serviceAccountKey.json
 * 2. Run:
 *    node scripts/setAdminClaim.cjs your-email@example.com admin
 *    or
 *    node scripts/setAdminClaim.cjs your-email@example.com mosqueEditor
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const keyPath = path.resolve(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(keyPath)) {
  console.error('\n[Error] serviceAccountKey.json not found!');
  console.log('Firebase Console se Service Account Key download karein aur scripts/ folder mein rakhein:');
  console.log('1. Firebase Console -> Project Settings -> Service Accounts');
  console.log('2. "Generate new private key" par click karein.');
  console.log('3. File ka naam serviceAccountKey.json rakh kar scripts/ folder mein save karein.\n');
  process.exit(1);
}

const serviceAccount = require(keyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const [,, targetEmail, roleArg] = process.argv;

if (!targetEmail) {
  console.log('\nUsage: node scripts/setAdminClaim.cjs <user-email> [role]');
  console.log('Available roles: admin, mosqueEditor, schoolEditor, hospitalEditor, transportEditor');
  console.log('Example: node scripts/setAdminClaim.cjs admin@ratta.pk admin\n');
  process.exit(1);
}

const role = roleArg || 'admin';
const validRoles = ['admin', 'mosqueEditor', 'schoolEditor', 'hospitalEditor', 'transportEditor'];

if (!validRoles.includes(role)) {
  console.error(`Invalid role: ${role}. Valid choices: ${validRoles.join(', ')}`);
  process.exit(1);
}

async function setClaim() {
  try {
    const user = await admin.auth().getUserByEmail(targetEmail);
    const existingClaims = user.customClaims || {};
    const updatedClaims = {
      ...existingClaims,
      [role]: true,
    };

    await admin.auth().setCustomUserClaims(user.uid, updatedClaims);
    console.log(`\n[Kamiyabi!] User ${targetEmail} (UID: ${user.uid}) ko role "${role}: true" de diya gaya hai.`);
    console.log('Updated Custom Claims:', updatedClaims);
    console.log('Ab user portal par login kar ke mukammal ikhtiyarat istemal kar sakta hai.\n');
  } catch (err) {
    console.error('Error setting custom claim:', err.message);
  } finally {
    process.exit(0);
  }
}

setClaim();
