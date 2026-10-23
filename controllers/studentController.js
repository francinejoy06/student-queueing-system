
const queueModel = require('../models/queueModel');

function positiveId(value) {
  const text = String(value ?? '');

  if (!/^\d+$/.test(text)) return null;

  const id = Number(text);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function redirectWithMessage(res, message, isError = false) {
  const key = isError ? 'error' : 'message';

  return res.redirect(
    `/student/dashboard?${key}=${encodeURIComponent(message)}`
  );
}

// ---------- STUDENT DASHBOARD ----------

async function showDashboard(req, res) {
  try {
    const tickets = await queueModel.getStudentTickets(
      req.session.user.id
    );

    return res.render('student/dashboard', {
      currentUser: req.session.user,
      tickets,
      query: req.query,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Could not load your queue.');
  }
}

// ---------- ADD TICKET FORM ----------

async function showAddForm(req, res) {
  try {
    const offices = await queueModel.getOffices();

    return res.render('student/request-ticket', {
      currentUser: req.session.user,
      offices,
      error: null,
      purpose: '',
      selectedOfficeId: '',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send(
      'Could not load the queue request form.'
    );
  }
}

// ---------- ADD TICKET ----------

async function addTicket(req, res) {
  const officeValue = String(req.body.office_id || '');
  const officeId = /^\d+$/.test(officeValue)
    ? Number(officeValue)
    : 0;

  const purposeInputValid =
    req.body.purpose === undefined ||
    typeof req.body.purpose === 'string';

  const purpose =
    typeof req.body.purpose === 'string'
      ? req.body.purpose.trim()
      : '';

  try {
    const offices = await queueModel.getOffices();

    let error = null;

    if (
      !Number.isSafeInteger(officeId) ||
      officeId < 1 ||
      !offices.some(
        (office) => Number(office.id) === officeId
      )
    ) {
      error = 'Choose an available service office.';
    } else if (!purposeInputValid) {
      error = 'Enter a valid service purpose.';
    } else if (purpose.length > 255) {
      error = 'Purpose must be 255 characters or fewer.';
    }

    if (error) {
      return res.status(400).render('student/request-ticket', {
        currentUser: req.session.user,
        offices,
        error,
        purpose,
        selectedOfficeId: officeValue,
      });
    }

    await queueModel.createTicket({
      studentId: req.session.user.id,
      officeId,
      purpose,
    });

    return res.redirect('/student/dashboard?created=1');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Could not join the queue.');
  }
}

// ---------- EDIT TICKET PURPOSE ----------

async function editPurpose(req, res) {
  const ticketId = positiveId(req.params.id);
  const studentId = Number(req.session.user.id);
  const purposeInput = req.body.purpose;

  if (!ticketId) {
    return redirectWithMessage(
      res,
      'Invalid ticket.',
      true
    );
  }

  if (typeof purposeInput !== 'string') {
    return redirectWithMessage(
      res,
      'Enter a valid service purpose.',
      true
    );
  }

  const purpose = purposeInput.trim();

  if (purpose.length > 255) {
    return redirectWithMessage(
      res,
      'Purpose must be 255 characters or fewer.',
      true
    );
  }

  try {
    const ticket = await queueModel.getTicket(ticketId);

    if (!ticket || Number(ticket.student_id) !== studentId) {
      return redirectWithMessage(
        res,
        'Ticket not found.',
        true
      );
    }

    if (ticket.status !== 'waiting') {
      return redirectWithMessage(
        res,
        'Only waiting tickets can be edited.',
        true
      );
    }

    // This model method will also enforce ownership and status
    // in the database update.
    const updated = await queueModel.updateStudentTicketPurpose(
      ticketId,
      studentId,
      purpose
    );

    if (!updated) {
      return redirectWithMessage(
        res,
        'Ticket could not be updated. It may no longer be waiting.',
        true
      );
    }

    return redirectWithMessage(
      res,
      'Ticket purpose updated successfully.'
    );
  } catch (err) {
    console.error(err);
    return redirectWithMessage(
      res,
      'Could not update the ticket purpose.',
      true
    );
  }
}

// ---------- CANCEL TICKET ----------

async function cancelTicket(req, res) {
  const ticketId = positiveId(req.params.id);
  const studentId = Number(req.session.user.id);

  if (!ticketId) {
    return redirectWithMessage(
      res,
      'Invalid ticket.',
      true
    );
  }

  try {
    const ticket = await queueModel.getTicket(ticketId);

    if (!ticket || Number(ticket.student_id) !== studentId) {
      return redirectWithMessage(
        res,
        'Ticket not found.',
        true
      );
    }

    if (ticket.status !== 'waiting') {
      return redirectWithMessage(
        res,
        'Only waiting tickets can be cancelled.',
        true
      );
    }

    // This model method will also enforce ownership and status
    // in the database update.
    const cancelled = await queueModel.cancelStudentTicket(
      ticketId,
      studentId
    );

    if (!cancelled) {
      return redirectWithMessage(
        res,
        'Ticket could not be cancelled. It may no longer be waiting.',
        true
      );
    }

    return redirectWithMessage(
      res,
      'Ticket cancelled successfully.'
    );
  } catch (err) {
    console.error(err);
    return redirectWithMessage(
      res,
      'Could not cancel the ticket.',
      true
    );
  }
}

module.exports = {
  showDashboard,
  showAddForm,
  addTicket,
  editPurpose,
  cancelTicket,
};
