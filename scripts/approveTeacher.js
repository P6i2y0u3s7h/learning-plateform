#!/usr/bin/env node

/**
 * ==============================================================
 * Brainstorm Academy — Teacher Application Approval Script
 * ==============================================================
 *
 * Approves a pending teacher account, allowing them to access
 * educator tools and course management features.
 *
 * USAGE:
 * node scripts/approveTeacher.js <teacher-email-or-uid>
 * ==============================================================
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const target = process.argv[2];

  if (!target) {
    console.error('\nUsage: node scripts/approveTeacher.js <teacher-email-or-uid>\n');
    process.exit(1);
  }

  let admin;
  try {
    admin = require('firebase-admin');
  } catch (e) {
    console.error('Please install firebase-admin for script execution: npm i -D firebase-admin');
    process.exit(1);
  }

  const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Missing serviceAccountKey.json in root directory.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  const auth = admin.auth();
  const db = admin.firestore();

  try {
    const userRecord = target.includes('@')
      ? await auth.getUserByEmail(target)
      : await auth.getUser(target);

    // Set custom claim
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'teacher',
      teacherApproved: true,
    });

    // Update Firestore document
    await db.collection('users').doc(userRecord.uid).set(
      {
        role: 'teacher',
        approvalStatus: 'approved',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`\n✅ Teacher ${userRecord.email} has been APPROVED!\n`);
    process.exit(0);
  } catch (err) {
    console.error('Error approving teacher:', err.message);
    process.exit(1);
  }
}

main();
