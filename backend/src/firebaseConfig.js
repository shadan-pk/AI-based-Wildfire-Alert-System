const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with service account
admin.initializeApp({
  credential: admin.credential.cert(require('../serviceAccountKey.json')),
});

// Get Firestore instance
const db = admin.firestore();

module.exports = { db };