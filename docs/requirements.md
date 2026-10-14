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