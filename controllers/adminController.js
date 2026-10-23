const adminModel = require('../models/adminModel');
const userModel = require('../models/userModel');

// ---------- OFFICES ----------

function officeNameError(name) {
  if (!name) return 'Office name is required.';

  if (name.length > 100) {
    return 'Office name must be 100 characters or fewer.';
  }

  return null;
}

function positiveId(value) {
  const text = String(value ?? '');

  if (!/^\d+$/.test(text)) return null;

  const id = Number(text);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function showOffices(req, res) {
  try {
    const offices = await adminModel.getOffices();

    return res.render('admin/offices', {
      offices,
      currentUser: req.session.user,
      message: req.query.message || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Could not load offices.');
  }
}

async function addOffice(req, res) {
  const name = String(req.body.name || '').trim();
  const problem = officeNameError(name);

  if (problem) {
    return res.redirect(
      `/admin/offices?error=${encodeURIComponent(problem)}`
    );
  }

  try {
    if (await adminModel.officeNameExists(name)) {
      return res.redirect(
        '/admin/offices?error=Office+name+already+exists'
      );
    }

    await adminModel.createOffice(name);

    return res.redirect('/admin/offices?message=Office+added');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.redirect(
        '/admin/offices?error=Office+name+already+exists'
      );
    }

    console.error(err);
    return res.status(500).send('Could not add office.');
  }
}

async function editOffice(req, res) {
  const id = positiveId(req.params.id);

  if (!id) {
    return res.status(400).send('Invalid office.');
  }

  const name = String(req.body.name || '').trim();
  const problem = officeNameError(name);

  if (problem) {
    return res.redirect(
      `/admin/offices?error=${encodeURIComponent(problem)}`
    );
  }

  try {
    if (await adminModel.officeNameExists(name, id)) {
      return res.redirect(
        '/admin/offices?error=Office+name+already+exists'
      );
    }

    await adminModel.renameOffice(id, name);

    return res.redirect('/admin/offices?message=Office+updated');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.redirect(
        '/admin/offices?error=Office+name+already+exists'
      );
    }

    console.error(err);
    return res.status(500).send('Could not update office.');
  }
}

async function toggleOffice(req, res) {
  const id = positiveId(req.params.id);

  if (!id) {
    return res.status(400).send('Invalid office.');
  }

  const active = req.body.active === '1';

  try {
    await adminModel.setOfficeActive(id, active);

    const message = active
      ? 'Office+activated'
      : 'Office+deactivated';

    return res.redirect(`/admin/offices?message=${message}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Could not update office.');
  }
}

// ---------- USERS ----------

async function showUsers(req, res) {
  try {
    const [users, offices] = await Promise.all([
      userModel.getAll(),
      adminModel.getOffices(),
    ]);

    return res.render('admin/users', {
      users,
      offices,
      currentUser: req.session.user,
      message: req.query.message || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Could not load users.');
  }
}

// Account creation is handled by the registration process.
// Keep this handler so any existing route does not break.
async function addUser(req, res) {
  return res.redirect(
    '/admin/users?error=' +
    encodeURIComponent(
      'Account creation must use the appropriate registration process.'
    )
  );
}

// Only the office assignment of an existing staff account can be changed.
// Names and roles are taken from the database, never from the submitted form.
async function editUser(req, res) {
  const id = positiveId(req.params.id);

  if (!id) {
    return res.status(400).send('Invalid user.');
  }

  try {
    const users = await userModel.getAll();
    const user = users.find(
      (item) => Number(item.id) === id
    );

    if (!user) {
      return res.redirect(
        '/admin/users?error=User+not+found'
      );
    }

    if (user.role !== 'staff') {
      return res.redirect(
        '/admin/users?error=' +
        encodeURIComponent(
          'Only staff office assignments can be changed here.'
        )
      );
    }

    const officeValue = String(req.body.office_id ?? '').trim();
    let officeId = null;

    // An empty office selection means the staff member is unassigned.
    if (officeValue !== '') {
      officeId = positiveId(officeValue);

      if (!officeId) {
        return res.redirect(
          '/admin/users?error=Select+a+valid+office'
        );
      }

      const offices = await adminModel.getOffices();
      const office = offices.find(
        (item) => Number(item.id) === officeId
      );

      if (!office) {
        return res.redirect(
          '/admin/users?error=Selected+office+not+found'
        );
      }

      if (
        office.is_active !== undefined &&
        Number(office.is_active) !== 1
      ) {
        return res.redirect(
          '/admin/users?error=Choose+an+active+office'
        );
      }
    }

    // Preserve the existing name and role.
    // Pass officeId explicitly because the model's default may clear it.
    await adminModel.updateUser(
      id,
      user.full_name,
      user.role,
      officeId
    );

    return res.redirect(
      '/admin/users?message=Staff+office+assignment+updated'
    );
  } catch (err) {
    console.error(err);

    return res.redirect(
      '/admin/users?error=' +
      encodeURIComponent('Could not update the staff office assignment.')
    );
  }
}

async function deleteUser(req, res) {
  const id = positiveId(req.params.id);

  if (!id) {
    return res.status(400).send('Invalid user.');
  }

  if (id === Number(req.session.user.id)) {
    return res.redirect(
      '/admin/users?error=You+cannot+delete+your+own+account'
    );
  }

  try {
    const deleted = await userModel.remove(id);

    return res.redirect(
      `/admin/users?message=${deleted ? 'User+deleted' : 'User+not+found'}`
    );
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.redirect(
        '/admin/users?error=' +
        encodeURIComponent(
          'This user has queue tickets and cannot be deleted.'
        )
      );
    }

    console.error(err);

    return res.redirect(
      '/admin/users?error=' +
      encodeURIComponent('Could not delete the user.')
    );
  }
}

module.exports = {
  showOffices,
  addOffice,
  editOffice,
  toggleOffice,
  showUsers,
  addUser,
  editUser,
  deleteUser,
};