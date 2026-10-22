#!/usr/bin/env node

/**
 * ==============================================================
 * Brainstorm Academy — Super Admin Promotion Script
 * ==============================================================
 *
 * SECURITY REQUIREMENT:
 * Never allow public users to register as Admin. Admin privileges
 * MUST only be granted via trusted server-side administration.
 *
 * USAGE:
 * 1. Download your Firebase Service Account JSON key from:
 *    Firebase Console > Project Settings > Service accounts > Generate new private key
 * 2. Save it securely as `serviceAccountKey.json` in the root (do not commit to git).
 * 3. Run:
 *    node scripts/setSuperAdmin.js <user-email-or-uid>
 *
 * Example:
 *    node scripts/setSuperAdmin.js admin@brainstormacademy.in
 * ==============================================================
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const targetIdentifier = process.argv[2];

  if (!targetIdentifier) {
    console.error('\n❌ ERROR: Please specify the user email or UID to promote.');
    console.error('Usage: node scripts/setSuperAdmin.js <user-email-or-uid>\n');
    process.exit(1);
  }

  // Check for firebase-admin package
  let admin;
  try {
    admin = require('firebase-admin');
  } catch (e) {
    console.error('\n❌ ERROR: "firebase-admin" is required to run server-side administrative tasks.');
    console.error('Please install it locally for administrative scripts:');
    console.error('   npm install --save-dev firebase-admin\n');
    process.exit(1);
  }

  // Look for serviceAccountKey.json
  const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.error('\n❌ ERROR: Service account key not found at: ' + serviceAccountPath);
    console.error('To perform trusted server administration:');
    console.error('1. Go to Firebase Console > Project Settings > Service accounts');
    console.error('2. Click "Generate new private key"');
    console.error('3. Save it as "serviceAccountKey.json" in the project root directory.');
    console.error('4. Re-run this script.\n');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const auth = admin.auth();
  const db = admin.firestore();

  try {
    let userRecord;

    if (targetIdentifier.includes('@')) {
      console.log(`\n🔍 Looking up user by email: ${targetIdentifier}...`);
      userRecord = await auth.getUserByEmail(targetIdentifier);
    } else {
      console.log(`\n🔍 Looking up user by UID: ${targetIdentifier}...`);
      userRecord = await auth.getUser(targetIdentifier);
    }

    console.log(`✅ User found: ${userRecord.displayName || 'No Name'} (${userRecord.uid})`);

    // 1. Set Custom Claims on Firebase Auth token
    console.log('🔒 Setting Custom Claims: { role: "admin", admin: true }...');
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      admin: true,
      superAdmin: true,
    });

    // 2. Update Firestore user document
    console.log('📝 Updating Firestore user document to role: "admin"...');
    const userDocRef = db.collection('users').doc(userRecord.uid);
    await userDocRef.set(
      {
        role: 'admin',
        isSuperAdmin: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: Super Admin permissions successfully granted!');
    console.log('======================================================');
    console.log(`User:  ${userRecord.email}`);
    console.log(`UID:   ${userRecord.uid}`);
    console.log(`Role:  admin`);
    console.log('\nThe user will have full Super Admin access upon their next sign-in or token refresh.\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ FAILED to promote user:', err.message);
    process.exit(1);
  }
}

main();
