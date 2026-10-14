const queueModel = require('../models/queueModel');

// Ipakita ang queue panel ng napiling office
async function showQueue(req, res) {
  try {
    const offices = await queueModel.getOffices();
    if (offices.length === 0) {
      return res.status(404).send('No offices found.');
    }

    // Pansamantala: office ay galing sa ?office=1. Kapag may login na, kukunin sa user.
    const requested = parseInt(req.query.office, 10);
    const office = offices.find((o) => o.id === requested) || offices[0];

    const waiting = await queueModel.getWaitingTickets(office.id);
    const serving = await queueModel.getServingTicket(office.id);

    res.render('staff/queue', {
      offices,
      office,
      waiting,
      serving,
      message: req.query.message || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong while loading the queue.');
  }
}

// Tawagin ang susunod na ticket
async function callNext(req, res) {
  const officeId = parseInt(req.body.officeId, 10);
  if (Number.isNaN(officeId)) {
    return res.status(400).send('Invalid office.');
  }

  try {
    const serving = await queueModel.getServingTicket(officeId);
    if (serving) {
      return res.redirect(
        `/staff/queue?office=${officeId}&message=Finish the current ticket first`
      );
    }

    const calledId = await queueModel.callNext(officeId);
    const message = calledId ? 'Next ticket called' : 'No waiting tickets';
    res.redirect(`/staff/queue?office=${officeId}&message=${message}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not call the next ticket.');
  }
}

// Gawing completed o skipped ang kasalukuyang ticket
async function finishTicket(req, res) {
  const officeId = parseInt(req.body.officeId, 10);
  const ticketId = parseInt(req.body.ticketId, 10);
  const status = req.body.status;

  if (Number.isNaN(officeId) || Number.isNaN(ticketId)) {
    return res.status(400).send('Invalid request.');
  }

  try {
    const ok = await queueModel.finishTicket(ticketId, status);
    const message = ok ? `Ticket marked as ${status}` : 'Could not update ticket';
    res.redirect(`/staff/queue?office=${officeId}&message=${message}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not update the ticket.');
  }
}

module.exports = { showQueue, callNext, finishTicket };