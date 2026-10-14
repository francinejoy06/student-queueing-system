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
  callNext,
  finishTicket,
};