// Creates test accounts with HASHED passwords.
// Run:  node scripts/seed.js
const bcrypt = require('bcryptjs');
const db = require('../config/db');

(async () => {
  const accounts = [
    ['Admin User', 'admin@school.edu', 'Admin123!', 'admin'],
    ['Staff User', 'staff@school.edu', 'Staff123!', 'staff'],
    ['Student User', 'student@school.edu', 'Student123!', 'student']
  ];

  try {
    for (const [name, email, password, role] of accounts) {
      const hash = await bcrypt.hash(password, 10);
      const [result] = await db.query(
        'INSERT IGNORE INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hash, role]
      );
      console.log(result.affectedRows ? 'Created: ' : 'Already exists: ', email, `(${role})`);
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
  }
  process.exit();
})();
