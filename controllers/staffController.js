
const queueModel = require('../models/queueModel');

const validStatuses = new Set([
  'waiting',
  'serving',
  'completed',
  'skipped',
  'cancelled',
]);

function positiveId(value) {
  const text = String(value || '');
  if (!/^\d+$/.test(text)) return null;

  const id = Number(text);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function redirectWithMessage(res, message, isError = false) {
  const key = isError ? 'error' : 'message';

  return res.redirect(
    `/staff/queue?${key}=${encodeURIComponent(message)}`
  );
}

function isAdminUser(user) {
  return user.role === 'admin';
}

function hasAssignedOffice(user) {
  return positiveId(user.office_id) !== null;
}

function belongsToAssignedOffice(ticket, user) {
  return Number(ticket.office_id) === Number(user.office_id);
}

function denyUnassignedStaff(res) {
  return res.status(403).send(
    'Your account has no assigned office. Please contact an administrator.'
  );
}

function denyOtherOffice(res, action = 'access') {
  return res.status(403).send(
    `You cannot ${action} tickets belonging to another office.`
  );
}

// ---------- DASHBOARD ----------

async function showDashboard(req, res) {
  const currentUser = req.session.user;
  const isAdmin = isAdminUser(currentUser);

  if (!isAdmin && !hasAssignedOffice(currentUser)) {
    return denyUnassignedStaff(res);
  }

  try {
    const { stats, recent } = isAdmin
      ? await queueModel.getDashboardStats()
      : await queueModel.getDashboardStats(
          Number(currentUser.office_id)
        );

    return res.render('staff/dashboard', {
      currentUser,
      stats: stats || {
        waiting: 0,
        serving: 0,
        completed: 0,
        total: 0,
      },
      recent: recent || [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send(
      'Could not load the dashboard.'
    );
  }
}

// ---------- QUEUE ----------

async function showQueue(req, res) {
  const currentUser = req.session.user;
  const isAdmin = isAdminUser(currentUser);

  if (!isAdmin && !hasAssignedOffice(currentUser)) {
    return denyUnassignedStaff(res);
  }

  try {
    const allOffices = await queueModel.getOffices();

    const offices = isAdmin
      ? allOffices
      : allOffices.filter(
          (office) =>
            Number(office.id) === Number(currentUser.office_id)
        );

    if (!offices.length) {
      return res.status(403).send(
        'Your assigned office is unavailable. Please contact an administrator.'
      );
    }

    const requestedOffice = positiveId(req.query.office);

    const office = isAdmin
      ? offices.find(
          (item) => Number(item.id) === requestedOffice
        ) || offices[0]
      : offices[0];

    const status = String(req.query.status || '').trim();

    if (status && !validStatuses.has(status)) {
      return res.status(400).send('Invalid queue status.');
    }

    const query = String(req.query.q || '').trim().slice(0, 100);

    const [tickets, waiting, serving] = await Promise.all([
      queueModel.getQueueTickets({
        officeId: office.id,
        query,
        status,
      }),
      queueModel.getWaitingTickets(office.id),
      queueModel.getServingTicket(office.id),
    ]);

    return res.render('staff/queue', {
      currentUser,
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
    return res.status(500).send(
      'Something went wrong while loading the queue.'
    );
  }
}

// ---------- TICKET FORMS ----------

async function renderTicketForm(
  req,
  res,
  ticket = null,
  error = null,
  values = {}
) {
  const currentUser = req.session.user;
  const isAdmin = isAdminUser(currentUser);

  if (!isAdmin && !hasAssignedOffice(currentUser)) {
    return denyUnassignedStaff(res);
  }

  const [allOffices, students] = await Promise.all([
    queueModel.getOffices(),
    queueModel.getStudents(),
  ]);

  const offices = isAdmin
    ? allOffices
    : allOffices.filter(
        (office) =>
          Number(office.id) === Number(currentUser.office_id)
      );

  if (!offices.length) {
    return res.status(403).send(
      'Your assigned office is unavailable. Please contact an administrator.'
    );
  }

  if (!students.length) {
    return res.status(400).send(
      'Create a student account before adding a queue ticket.'
    );
  }

  const formValues = isAdmin
    ? values
    : {
        ...values,
        office_id: currentUser.office_id,
      };

  return res.render('staff/ticket-form', {
    currentUser,
    offices,
    students,
    ticket,
    error,
    values: formValues,
  });
}

async function showAddForm(req, res) {
  try {
    return await renderTicketForm(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).send(
      'Could not load the add-ticket form.'
    );
  }
}

async function showEditForm(req, res) {
  const currentUser = req.session.user;
  const isAdmin = isAdminUser(currentUser);
  const id = positiveId(req.params.id);

  if (!id) {
    return res.status(400).send('Invalid ticket.');
  }

  if (!isAdmin && !hasAssignedOffice(currentUser)) {
    return denyUnassignedStaff(res);
  }

  try {
    const ticket = await queueModel.getTicket(id);

    if (!ticket) {
      return res.status(404).send('Ticket not found.');
    }

    if (
      !isAdmin &&
      !belongsToAssignedOffice(ticket, currentUser)
    ) {
      return denyOtherOffice(res, 'edit');
    }

    if (ticket.status !== 'waiting') {
      return res.status(400).send(
        'Only waiting tickets can be edited.'
      );
    }

    return await renderTicketForm(req, res, ticket);
  } catch (err) {
    console.error(err);
    return res.status(500).send(
      'Could not load the edit-ticket form.'
    );
  }
}

// ---------- VALIDATION ----------

function getTicketInput(body) {
  const studentId = positiveId(body.student_id);
  const officeId = positiveId(body.office_id);

  if (
    body.purpose !== undefined &&
    typeof body.purpose !== 'string'
  ) {
    return {
      error: 'Enter a valid service purpose.',
    };
  }

  const purpose = (body.purpose || '').trim();

  if (!studentId || !officeId) {
    return {
      error: 'Select a valid student and service office.',
    };
  }

  if (purpose.length > 255) {
    return {
      error: 'Purpose must be 255 characters or fewer.',
    };
  }

  return {
    data: {
      studentId,
      officeId,
      purpose,
    },
  };
}

async function validateTicketReferences(input) {
  const [students, offices] = await Promise.all([
    queueModel.getStudents(),
    queueModel.getOffices(),
  ]);

  if (
    !students.some(
      (student) => Number(student.id) === input.studentId
    )
  ) {
    return 'Select a valid student.';
  }

  if (
    !offices.some(
      (office) => Number(office.id) === input.officeId
    )
  ) {
    return 'Select an available service office.';
  }

  return null;
}

// ---------- ADD TICKET ----------

async function addTicket(req, res) {
  const currentUser = req.session.user;
  const isAdmin = isAdminUser(currentUser);

  if (!isAdmin && !hasAssignedOffice(currentUser)) {
    return denyUnassignedStaff(res);
  }

  const input = getTicketInput(req.body);

  if (input.error) {
    try {
      res.status(400);

      return await renderTicketForm(
        req,
        res,
        null,
        input.error,
        req.body
      );
    } catch (err) {
      console.error(err);
      return res.status(500).send(
        'Could not reload the ticket form.'
      );
    }
  }

  // Staff can create tickets only for their assigned office.
  if (!isAdmin) {
    input.data.officeId = Number(currentUser.office_id);
  }

  try {
    const referenceError = await validateTicketReferences(
      input.data
    );

    if (referenceError) {
      res.status(400);

      return await renderTicketForm(
        req,
        res,
        null,
        referenceError,
        req.body
      );
    }

    await queueModel.createTicket(input.data);

    return redirectWithMessage(res, 'Queue ticket added');
  } catch (err) {
    console.error(err);
    return res.status(500).send(
      'Could not add the queue ticket.'
    );
  }
}

// ---------- EDIT TICKET ----------

async function editTicket(req, res) {
  const currentUser = req.session.user;
  const isAdmin = isAdminUser(currentUser);
  const id = positiveId(req.params.id);

  if (!id) {
    return res.status(400).send('Invalid ticket.');
  }

  if (!isAdmin && !hasAssignedOffice(currentUser)) {
    return denyUnassignedStaff(res);
  }

  try {
    const ticket = await queueModel.getTicket(id);

    if (!ticket) {
      return res.status(404).send('Ticket not found.');
    }

    if (
      !isAdmin &&
      !belongsToAssignedOffice(ticket, currentUser)
    ) {
      return denyOtherOffice(res, 'edit');
    }

    if (ticket.status !== 'waiting') {
      return res.status(400).send(
        'Only waiting tickets can be edited.'
      );
    }

    const input = getTicketInput(req.body);

    if (input.error) {
      res.status(400);

      return await renderTicketForm(
        req,
        res,
        ticket,
        input.error,
        req.body
      );
    }

    // Staff cannot change the student or office of an existing ticket.
    if (!isAdmin) {
      input.data.studentId = Number(ticket.student_id);
      input.data.officeId = Number(currentUser.office_id);
    }

    const referenceError = await validateTicketReferences(
      input.data
    );

    if (referenceError) {
      res.status(400);

      return await renderTicketForm(
        req,
        res,
        ticket,
        referenceError,
        req.body
      );
    }

    const updated = await queueModel.updateTicket(
      id,
      input.data,
      isAdmin ? null : Number(currentUser.office_id)
    );

    return redirectWithMessage(
      res,
      updated
        ? 'Queue ticket updated'
        : 'Ticket not found, outside your office, or no longer waiting',
      !updated
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send(
      'Could not update the queue ticket.'
    );
  }
}

// ---------- DELETE TICKET ----------

async function deleteTicket(req, res) {
  const currentUser = req.session.user;
  const isAdmin = isAdminUser(currentUser);
  const id = positiveId(req.params.id);

  if (!id) {
    return res.status(400).send('Invalid ticket.');
  }

  if (!isAdmin && !hasAssignedOffice(currentUser)) {
    return denyUnassignedStaff(res);
  }

  try {
    const ticket = await queueModel.getTicket(id);

    if (!ticket) {
      return res.status(404).send('Ticket not found.');
    }

    if (
      !isAdmin &&
      !belongsToAssignedOffice(ticket, currentUser)
    ) {
      return denyOtherOffice(res, 'delete');
    }

    const deleted = await queueModel.deleteTicket(
      id,
      isAdmin ? null : Number(currentUser.office_id)
    );

    return redirectWithMessage(
      res,
      deleted
        ? 'Queue ticket deleted'
        : 'Only waiting, skipped, or cancelled tickets from your office can be deleted',
      !deleted
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send(
      'Could not delete the queue ticket.'
    );
  }
}

// ---------- CALL NEXT TICKET ----------

async function callNext(req, res) {
  const currentUser = req.session.user;
  const isAdmin = isAdminUser(currentUser);
  const requestedOfficeId = positiveId(req.body.office_id);

  if (!isAdmin && !hasAssignedOffice(currentUser)) {
    return denyUnassignedStaff(res);
  }

  if (!requestedOfficeId) {
    return res.status(400).send('Select a valid office.');
  }

  // Staff cannot choose another office through the submitted form.
  const officeId = isAdmin
    ? requestedOfficeId
    : Number(currentUser.office_id);

  try {
    const offices = await queueModel.getOffices();

    if (
      !offices.some(
        (office) => Number(office.id) === officeId
      )
    ) {
      return res.status(400).send(
        'The selected office is unavailable.'
      );
    }

    if (await queueModel.getServingTicket(officeId)) {
      return redirectWithMessage(
        res,
        'Finish the current ticket before calling another',
        true
      );
    }

    const called = await queueModel.callNext(officeId);

    return redirectWithMessage(
      res,
      called ? 'Next ticket called' : 'No waiting tickets',
      !called
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send(
      'Could not call the next ticket.'
    );
  }
}

// ---------- COMPLETE OR SKIP TICKET ----------

async function finishTicket(
  req,
  res,
  status,
  explicitTicketId = null
) {
  const currentUser = req.session.user;
  const isAdmin = isAdminUser(currentUser);
  const id = explicitTicketId ?? positiveId(req.params.id);

  if (!id) {
    return res.status(400).send('Invalid ticket.');
  }

  if (!['completed', 'skipped'].includes(status)) {
    return res.status(400).send('Invalid ticket status.');
  }

  if (!isAdmin && !hasAssignedOffice(currentUser)) {
    return denyUnassignedStaff(res);
  }

  try {
    const ticket = await queueModel.getTicket(id);

    if (!ticket) {
      return res.status(404).send('Ticket not found.');
    }

    if (
      !isAdmin &&
      !belongsToAssignedOffice(ticket, currentUser)
    ) {
      return denyOtherOffice(res, 'update');
    }

    const updated = await queueModel.finishTicket(
      id,
      status,
      isAdmin ? null : Number(currentUser.office_id)
    );

    return redirectWithMessage(
      res,
      updated
        ? `Ticket marked as ${status}`
        : 'Ticket is not currently being served or is outside your office',
      !updated
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send(
      'Could not update the ticket.'
    );
  }
}

function markServed(req, res) {
  return finishTicket(req, res, 'completed');
}

function skipTicket(req, res) {
  return finishTicket(req, res, 'skipped');
}

// ---------- LEGACY FINISH ROUTE ----------

async function finishLegacy(req, res) {
  const currentUser = req.session.user;
  const isAdmin = isAdminUser(currentUser);
  const submittedOfficeId = positiveId(req.body.officeId);
  const ticketId = positiveId(req.body.ticketId);
  const status = req.body.status;

  if (
    !submittedOfficeId ||
    !ticketId ||
    !['completed', 'skipped'].includes(status)
  ) {
    return res.status(400).send('Invalid request.');
  }

  if (!isAdmin && !hasAssignedOffice(currentUser)) {
    return denyUnassignedStaff(res);
  }

  try {
    const ticket = await queueModel.getTicket(ticketId);

    if (!ticket) {
      return res.status(404).send('Ticket not found.');
    }

    if (
      !isAdmin &&
      !belongsToAssignedOffice(ticket, currentUser)
    ) {
      return denyOtherOffice(res, 'update');
    }

    if (Number(ticket.office_id) !== submittedOfficeId) {
      return res.status(400).send(
        'The ticket and office do not match.'
      );
    }

    return await finishTicket(
      req,
      res,
      status,
      ticketId
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send(
      'Could not update the ticket.'
    );
  }
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
