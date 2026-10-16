# Requirements Document: Student Queueing System

## 1. Purpose and Scope
The Student Queueing System is a web application that replaces physical lines at campus offices with a digital queue. Students request service at an office and track their tickets. Staff view and process the queue of an office. Administrators manage user accounts and offices.

The application uses Node.js, Express, EJS, and MySQL. Users, offices, and queue tickets are stored in the `users`, `offices`, and `queue_tickets` tables.

## 2. Users

| User | Description | Main needs |
|---|---|---|
| Student | A registered student who needs service from a campus office | Create an account, request a ticket for an office, view their own tickets and status |
| Staff | An employee who processes tickets for campus offices | See the queue of an office, call the next student, complete or skip a ticket, add and manage tickets |
| Administrator | A system administrator | Manage staff and administrator accounts and manage offices |

## 3. Stakeholders

| Stakeholder | Interest in the system |
|---|---|
| Campus offices (Registrar, Cashier, Guidance Office, Library, and other configured offices) | Shorter lines and organized service queues |
| School administration | Reliable records, role separation, and better service quality |
| IT / system maintainers | A secure, documented system that is easy to maintain |
| Students (as a whole) | Less waiting time and a clear service order |

## 4. Functional Requirements

### Accounts and access
- **FR-01 Student registration:** A visitor can create a student account with a name, email, and password. The server assigns the `student` role; a submitted role value must not grant privileges.
- **FR-02 Input validation:** Forms validate required fields, email format, field lengths, password confirmation, valid roles, and duplicate email addresses, and show a useful error message.
- **FR-03 Sign in and sign out:** Registered users can sign in with email and password and sign out, which destroys their session.
- **FR-04 Role-based access:** Students can access only student pages, staff and administrators can access the staff queue pages, and only administrators can access user and office management. Restricted pages cannot be opened by typing the URL.

### Student queue requests
- **FR-05 Request a ticket:** A signed-in student can select an active office and optionally enter a purpose of up to 255 characters.
- **FR-06 Ticket number and status:** A valid request is saved with a unique ticket number and the status "waiting".
- **FR-07 View tickets:** A student can view their own tickets (number, office, purpose, time, status) and cannot see another student's tickets.

### Staff queue operations
- **FR-08 Dashboard:** Staff can view daily waiting, serving, completed, and total ticket counts and recent queue activity.
- **FR-09 Queue list:** Staff can view the tickets of an office and filter them by search text and status.
- **FR-10 Call next:** Staff can call the oldest waiting ticket of a selected office when no ticket is currently being served there.
- **FR-11 Complete or skip:** Staff can mark the serving ticket as completed or skipped. A ticket that is not serving cannot be completed or skipped.
- **FR-12 Add, edit, and delete tickets:** Staff can create or edit waiting tickets and delete tickets only in the waiting, skipped, or cancelled states.

### Administration
- **FR-13 Account administration:** An administrator can create staff or administrator accounts, edit a user's name and role, and delete another account. An administrator cannot delete their own account or change their own role.
- **FR-14 Office management:** An administrator can add, rename, activate, and deactivate offices. Duplicate office names are rejected. Offices are deactivated, not deleted, so existing tickets remain valid.

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Security | Passwords are stored as bcrypt hashes, SQL queries are parameterized, user text is escaped when rendered, and session cookies use `HttpOnly` and `SameSite`. |
| NFR-02 | Security | Protected pages must not be accessible to unauthorized users, even by typing the URL directly. |
| NFR-03 | Security | Secrets such as database credentials and the session secret are kept in a `.env` file that is not committed to the repository. |
| NFR-04 | Data integrity | Database foreign keys link tickets to students and offices. A ticket cannot be created for an invalid student or office. |
| NFR-05 | Privacy | Student ticket queries are limited to the signed-in student's user ID. |
| NFR-06 | Usability | Forms have labels, browser-level constraints, server-side validation, and clear success and error messages. Ticket status is shown in readable text. |
| NFR-07 | Maintainability | The code follows the routes, controllers, models, and views structure. |
| NFR-08 | Persistence | Accounts, offices, and tickets are stored in MySQL and remain after a page refresh or an application restart. |

## 6. Use Cases

### UC-01: Register an account
- **Actor:** Student
- **Precondition:** The visitor does not have an account.
- **Steps:** 1. Open `/signup`. 2. Enter name, email, password, and confirmation. 3. Submit the form.
- **Expected result:** The password is hashed, the account is created with the `student` role, and the visitor is sent to sign in. Invalid fields or an existing email show an error and keep the submitted name and email.

### UC-02: Sign in
- **Actor:** Student, Staff, or Administrator
- **Precondition:** The user has an account.
- **Steps:** 1. Open `/login`. 2. Enter email and password. 3. Submit the form.
- **Expected result:** A session is created and the user is sent to the page for their role. A wrong email or password shows the same error message.

### UC-03: Request a queue ticket
- **Actor:** Student
- **Precondition:** The student is signed in and at least one office is active.
- **Steps:** 1. Open `/student/queue/add`. 2. Select an office. 3. Optionally enter a purpose. 4. Submit the form.
- **Expected result:** A ticket with the status "waiting" is saved and shown on `/student/dashboard`. A missing or invalid office, or a purpose longer than 255 characters, shows an error and nothing is saved.

### UC-04: View ticket status
- **Actor:** Student
- **Precondition:** The student is signed in.
- **Steps:** 1. Open `/student/dashboard`.
- **Expected result:** The student's own tickets are shown with number, office, purpose, time, and current status.

### UC-05: Call the next ticket
- **Actor:** Staff
- **Precondition:** Staff is signed in, at least one ticket is waiting, and no ticket is currently being served in that office.
- **Steps:** 1. Open `/staff/queue`. 2. Select an office. 3. Click "Call next student".
- **Expected result:** The oldest waiting ticket changes to "serving". If a ticket is already being served, an error message is shown.

### UC-06: Complete or skip a ticket
- **Actor:** Staff
- **Precondition:** A ticket is currently being served.
- **Steps:** 1. Open `/staff/queue`. 2. Click "Complete" or "Skip".
- **Expected result:** The ticket status changes to "completed" or "skipped" in the database and the queue refreshes.

### UC-07: Manage users
- **Actor:** Administrator
- **Precondition:** The administrator is signed in.
- **Steps:** 1. Open `/admin/users`. 2. Create a staff or administrator account, edit a user's name and role, or delete a user.
- **Expected result:** The change is saved. Invalid input and duplicate emails show an error. An administrator cannot delete their own account or change their own role, and a user who already has tickets cannot be deleted.

### UC-08: Manage offices
- **Actor:** Administrator
- **Precondition:** The administrator is signed in.
- **Steps:** 1. Open `/admin/offices`. 2. Add an office, rename an office, or deactivate or activate an office.
- **Expected result:** The change is saved. A duplicate office name shows an error. Deactivated offices no longer appear in the student request form.

## 7. Data and Status Rules
- User roles are `student`, `staff`, and `admin`.
- Ticket statuses are `waiting`, `serving`, `completed`, `skipped`, and `cancelled`.
- New requests start as `waiting`.
- "Call next" moves the oldest waiting ticket to `serving`.
- Only a serving ticket can be completed or skipped.
- Ticket numbers use the `Q-` prefix and the ticket ID, so they are unique across the system.

## 8. Main Application Routes

| Method | Route | Purpose |
|---|---|---|
| GET / POST | `/signup` | Student registration |
| GET / POST | `/login` | Sign in |
| POST | `/logout` | Destroy the current session |
| GET | `/student/dashboard` | Show the signed-in student's tickets |
| GET / POST | `/student/queue/add` | Request a ticket for an active office |
| GET | `/staff/dashboard` | Staff dashboard and queue summary |
| GET | `/staff/queue` | Filterable office queue list |
| POST | `/staff/queue/call-next` | Call the next waiting ticket |
| POST | `/staff/queue/:id/served` | Complete a serving ticket |
| POST | `/staff/queue/:id/skip` | Skip a serving ticket |
| GET / POST | `/staff/queue/add` | Add a ticket from the staff interface |
| GET / POST | `/staff/queue/:id/edit` | Edit a waiting ticket |
| POST | `/staff/queue/:id/delete` | Delete an eligible ticket |
| GET / POST | `/admin/users` | List and create staff or administrator accounts |
| POST | `/admin/users/:id/edit` | Edit a user's name and role |
| POST | `/admin/users/:id/delete` | Delete another user account |
| GET / POST | `/admin/offices` | List and add offices |
| POST | `/admin/offices/:id/edit` | Rename an office |
| POST | `/admin/offices/:id/toggle` | Activate or deactivate an office |

## 9. Known Limitations
- Staff accounts are not assigned to a particular office; staff can select any active office.
- Students cannot cancel their own tickets in the student interface.
- Ticket numbers are global and do not restart per office or per day.
- There is no password reset and no email verification.


## 10. Implementation Status
All requirements FR-01 to FR-14 and use cases UC-01 to UC-08 are implemented in the main branch and were tested manually (see `docs/test-plan.md`). Features that are not implemented are listed in Section 9 (Known Limitations).