# Requirements Document: Student Queueing System

## 1. Purpose and Scope
The Student Queueing System is a web application that replaces physical lines at campus offices with a digital queue. Students request service at an office and track their tickets. Staff, who belong to one office, process the queue of that office. Administrators manage offices and staff assignments.

The application uses Node.js, Express, EJS, and MySQL. Data is stored in four tables: `users`, `offices`, `office_ticket_counters` (the last ticket number used by each office), and `queue_tickets`.

## 2. Users

| User | Description | Main needs |
|---|---|---|
| Student | A registered student who needs service from a campus office | Register, request a ticket for an office, view their tickets, cancel a ticket that is still waiting |
| Staff | An employee assigned to one office | Register and choose their office, see the queue of that office, call the next student, complete or skip a ticket, edit a ticket's purpose |
| Administrator | A system administrator | Add offices, assign or move staff to an office, delete users |

## 3. Stakeholders

| Stakeholder | Interest in the system |
|---|---|
| Campus offices (Registrar, Cashier, Guidance Office, Library, and other configured offices) | Shorter lines and organized service queues |
| School administration | Reliable records, role separation, and better service quality |
| IT / system maintainers | A secure, documented system that is easy to maintain |
| Students (as a whole) | Less waiting time and a clear service order |

## 4. Functional Requirements

### Accounts and access
- **FR-01 Registration:** A visitor can register as a student or as staff with a name, email, and password. Staff also choose the office they belong to. The `admin` role cannot be selected at registration, and a submitted role value must not grant privileges.
- **FR-02 Input validation:** Forms validate required fields, email format, field lengths, password length, valid roles and offices, and duplicate email addresses, and show a useful error message.
- **FR-03 Sign in and sign out:** Registered users can sign in with email and password and sign out, which destroys their session.
- **FR-04 Role-based access:** Students can access only student pages. Staff can access only the staff pages of their own office. Only administrators can access office and user management. Restricted pages cannot be opened by typing the URL.

### Student queue requests
- **FR-05 Request a ticket:** A signed-in student can select an active office and optionally enter a purpose of up to 255 characters.
- **FR-06 Ticket number and status:** A valid request is saved with a ticket number that is sequential within its office and the status "waiting".
- **FR-07 View tickets:** A student can view their own tickets (number, office, purpose, time, status) and cannot see another student's tickets.
- **FR-08 Cancel a ticket:** A student can cancel their own ticket only while its status is "waiting". The server rejects cancellation of tickets that are serving, completed, skipped, or already cancelled.

### Staff queue operations
- **FR-09 Dashboard:** Staff can view waiting, serving, completed, and total ticket counts and recent queue activity for their office.
- **FR-10 Queue list:** Staff can view the tickets of their own office and filter them by search text and status.
- **FR-11 Call next:** Staff can call the oldest waiting ticket of their office when no ticket is currently being served there.
- **FR-12 Complete or skip:** Staff can mark the serving ticket as completed or skipped. A ticket that is not serving cannot be completed or skipped.
- **FR-13 Edit ticket purpose:** Staff can edit the purpose of a ticket in their own office. They cannot act on tickets of another office.

### Administration
- **FR-14 Office management:** An administrator can add offices and rename, activate, or deactivate them. Duplicate office names are rejected. Offices are deactivated, not deleted, so existing tickets remain valid.
- **FR-15 Staff office assignment:** An administrator can assign a staff member to an office or move them to another office.
- **FR-16 Delete users:** An administrator can delete user accounts. A user who already has tickets cannot be deleted, and an error message explains why. An administrator cannot add users or edit a user's name or role.

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Security | Passwords are stored as bcrypt hashes, SQL queries are parameterized, user text is escaped when rendered, and session cookies use `HttpOnly` and `SameSite`. |
| NFR-02 | Security | Protected pages must not be accessible to unauthorized users, even by typing the URL directly or sending the request manually. |
| NFR-03 | Security | Secrets such as database credentials and the session secret are kept in a `.env` file that is not committed to the repository. |
| NFR-04 | Data integrity | Database foreign keys link tickets to students and offices. A ticket cannot be created for an invalid student or office, and users with tickets cannot be deleted, so the queue history is preserved. |
| NFR-05 | Privacy | Student ticket queries are limited to the signed-in student's user ID, and staff queries are limited to the staff member's assigned office. |
| NFR-06 | Usability | Forms have labels, browser-level constraints, server-side validation, and clear success and error messages. Ticket status is shown in readable text. |
| NFR-07 | Maintainability | The code follows the routes, controllers, models, and views structure. |
| NFR-08 | Persistence | Accounts, offices, and tickets are stored in MySQL and remain after a page refresh or an application restart. |
| NFR-09 | Data integrity | Ticket numbers are generated from a per-office counter so they are unique and increase in order within each office. |

## 6. Use Cases

### UC-01: Register an account
- **Actor:** Student or Staff
- **Precondition:** The visitor does not have an account.
- **Steps:** 1. Open `/signup`. 2. Enter name, email, password, and confirmation. 3. Choose student or staff. Staff also choose their office. 4. Submit the form.
- **Expected result:** The password is hashed, the account is created, and the visitor is sent to sign in. Invalid fields, a missing office for staff, or an existing email show an error and no account is created.

### UC-02: Sign in
- **Actor:** Student, Staff, or Administrator
- **Precondition:** The user has an account.
- **Steps:** 1. Open `/login`. 2. Enter email and password. 3. Submit the form.
- **Expected result:** A session is created and the user is sent to the page for their role. A wrong email or password shows the same error message.

### UC-03: Request a queue ticket
- **Actor:** Student
- **Precondition:** The student is signed in and at least one office is active.
- **Steps:** 1. Open `/student/queue/add`. 2. Select an office. 3. Optionally enter a purpose. 4. Submit the form.
- **Expected result:** A ticket with the status "waiting" and the next number of that office is saved and shown on the dashboard. A missing or invalid office, or a purpose longer than 255 characters, shows an error and nothing is saved.

### UC-04: View ticket status
- **Actor:** Student
- **Precondition:** The student is signed in.
- **Steps:** 1. Open `/student/dashboard`.
- **Expected result:** The student's own tickets are shown with number, office, purpose, time, and current status.

### UC-05: Cancel a ticket
- **Actor:** Student
- **Precondition:** The student is signed in and has a ticket with the status "waiting".
- **Steps:** 1. Open `/student/dashboard`. 2. Click Cancel on the ticket.
- **Expected result:** The ticket status changes to "cancelled" and the record is kept. The Cancel button is not shown for other statuses, and a manual request to cancel them is rejected.

### UC-06: Call the next ticket
- **Actor:** Staff
- **Precondition:** Staff is signed in, at least one ticket is waiting in their office, and no ticket is currently being served there.
- **Steps:** 1. Open `/staff/queue`. 2. Click "Call next student".
- **Expected result:** The oldest waiting ticket changes to "serving". If a ticket is already being served, an error message is shown.

### UC-07: Complete or skip a ticket
- **Actor:** Staff
- **Precondition:** A ticket is currently being served in the staff member's office.
- **Steps:** 1. Open `/staff/queue`. 2. Click "Complete" or "Skip".
- **Expected result:** The ticket status changes to "completed" or "skipped" in the database and the queue refreshes.

### UC-08: Edit a ticket's purpose
- **Actor:** Staff
- **Precondition:** Staff is signed in and the ticket belongs to their office.
- **Steps:** 1. Open `/staff/queue`. 2. Edit the purpose of a ticket. 3. Save.
- **Expected result:** The new purpose is saved and other fields are unchanged. A ticket of another office cannot be edited.

### UC-09: Manage offices
- **Actor:** Administrator
- **Precondition:** The administrator is signed in.
- **Steps:** 1. Open `/admin/offices`. 2. Add an office, rename an office, or deactivate or activate an office.
- **Expected result:** The change is saved. A duplicate office name shows an error. Deactivated offices no longer appear in the student request form.

### UC-10: Assign staff to an office and delete users
- **Actor:** Administrator
- **Precondition:** The administrator is signed in.
- **Steps:** 1. Open `/admin/users`. 2. Move a staff member to another office, or delete a user.
- **Expected result:** The staff member's office is updated and they see the queue of the new office. A user without tickets is deleted. A user who already has tickets is not deleted and an error message is shown.

## 7. Data and Status Rules
- User roles are `student`, `staff`, and `admin`. Only student and staff can register. Admin accounts are created by the seed script.
- Staff belong to one office (`users.office_id`).
- Ticket statuses are `waiting`, `serving`, `completed`, `skipped`, and `cancelled`.
- New requests start as `waiting`.
- "Call next" moves the oldest waiting ticket of the staff member's office to `serving`.
- Only a serving ticket can be completed or skipped.
- A student can cancel a ticket only while it is `waiting`.
- Ticket numbers are sequential within each office, using the `office_ticket_counters` table, and do not restart daily.

## 8. Main Application Routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/` | Redirect to the page for the user's role (or `/login`) |
| GET / POST | `/signup` | Student and staff registration |
| GET / POST | `/login` | Sign in |
| POST | `/logout` | Destroy the current session |
| GET | `/student/dashboard` | Show the signed-in student's tickets |
| GET / POST | `/student/queue/add` | Request a ticket for an active office |
| GET | `/staff/dashboard` | Staff dashboard and queue summary |
| GET | `/staff/queue` | Filterable queue list of the staff member's office |
| POST | `/staff/queue/call-next` | Call the next waiting ticket |
| POST | `/staff/queue/:id/served` | Complete a serving ticket |
| POST | `/staff/queue/:id/skip` | Skip a serving ticket |
| GET / POST | `/staff/queue/:id/edit` | Edit a ticket's purpose |
| GET / POST | `/admin/offices` | List and add offices |
| POST | `/admin/offices/:id/edit` | Rename an office |
| POST | `/admin/offices/:id/toggle` | Activate or deactivate an office |
| GET | `/admin/users` | List users and staff office assignments |
| POST | `/admin/users/:id/delete` | Delete a user who has no tickets |

## 9. Implementation Status

Status reflects the current `main` branch. Test results are recorded in `docs/test-plan.md`.

| ID | Requirement | Status |
|---|---|---|
| FR-01 | Registration (student and staff with office) | Implemented |
| FR-02 | Input validation | Implemented |
| FR-03 | Sign in and sign out | Implemented |
| FR-04 | Role-based access | Implemented |
| FR-05 | Request a ticket | Implemented |
| FR-06 | Ticket number and status | Implemented |
| FR-07 | View tickets | Implemented |
| FR-08 | Cancel a waiting ticket | Implemented |
| FR-09 | Staff dashboard | Implemented |
| FR-10 | Queue list | Implemented |
| FR-11 | Call next | Implemented |
| FR-12 | Complete or skip | Implemented |
| FR-13 | Edit ticket purpose | Implemented |
| FR-14 | Office management | Implemented |
| FR-15 | Staff office assignment | Implemented |
| FR-16 | Delete users | Implemented |

## 10. Planned Features and Known Limitations

| Item | Status |
|---|---|
| Ticket numbers that restart every day | Planned |
| Password reset | Planned |
| Email verification | Planned |
| Archive or deactivate users who have tickets (they cannot be deleted) | Planned |

**Known limitations:**
- Administrators cannot add users or edit a user's name or role. Students and staff register themselves, and admin accounts are created by the seed script.
- Staff accounts are created by self-registration; there is no approval step by an administrator.
- A student can cancel a ticket only while it is waiting.
