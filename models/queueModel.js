
const pool = require('../config/db');

// ---------- OFFICES ----------

async function getOffices() {
  const [rows] = await pool.query(
    'SELECT id, name FROM offices WHERE is_active = TRUE ORDER BY name'
  );

  return rows;
}

// ---------- QUEUE TICKETS ----------

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
    filters.push(
      '(t.ticket_number LIKE ? OR u.full_name LIKE ? OR t.purpose LIKE ?)'
    );

    const like = `%${query}%`;
    values.push(like, like, like);
  }

  const [rows] = await pool.query(
    `SELECT
       t.id,
       t.ticket_number,
       t.purpose,
       t.status,
       t.created_at,
       u.full_name
     FROM queue_tickets t
     JOIN users u ON u.id = t.student_id
     WHERE ${filters.join(' AND ')}
     ORDER BY
       CASE t.status
         WHEN 'serving' THEN 0
         WHEN 'waiting' THEN 1
         ELSE 2
       END,
       t.created_at DESC,
       t.id DESC`,
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
    `SELECT
       t.id,
       t.ticket_number,
       t.purpose,
       t.status,
       t.created_at,
       o.name AS office_name
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
    `SELECT
       id,
       ticket_number,
       student_id,
       office_id,
       purpose,
       status
     FROM queue_tickets
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

// ---------- STUDENT: EDIT PURPOSE ----------

async function updateStudentTicketPurpose(
  ticketId,
  studentId,
  purpose
) {
  const [result] = await pool.query(
    `UPDATE queue_tickets
     SET purpose = ?
     WHERE id = ?
       AND student_id = ?
       AND status = 'waiting'`,
    [purpose || null, ticketId, studentId]
  );

  return result.affectedRows > 0;
}

// ---------- STUDENT: CANCEL TICKET ----------

async function cancelStudentTicket(ticketId, studentId) {
  const [result] = await pool.query(
    `UPDATE queue_tickets
     SET status = 'cancelled'
     WHERE id = ?
       AND student_id = ?
       AND status = 'waiting'`,
    [ticketId, studentId]
  );

  return result.affectedRows > 0;
}

// ---------- CREATE TICKET ----------

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
      Registrar: 'R',
      Cashier: 'C',
      'Guidance Office': 'G',
      Library: 'L',
      'Admission Office': 'A',
    };

    const prefix = prefixMap[officeRows[0].name];

    if (!prefix) {
      throw new Error('No ticket prefix configured for this office.');
    }

    const ticketNumber =
      `${prefix}-${String(nextNumber).padStart(3, '0')}`;

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

// ---------- STAFF/ADMIN: UPDATE TICKET ----------

async function updateTicket(
  id,
  { studentId, officeId, purpose },
  allowedOfficeId = null
) {
  let sql = `
    UPDATE queue_tickets
    SET student_id = ?, office_id = ?, purpose = ?
    WHERE id = ? AND status = 'waiting'
  `;

  const values = [
    studentId,
    officeId,
    purpose || null,
    id,
  ];

  // Restrict staff to tickets from their assigned office.
  if (allowedOfficeId !== null && allowedOfficeId !== undefined) {
    sql += ' AND office_id = ?';
    values.push(allowedOfficeId);
  }

  const [result] = await pool.query(sql, values);

  return result.affectedRows > 0;
}

// ---------- STAFF/ADMIN: DELETE TICKET ----------

async function deleteTicket(id, allowedOfficeId = null) {
  let sql = `
    DELETE FROM queue_tickets
    WHERE id = ?
      AND status IN ('waiting', 'skipped', 'cancelled')
  `;

  const values = [id];

  // Restrict staff to tickets from their assigned office.
  if (allowedOfficeId !== null && allowedOfficeId !== undefined) {
    sql += ' AND office_id = ?';
    values.push(allowedOfficeId);
  }

  const [result] = await pool.query(sql, values);

  return result.affectedRows > 0;
}

// ---------- DASHBOARD STATISTICS ----------

async function getDashboardStats(officeId = null) {
  const hasOfficeFilter =
    officeId !== null && officeId !== undefined;

  // Today's statistics: all offices for admins,
  // one assigned office for staff.
  const statsQuery = `
    SELECT
      COALESCE(SUM(status = 'waiting'), 0) AS waiting,
      COALESCE(SUM(status = 'serving'), 0) AS serving,
      COALESCE(SUM(status = 'completed'), 0) AS completed,
      COUNT(*) AS total
    FROM queue_tickets
    WHERE DATE(created_at) = CURDATE()
    ${hasOfficeFilter ? 'AND office_id = ?' : ''}
  `;

  const statsValues = hasOfficeFilter ? [officeId] : [];
  const [[stats]] = await pool.query(statsQuery, statsValues);

  // Recent tickets: all offices for admins,
  // the assigned office for staff.
  const recentQuery = `
    SELECT
      t.id,
      t.ticket_number,
      t.status,
      t.created_at,
      o.name AS office_name,
      u.full_name
    FROM queue_tickets t
    JOIN offices o ON o.id = t.office_id
    JOIN users u ON u.id = t.student_id
    ${hasOfficeFilter ? 'WHERE t.office_id = ?' : ''}
    ORDER BY t.created_at DESC, t.id DESC
    LIMIT 6
  `;

  const recentValues = hasOfficeFilter ? [officeId] : [];
  const [recent] = await pool.query(recentQuery, recentValues);

  return { stats, recent };
}

// ---------- CALL NEXT TICKET ----------

async function callNext(officeId) {
  const [rows] = await pool.query(
    `SELECT id
     FROM queue_tickets
     WHERE office_id = ? AND status = 'waiting'
     ORDER BY created_at ASC, id ASC
     LIMIT 1`,
    [officeId]
  );

  if (rows.length === 0) {
    return null;
  }

  const ticketId = rows[0].id;

  const [result] = await pool.query(
    `UPDATE queue_tickets
     SET status = 'serving', called_at = NOW()
     WHERE id = ?
       AND office_id = ?
       AND status = 'waiting'`,
    [ticketId, officeId]
  );

  return result.affectedRows > 0 ? ticketId : null;
}

// ---------- COMPLETE OR SKIP TICKET ----------

async function finishTicket(
  ticketId,
  newStatus,
  allowedOfficeId = null
) {
  if (!['completed', 'skipped'].includes(newStatus)) {
    return false;
  }

  let sql = `
    UPDATE queue_tickets
    SET status = ?
    WHERE id = ? AND status = 'serving'
  `;

  const values = [newStatus, ticketId];

  // Restrict staff to tickets from their assigned office.
  if (allowedOfficeId !== null && allowedOfficeId !== undefined) {
    sql += ' AND office_id = ?';
    values.push(allowedOfficeId);
  }

  const [result] = await pool.query(sql, values);

  return result.affectedRows > 0;
}

// ---------- EXPORTS ----------

module.exports = {
  getOffices,
  getWaitingTickets,
  getServingTicket,
  getQueueTickets,
  getStudents,
  getStudentTickets,
  getTicket,
  updateStudentTicketPurpose,
  cancelStudentTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getDashboardStats,
  callNext,
  finishTicket,
};
