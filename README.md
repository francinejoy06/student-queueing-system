# Student Queueing System

## 1. Project Description

The Student Queueing System is a web-based application that helps schools manage student queues. Students request queue tickets for school offices, staff manage the queue of their own office, and administrators manage offices and staff assignments. Each role has its own access level.

## 2. Team Members

1. Abanes, Francine Joy
2. Dimacali, Edgardo
3. Tominio, Angel

## 3. Assigned System

**System Name:** Student Queueing System

The system manages student queue tickets and provides different functions based on user roles.

## 4. Features

- User registration and login for students and staff
- Staff select the office they belong to when they register
- Password hashing using `bcryptjs`
- Session management and logout
- Role-based access for students, staff, and administrators
- Student dashboard and queue ticket requests
- Students can cancel their own queue ticket
- Separate ticket numbering for each office, with its own letter prefix (tracked in `office_ticket_counters`)
- Staff dashboard showing the queue of the staff member's assigned office (call next, complete, skip)
- Staff can edit the purpose of a queue ticket
- Administrator office management (add offices)
- Administrator user management: assign or move a staff member to a different office, and delete users
- Input validation with error messages on all forms

## 5. Technologies

- Node.js
- Express.js
- EJS
- MySQL
- HTML and CSS
- bcryptjs
- express-session
- dotenv
- Git and GitHub

## 6. Installation

1. Install Node.js, npm, and MySQL Server (for example through XAMPP).
2. Clone the repository:

   ```bash
   git clone https://github.com/francinejoy06/student-queueing-system.git
   cd student-queueing-system
   ```

3. Install the project dependencies:

   ```bash
   npm install
   ```

## 7. Configuration

1. Create a `.env` file in the project root using `.env.example` as a guide.
2. Configure the environment variables according to your local setup. For example:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=queueing_system
   SESSION_SECRET=your_local_session_secret
   ```

3. `DB_NAME` must match the database name created by `db/schema.sql`.
4. Use a strong, private session secret.
5. Do not upload your actual `.env` file or private credentials to GitHub.

## 8. Database Setup

1. Start MySQL using your local database tool, such as XAMPP.
2. Open phpMyAdmin or another MySQL client.
3. Import or execute the `db/schema.sql` file.

The schema creates the database and the following tables:

- `users` — user accounts, password hashes, roles, and the assigned office of staff members (`office_id`).
- `offices` — office records, with an `is_active` flag.
- `office_ticket_counters` — the last ticket number used by each office. Each office has its own row, so numbering is separate per office.
- `queue_tickets` — student queue tickets and their statuses (`waiting`, `serving`, `completed`, `skipped`, `cancelled`). A cancelled ticket keeps its record with the status `cancelled`.

Default offices: Registrar, Cashier, Guidance Office, Library. Administrators can add more offices from the admin pages.

4. Make sure the database settings in your `.env` file match your MySQL configuration.

## 9. How to Run

1. Open a terminal in the project folder.
2. Make sure MySQL is running and the database is configured.
3. Run the seed script to create the sample accounts:

   ```bash
   node scripts/seed.js
   ```

4. Start the application:

   ```bash
   node app.js
   ```

5. Open the application in your browser:

   http://localhost:3000

## 10. User Accounts

Sample accounts are created by `node scripts/seed.js`:

| Role | Email | Sample Password |
|---|---|---|
| Administrator | admin@school.edu | `Admin123!` |
| Student | student@school.edu | `Student123!` |

**Registration and permissions:**

- **Students** register from the registration page. They can request queue tickets, view their own tickets, and cancel their own tickets.
- **Staff** register from the registration page and choose the office they are assigned to. They manage only the queue of that office and can edit the purpose of a ticket. They cannot edit user accounts.
- **Administrators** are created by the seed script. They can add offices, assign or move a staff member to another office, and delete users. They cannot add users or edit user details such as name and role.

The seed script uses `bcryptjs` to hash passwords before storing them in the database. Existing accounts with the same email may not be updated when the script runs again.

## 11. Project Structure

```text
student-queueing-system/
├── config/
│   └── db.js
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── staffController.js
│   └── studentController.js
├── db/
│   └── schema.sql
├── docs/
│   ├── requirements.md
│   └── test-plan.md
├── middleware/
│   └── auth.js
├── models/
│   ├── adminModel.js
│   ├── queueModel.js
│   └── userModel.js
├── public/
│   └── css/
│       └── app.css
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── staffRoutes.js
│   └── studentRoutes.js
├── scripts/
│   └── seed.js
├── views/
│   ├── admin/
│   ├── auth/
│   ├── partials/
│   ├── staff/
│   └── student/
├── .env.example
├── .gitignore
├── app.js
├── package.json
├── package-lock.json
├── LICENSE
└── README.md
```

## 12. Known Limitations

- Administrators can only add offices. They cannot rename, deactivate, or delete offices.
- Administrators cannot add or edit users. They can only move a staff member to another office or delete a user.
- Anyone can register as staff and choose an office. There is no approval step from an administrator.
- Administrator accounts can only be created by the seed script.
- There is no password reset or change password feature.
- Testing was done manually using the test plan in `docs/test-plan.md`. There are no automated tests.

## 13. AI Assistance Disclosure

AI tools were used in this project. Claude (Anthropic) was used for step-by-step development guidance, code drafts, documentation drafts, and test plan and code review suggestions. The team is responsible for reviewing, testing, and being able to explain all the code and documentation.

## 14. License

This project is licensed under the MIT License. See the `LICENSE` file for details.
