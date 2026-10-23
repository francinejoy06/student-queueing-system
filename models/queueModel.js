const pool = require('../config/db');

async function getOffices() {
  const [rows] = await pool.query(
    'SELECT id, name FROM offices WHERE is_active = TRUE ORDER BY name'
  );
  return rows;
}

async function getWaitingTickets(officeId) {
  const [rows] = await pool.query(
    `SELECT t.id, t.ticket_number, t.purpose, t.created_at, u.full_name
     FROM queue_tickets t
     JOIN users u ON u.id = t.student_id
     WHERE t.office_id = ? AND t.status = 'waiting'
     ORDER BY t.created_at ASC, t.id ASC`,
    [officeId]
  );
  return rows;
}

async function getServingTicket(officeId) {
  const [rows] = await pool.query(
    `SELECT t.id, t.ticket_number, t.purpose, u.full_name
     FROM queue_tickets t
     JOIN users u ON u.id = t.student_id
     WHERE t.office_id = ? AND t.status = 'serving'
     LIMIT 1`,
    [officeId]
  );
  return rows[0] || null;
}

async function getQueueTickets({ officeId, query, status }) {
  const filters = ['t.office_id = ?'];
  const values = [officeId];
  if (status) {
    filters.push('t.status = ?');
    values.push(status);
  }
  if (query) {
    filters.push('(t.ticket_number LIKE ? OR u.full_name LIKE ? OR t.purpose LIKE ?)');
    const like = `%${query}%`;
    values.push(like, like, like);
  }
  const [rows] = await pool.query(
    `SELECT t.id, t.ticket_number, t.purpose, t.status, t.created_at, u.full_name
     FROM queue_tickets t
     JOIN users u ON u.id = t.student_id
     WHERE ${filters.join(' AND ')}
     ORDER BY CASE t.status WHEN 'serving' THEN 0 WHEN 'waiting' THEN 1 ELSE 2 END,
       t.created_at DESC, t.id DESC`,
    values
  );
  return rows;
}

async function getStudents() {
  const [rows] = await pool.query(
    "SELECT id, full_name, email FROM users WHERE role = 'student' ORDER BY full_name"
  );
  return rows;
}

async function getStudentTickets(studentId) {
  const [rows] = await pool.query(
    `SELECT t.id, t.ticket_number, t.purpose, t.status, t.created_at, o.name AS office_name
     FROM queue_tickets t
     JOIN offices o ON o.id = t.office_id
     WHERE t.student_id = ?
     ORDER BY t.created_at DESC, t.id DESC`,
    [studentId]
  );
  return rows;
}

async function getTicket(id) {
  const [rows] = await pool.query(
    `SELECT id, ticket_number, student_id, office_id, purpose, status
     FROM queue_tickets WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}


async function createTicket({ studentId, officeId, purpose }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Lock this office's counter so simultaneous requests
    // cannot receive the same number.
    const [counterRows] = await connection.query(
      `SELECT last_number
       FROM office_ticket_counters
       WHERE office_id = ?
       FOR UPDATE`,
      [officeId]
    );

    if (counterRows.length === 0) {
      throw new Error('Ticket counter not found for this office.');
    }

    const nextNumber = Number(counterRows[0].last_number) + 1;

    // Get the office name to create its ticket prefix.
    const [officeRows] = await connection.query(
      'SELECT name FROM offices WHERE id = ? AND is_active = TRUE',
      [officeId]
    );

    if (officeRows.length === 0) {
      throw new Error('Office not found or inactive.');
    }

    const prefixMap = {
      'Registrar': 'R',
      'Cashier': 'C',
      'Guidance Office': 'G',
      'Library': 'L',
      'Admission Office': 'A'
    };

    const prefix = prefixMap[officeRows[0].name];

    if (!prefix) {
      throw new Error('No ticket prefix configured for this office.');
    }

    const ticketNumber = `${prefix}-${String(nextNumber).padStart(3, '0')}`;

    // Create the ticket with its office-specific number.
    const [result] = await connection.query(
      `INSERT INTO queue_tickets
         (ticket_number, student_id, office_id, purpose)
       VALUES (?, ?, ?, ?)`,
      [ticketNumber, studentId, officeId, purpose || null]
    );

    // Save the new counter value.
    await connection.query(
      `UPDATE office_ticket_counters
       SET last_number = ?
       WHERE office_id = ?`,
      [nextNumber, officeId]
    );

    await connection.commit();
    return result.insertId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}


async function updateTicket(id, { studentId, officeId, purpose }) {
  const [result] = await pool.query(
    `UPDATE queue_tickets SET student_id = ?, office_id = ?, purpose = ?
     WHERE id = ? AND status = 'waiting'`,
    [studentId, officeId, purpose || null, id]
  );
  return result.affectedRows > 0;
}

async function deleteTicket(id) {
  const [result] = await pool.query(
    "DELETE FROM queue_tickets WHERE id = ? AND status IN ('waiting', 'skipped', 'cancelled')",
    [id]
  );
  return result.affectedRows > 0;
}

async function getDashboardStats() {
  const [[stats]] = await pool.query(
    `SELECT
       SUM(status = 'waiting') AS waiting,
       SUM(status = 'serving') AS serving,
       SUM(status = 'completed') AS completed,
       COUNT(*) AS total
     FROM queue_tickets
     WHERE DATE(created_at) = CURDATE()`
  );
  const [recent] = await pool.query(
    `SELECT t.id, t.ticket_number, t.status, t.created_at, o.name AS office_name, u.full_name
     FROM queue_tickets t
     JOIN offices o ON o.id = t.office_id
     JOIN users u ON u.id = t.student_id
     ORDER BY t.created_at DESC, t.id DESC
     LIMIT 6`
  );
  return { stats, recent };
}

async function callNext(officeId) {
  const [rows] = await pool.query(
    `SELECT id FROM queue_tickets
     WHERE office_id = ? AND status = 'waiting'
     ORDER BY created_at ASC, id ASC
     LIMIT 1`,
    [officeId]
  );
  if (rows.length === 0) return null;

  await pool.query(
    `UPDATE queue_tickets SET status = 'serving', called_at = NOW() WHERE id = ?`,
    [rows[0].id]
  );
  return rows[0].id;
}

async function finishTicket(ticketId, newStatus) {
  if (!['completed', 'skipped'].includes(newStatus)) return false;
  const [result] = await pool.query(
    `UPDATE queue_tickets SET status = ? WHERE id = ? AND status = 'serving'`,
    [newStatus, ticketId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getOffices,
  getWaitingTickets,
  getServingTicket,
  getQueueTickets,
  getStudents,
  getStudentTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getDashboardStats,
  callNext,
  finishTicket,
};