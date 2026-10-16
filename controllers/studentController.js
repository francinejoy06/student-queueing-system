const queueModel = require('../models/queueModel');

async function showDashboard(req, res) {
  try {
    const tickets = await queueModel.getStudentTickets(req.session.user.id);
    res.render('student/dashboard', {
      currentUser: req.session.user,
      tickets,
      query: req.query,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not load your queue.');
  }
}

async function showAddForm(req, res) {
  try {
    const offices = await queueModel.getOffices();
    res.render('student/request-ticket', {
      currentUser: req.session.user,
      offices,
      error: null,
      purpose: '',
      selectedOfficeId: '',
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not load the queue request form.');
  }
}

async function addTicket(req, res) {
  const officeValue = String(req.body.office_id || '');
  const officeId = /^\d+$/.test(officeValue) ? Number(officeValue) : 0;
  const purposeInputValid = req.body.purpose === undefined || typeof req.body.purpose === 'string';
  const purpose = typeof req.body.purpose === 'string' ? req.body.purpose.trim() : '';
  try {
    const offices = await queueModel.getOffices();
    let error = null;
    if (!Number.isSafeInteger(officeId) || officeId < 1 || !offices.some((office) => office.id === officeId)) {
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
    res.redirect('/student/dashboard?created=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not join the queue.');
  }
}

module.exports = { showDashboard, showAddForm, addTicket };
