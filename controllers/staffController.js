const queueModel = require('../models/queueModel');

const validStatuses = new Set(['waiting', 'serving', 'completed', 'skipped', 'cancelled']);

function positiveId(value) {
  const text = String(value || '');
  if (!/^\d+$/.test(text)) return null;
  const id = Number(text);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function redirectWithMessage(res, message, isError = false) {
  const key = isError ? 'error' : 'message';
  res.redirect(`/staff/queue?${key}=${encodeURIComponent(message)}`);
}

async function showDashboard(req, res) {
  try {
    const { stats, recent } = await queueModel.getDashboardStats();
    res.render('staff/dashboard', {
      currentUser: req.session.user,
      stats: stats || { waiting: 0, serving: 0, completed: 0, total: 0 },
      recent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not load the dashboard.');
  }
}

async function showQueue(req, res) {
  try {
    const offices = await queueModel.getOffices();
    if (!offices.length) return res.status(404).send('No offices found.');
    const requestedOffice = positiveId(req.query.office);
    const office = offices.find((item) => item.id === requestedOffice) || offices[0];
    const status = String(req.query.status || '').trim();
    if (status && !validStatuses.has(status)) return res.status(400).send('Invalid queue status.');
    const query = String(req.query.q || '').trim().slice(0, 100);
    const [tickets, waiting, serving] = await Promise.all([
      queueModel.getQueueTickets({ officeId: office.id, query, status }),
      queueModel.getWaitingTickets(office.id),
      queueModel.getServingTicket(office.id),
    ]);

    res.render('staff/queue', {
      currentUser: req.session.user,
      offices,
      office,
      tickets,
      waiting,
      serving,
      query,
      status,
      message: req.query.message || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong while loading the queue.');
  }
}

async function renderTicketForm(req, res, ticket = null, error = null, values = {}) {
  const [offices, students] = await Promise.all([
    queueModel.getOffices(),
    queueModel.getStudents(),
  ]);
  if (!offices.length) return res.status(404).send('No offices found.');
  if (!students.length) return res.status(400).send('Create a student account before adding a queue ticket.');
  return res.render('staff/ticket-form', {
    currentUser: req.session.user,
    offices,
    students,
    ticket,
    error,
    values,
  });
}

async function showAddForm(req, res) {
  try {
    await renderTicketForm(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not load the add-ticket form.');
  }
}

async function showEditForm(req, res) {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).send('Invalid ticket.');
  try {
    const ticket = await queueModel.getTicket(id);
    if (!ticket) return res.status(404).send('Ticket not found.');
    if (ticket.status !== 'waiting') return res.status(400).send('Only waiting tickets can be edited.');
    await renderTicketForm(req, res, ticket);
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not load the edit-ticket form.');
  }
}

function getTicketInput(body) {
  const studentId = positiveId(body.student_id);
  const officeId = positiveId(body.office_id);
  if (body.purpose !== undefined && typeof body.purpose !== 'string') {
    return { error: 'Enter a valid service purpose.' };
  }
  const purpose = (body.purpose || '').trim();
  if (!studentId || !officeId) return { error: 'Select a valid student and service office.' };
  if (purpose.length > 255) return { error: 'Purpose must be 255 characters or fewer.' };
  return { data: { studentId, officeId, purpose } };
}

async function validateTicketReferences(input) {
  const [students, offices] = await Promise.all([
    queueModel.getStudents(),
    queueModel.getOffices(),
  ]);
  if (!students.some((student) => student.id === input.studentId)) {
    return 'Select a valid student.';
  }
  if (!offices.some((office) => office.id === input.officeId)) {
    return 'Select an available service office.';
  }
  return null;
}

async function addTicket(req, res) {
  const input = getTicketInput(req.body);
  if (input.error) {
    try {
      res.status(400);
      return await renderTicketForm(req, res, null, input.error, req.body);
    } catch (err) {
      console.error(err);
      return res.status(500).send('Could not reload the ticket form.');
    }
  }
  try {
    const referenceError = await validateTicketReferences(input.data);
    if (referenceError) {
      res.status(400);
      return await renderTicketForm(req, res, null, referenceError, req.body);
    }
    await queueModel.createTicket(input.data);
    redirectWithMessage(res, 'Queue ticket added');
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not add the queue ticket.');
  }
}

async function editTicket(req, res) {
  const id = positiveId(req.params.id);
  const input = getTicketInput(req.body);
  if (!id) return res.status(400).send('Invalid ticket.');
  if (input.error) {
    try {
      const ticket = await queueModel.getTicket(id);
      if (!ticket) return res.status(404).send('Ticket not found.');
      res.status(400);
      return await renderTicketForm(req, res, ticket, input.error, req.body);
    } catch (err) {
      console.error(err);
      return res.status(500).send('Could not reload the ticket form.');
    }
  }
  try {
    const referenceError = await validateTicketReferences(input.data);
    if (referenceError) {
      const ticket = await queueModel.getTicket(id);
      if (!ticket) return res.status(404).send('Ticket not found.');
      res.status(400);
      return await renderTicketForm(req, res, ticket, referenceError, req.body);
    }
    const updated = await queueModel.updateTicket(id, input.data);
    redirectWithMessage(res, updated ? 'Queue ticket updated' : 'Ticket not found or no longer waiting', !updated);
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not update the queue ticket.');
  }
}

async function deleteTicket(req, res) {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).send('Invalid ticket.');
  try {
    const deleted = await queueModel.deleteTicket(id);
    redirectWithMessage(res, deleted ? 'Queue ticket deleted' : 'Only waiting, skipped, or cancelled tickets can be deleted', !deleted);
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not delete the queue ticket.');
  }
}

async function callNext(req, res) {
  const officeId = positiveId(req.body.office_id);
  if (!officeId) return res.status(400).send('Select a valid office.');
  try {
    if (await queueModel.getServingTicket(officeId)) {
      return redirectWithMessage(res, 'Finish the current ticket before calling another', true);
    }
    const called = await queueModel.callNext(officeId);
    redirectWithMessage(res, called ? 'Next ticket called' : 'No waiting tickets', !called);
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not call the next ticket.');
  }
}

async function finishTicket(req, res, status, explicitTicketId = null) {
  const id = explicitTicketId ?? positiveId(req.params.id);
  if (!id) return res.status(400).send('Invalid ticket.');
  try {
    const updated = await queueModel.finishTicket(id, status);
    redirectWithMessage(res, updated ? `Ticket marked as ${status}` : 'Ticket is not currently being served', !updated);
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not update the ticket.');
  }
}

function markServed(req, res) {
  return finishTicket(req, res, 'completed');
}

function skipTicket(req, res) {
  return finishTicket(req, res, 'skipped');
}

function finishLegacy(req, res) {
  const id = positiveId(req.body.ticketId);
  const status = req.body.status;
  if (!positiveId(req.body.officeId) || !id || !['completed', 'skipped'].includes(status)) {
    return res.status(400).send('Invalid request.');
  }
  return finishTicket(req, res, status, id);
}

module.exports = {
  showDashboard,
  showQueue,
  showAddForm,
  addTicket,
  showEditForm,
  editTicket,
  deleteTicket,
  callNext,
  markServed,
  skipTicket,
  finishLegacy,
};
