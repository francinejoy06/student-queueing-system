# Student Queueing System Requirements

## 1. Purpose and scope

The Student Queueing System provides a web application for students to request service at a campus office and track their queue tickets. Staff use the system to view and process office queues. Administrators manage staff and administrator accounts.

The current application uses Node.js, Express, EJS, and MySQL. Queue records are stored in the `queue_tickets` table, and service locations are stored as active offices in the `offices` table.

## 2. Users and stakeholders

| User or stakeholder | Description | Main interests |
|---|---|---|
| Student | Creates an account, requests service, and views their own tickets | Know which office they joined and their ticket status |
| Staff | Processes tickets for campus service offices | See waiting tickets, call the next student, and complete or skip service |
| Administrator | Manages staff and administrator accounts | Maintain authorized system access |
| Campus service offices | Registrar, Cashier, Guidance Office, Library, and other configured offices | Keep service queues organized |
| Campus administrators | Own the queueing workflow and system policy | Reliable records, role separation, and understandable operations |

## 3. Functional requirements

### Accounts and access

- **FR-01 — Student registration:** A visitor can create a student account using a name, email, and password. The server assigns the `student` role; a submitted role value must not grant privileges.
- **FR-02 — Input validation:** Forms validate required fields, email format, field lengths, password confirmation, valid roles, and duplicate email addresses. Invalid submissions receive a useful error.
- **FR-03 — Sign in and sign out:** Registered users can sign in with email and password and sign out to destroy their session.
- **FR-04 — Role-based access:** Students can access only student pages, staff and administrators can access staff queue pages, and only administrators can access user management.
- **FR-05 — Account administration:** An administrator can create staff or administrator accounts and delete another account. An administrator cannot delete their own currently signed-in account.

### Student queue requests

- **FR-06 — Request a ticket:** A signed-in student can select an active office and optionally enter a service purpose of up to 255 characters.
- **FR-07 — Ticket number:** A valid request is stored and assigned a unique queue ticket number.
- **FR-08 — View tickets:** A student can view their own tickets, including ticket number, office, purpose, creation time, and status. A student must not see another student's tickets.

### Staff queue operations

- **FR-09 — Dashboard:** Staff can view daily waiting, serving, completed, and total ticket counts plus recent queue activity.
- **FR-10 — Queue list:** Staff can view tickets for an office and filter the list by search text and status.
- **FR-11 — Call next:** Staff can call the oldest waiting ticket for a selected office when no ticket is currently being served there.
- **FR-12 — Serve or skip:** Staff can mark the current serving ticket completed or skipped. A ticket that is not serving cannot be completed or skipped through these actions.
- **FR-13 — Add, edit, and delete tickets:** Staff can create or edit waiting queue tickets and delete tickets only in the permitted waiting, skipped, or cancelled states.

## 4. Non-functional requirements

- **NFR-01 — Security:** Store passwords as bcrypt hashes, use parameterized SQL queries, escape rendered user-provided text, and protect session cookies with `HttpOnly` and `SameSite`.
- **NFR-02 — Data integrity:** Enforce database foreign keys between tickets, students, and offices. Do not create a ticket for an invalid student or office.
- **NFR-03 — Privacy:** Student ticket queries are restricted to the signed-in student's user ID.
- **NFR-04 — Usability:** Forms provide labels, browser-level constraints, server-side validation, and actionable feedback. Queue status is presented in readable text.
- **NFR-05 — Maintainability:** Keep route handling, controller logic, database access, templates, and schema in their existing project layers.
- **NFR-06 — Persistence:** Accounts, offices, and tickets persist in MySQL across application restarts.

## 5. Use cases

### UC-01: Student creates an account

1. The visitor opens `/signup`.
2. The visitor enters a name, valid email, password, and confirmation.
3. The system validates the fields and checks that the email is not already registered.
4. The system hashes the password and creates the account with the `student` role.
5. The system sends the visitor to sign in.

**Alternate flows:** Invalid fields or an existing email produce an error and preserve the submitted name and email for correction.

### UC-02: Student joins an office queue

1. The student signs in and opens `/student/queue/add`.
2. The student selects an active office and may enter a purpose.
3. The system validates the office and purpose, creates the ticket, and assigns a queue number.
4. The student is returned to `/student/dashboard`, where the ticket appears.

**Alternate flows:** A missing or invalid office, or a purpose longer than 255 characters, is rejected with an error. The ticket is not saved.

### UC-03: Student checks ticket status

1. The student opens `/student/dashboard`.
2. The system retrieves tickets matching the signed-in student's ID.
3. The system displays the ticket number, office, purpose, timestamp, and current status.

### UC-04: Staff calls and serves the next student

1. Staff signs in and opens `/staff/queue`.
2. Staff selects an office and reviews its waiting tickets.
3. If no ticket is currently serving, staff calls the next ticket.
4. After service, staff marks the ticket served or skips it.
5. The system updates the ticket status and refreshes the queue.

### UC-05: Administrator manages system accounts

1. An administrator opens `/admin/users`.
2. The administrator creates a staff or administrator account, or deletes another account.
3. The system validates fields and duplicate emails and reports the outcome.
4. The system prevents the administrator from deleting their own account.

## 6. Data and status rules

- User roles are `student`, `staff`, and `admin`.
- Ticket statuses are `waiting`, `serving`, `completed`, `skipped`, and `cancelled`.
- New queue requests start as `waiting`.
- The staff call-next action moves the oldest waiting ticket to `serving`.
- Only a serving ticket can be completed or skipped.
- Student ticket numbers are generated from the inserted ticket ID using the `Q-` prefix, providing a system-wide unique number.

## 7. Main application routes

| Method | Route | Purpose |
|---|---|---|
| GET / POST | `/signup` | Student account form and registration |
| GET / POST | `/login` | Sign-in form and authentication |
| POST | `/logout` | Destroy the current session |
| GET | `/student/dashboard` | Show the signed-in student's tickets |
| GET / POST | `/student/queue/add` | Request a ticket for an active office |
| GET | `/staff/dashboard` | Staff dashboard and queue summary |
| GET | `/staff/queue` | Filterable office queue list |
| POST | `/staff/queue/call-next` | Call next waiting ticket |
| POST | `/staff/queue/:id/served` | Complete a serving ticket |
| POST | `/staff/queue/:id/skip` | Skip a serving ticket |
| GET / POST | `/staff/queue/add` | Add a ticket from the staff interface |
| GET / POST | `/staff/queue/:id/edit` | Edit a waiting ticket |
| POST | `/staff/queue/:id/delete` | Delete an eligible ticket |
| GET / POST | `/admin/users` | List and create staff/admin accounts |
| POST | `/admin/users/:id/delete` | Delete another user account |

## 8. Known limitations

- Staff accounts are not assigned to a particular office; staff with access to the staff area can select any active office.
- Student ticket cancellation is not currently exposed in the student interface.
- Queue ticket numbers are global rather than restarting per office or day.
