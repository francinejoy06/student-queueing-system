# Requirements Document: Student Queueing System

## 1. Project Overview
The Student Queueing System is a web application that lets students get a queue ticket for a campus office, lets office staff call and process tickets, and lets administrators manage users and offices. It replaces physical lines with a digital, trackable queue.

## 2. Users

| User | Description | Main needs |
|---|---|---|
| Student | A registered student who needs service from a campus office | Register and log in, request a queue ticket for an office, see the status of their ticket |
| Staff | An employee of a campus office | View waiting tickets for their office, call the next ticket, mark a ticket as completed or skipped |
| Administrator | A system administrator | Add, rename, and deactivate offices; add, edit, and delete user accounts |

## 3. Stakeholders

| Stakeholder | Interest in the system |
|---|---|
| Campus offices (Registrar, Cashier, Guidance Office, Library) | Shorter lines and more organized service |
| School administration | Better service quality and a record of queue activity |
| IT / system maintainers | A system that is secure, documented, and easy to maintain |
| Students (as a whole) | Less waiting time and clearer service order |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-1 | The system shall allow a student to register an account with full name, email, and password. |
| FR-2 | The system shall allow users to log in and log out using their email and password. |
| FR-3 | The system shall allow a student to request a queue ticket for an active office, stating the purpose of the visit. |
| FR-4 | The system shall assign each ticket a ticket number and the status "waiting". |
| FR-5 | The system shall allow a student to view the status of their own tickets. |
| FR-6 | The system shall allow staff to view the waiting tickets of each office. |
| FR-7 | The system shall allow staff to call the next (oldest) waiting ticket, which changes its status to "serving". |
| FR-8 | The system shall allow staff to mark the ticket being served as "completed" or "skipped". |
| FR-9 | The system shall prevent staff from calling a new ticket while another ticket is still being served. |
| FR-10 | The system shall allow an administrator to add, rename, activate, and deactivate offices. |
| FR-11 | The system shall allow an administrator to add, edit, and delete user accounts and assign roles (student, staff, admin). |
| FR-12 | The system shall restrict each page to the roles that are allowed to use it. |
| FR-13 | The system shall validate all submitted data (required fields, email format, length, duplicates, valid roles) and show clear error messages. |
| FR-14 | The system shall store all users, offices, and tickets in a database so data remains after a page refresh. |

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Security | Passwords shall be stored as bcrypt hashes, never as plain text. |
| NFR-2 | Security | Protected pages shall not be accessible to unauthorized users, even by typing the URL directly. |
| NFR-3 | Security | Secrets such as database credentials and the session secret shall be kept in a .env file that is not committed to the repository. |
| NFR-4 | Data integrity | Offices shall be deactivated instead of deleted so existing tickets remain valid. |
| NFR-5 | Reliability | Database queries shall use parameterized statements, and server errors shall show a friendly message instead of crashing the application. |
| NFR-6 | Usability | Pages shall be simple, consistent, and usable on both desktop and mobile screens. |
| NFR-7 | Maintainability | The code shall follow the routes, controllers, models, and views structure. |

## 6. Use Cases

### UC-1: Register an account
- **Actor:** Student
- **Precondition:** The student does not have an account.
- **Steps:** 1. Open the register page. 2. Enter full name, email, password, and password confirmation. 3. Submit the form.
- **Expected result:** The account is created and the student is redirected to the login page. Invalid input shows an error message.

### UC-2: Log in
- **Actor:** Student, Staff, or Administrator
- **Precondition:** The user has an account.
- **Steps:** 1. Open the login page. 2. Enter email and password. 3. Submit the form.
- **Expected result:** A session is created and the user is sent to the page for their role. A wrong password shows "Invalid email or password."

### UC-3: Request a queue ticket
- **Actor:** Student
- **Precondition:** The student is logged in and at least one office is active.
- **Steps:** 1. Open the queue request form. 2. Select an office. 3. Enter the purpose of the visit. 4. Submit the form.
- **Expected result:** A ticket with status "waiting" is saved and shown to the student.

### UC-4: Call the next ticket
- **Actor:** Staff
- **Precondition:** Staff is logged in, at least one ticket is waiting, and no ticket is currently being served.
- **Steps:** 1. Open the staff queue page. 2. Click "Call next" for an office.
- **Expected result:** The oldest waiting ticket changes to "serving". If a ticket is already being served, an error message is shown.

### UC-5: Complete or skip a ticket
- **Actor:** Staff
- **Precondition:** A ticket is currently being served.
- **Steps:** 1. Open the staff queue page. 2. Click "Complete" or "Skip".
- **Expected result:** The ticket status is updated in the database.

### UC-6: Manage offices
- **Actor:** Administrator
- **Precondition:** The administrator is logged in.
- **Steps:** 1. Open the Manage Offices page. 2. Add a new office, rename an office, or deactivate an office.
- **Expected result:** The change is saved. A duplicate office name shows an error message.

### UC-7: Manage users
- **Actor:** Administrator
- **Precondition:** The administrator is logged in.
- **Steps:** 1. Open the Manage Users page. 2. Add, edit, or delete a user.
- **Expected result:** The change is saved. A user who already has tickets cannot be deleted, and an error message explains why.
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
