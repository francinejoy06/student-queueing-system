# Test Plan - Student Queueing System

**Prepared by:** Member 3 (Database / Authentication / Testing)
**Environment:** Node.js + Express, MySQL (`queueing_system`), run at `http://localhost:3000`

> Update the URLs below if your route names differ.
> Result column: write **Pass** or **Fail**. Log every failure as a GitHub Issue (`fix:` commit linked to it).
> Tests with an empty Result column were added or changed after the 2026-10-17 test run and must be run again.

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@school.edu | Admin123! |
| Student | student@school.edu | Student123! |
| Staff | Register through the form (choose an office). Create at least two staff accounts in different offices. | Use any valid password |

Admin and student accounts are created by `node scripts/seed.js` (`scripts/seed.js`).

---

## 1. Authentication

| ID | Test case | Steps | Expected result | Result |
|---|---|---|---|---|
| AUTH-01 | Correct login | Open `/login`, enter valid email and password, submit | Redirected to the dashboard for the user's role |Pass|
| AUTH-02 | Wrong password | Enter valid email, wrong password | Error "Invalid email or password"; no session created |Pass|
| AUTH-03 | Unknown email | Enter an email that is not registered | Same error "Invalid email or password" |Pass|
| AUTH-04 | Empty credentials | Submit the login form with both fields empty | Validation error shown; nothing submitted to the database |Pass|
| AUTH-05 | Logout | While logged in, click Logout | Session destroyed; redirected to `/login` |Pass|
| AUTH-06 | Back button after logout | Log out, press the browser Back button | Protected page is not shown; redirected to login |Pass|
| AUTH-07 | Protected page, not logged in | Open `/dashboard` directly without logging in | Redirected to `/login` |Pass|
| AUTH-08 | Password stored hashed | After registering, check the `users` table in phpMyAdmin | `password_hash` is a bcrypt hash, not plain text |Pass|

## 2. Registration and Forms

| ID | Test case | Steps | Expected result | Result |
|---|---|---|---|---|
| FORM-01 | Valid registration | Fill the register form with valid data | Account created; record appears in `users` |Pass|
| FORM-02 | Empty fields | Submit the register form empty | Error messages for each required field |Pass|
| FORM-03 | Invalid email format | Enter `abc` or `abc@` as email | Error "Invalid email format" |Pass|
| FORM-04 | Short password | Enter a password under 8 characters | Error about minimum password length |Pass|
| FORM-05 | Duplicate email | Register with an email that already exists | Error "Email already registered"; no duplicate row |Pass|
| FORM-06 | Valid queue request | Logged in as student, submit the queue form with valid data | Ticket created and shown with a queue number |Pass|
| FORM-07 | Empty queue request | Submit the queue form with required fields empty | Validation error; no ticket created |Pass|
| FORM-08 | Invalid office value | Edit the form (browser dev tools) to send a non-existent office ID | Server rejects it with an error message |Pass|
| FORM-09 | SQL injection attempt | Enter `' OR '1'='1` in the login email field | Login fails normally; no error leak or bypass |Pass|
| FORM-10 | HTML/script input | Enter `<script>alert(1)</script>` in the purpose field | Text displayed escaped; no script runs | |
| FORM-11 | Role escalation at registration | Register normally, but change the request (browser dev tools, or a POST tool) to send `role=admin` | No admin account is created; only student or staff accounts can be registered | |
| FORM-12 | Staff registration with office | Register as staff and choose an office (e.g. Cashier) | Account created with role `staff` and `office_id` set to the chosen office in `users` | |
| FORM-13 | Staff registration without a valid office | Register as staff without choosing an office, then send a non-existent office ID | Error message; no account created | |

## 3. Database (CRUD)

| ID | Test case | Steps | Expected result | Result |
|---|---|---|---|---|
| DB-01 | Create | Submit a new queue ticket | New row in `queue_tickets` |Pass|
| DB-02 | Read | Open the queue/status page | Tickets listed match the database |Pass|
| DB-03 | Update | Staff changes a ticket status (waiting to serving to completed) | `status` updated in `queue_tickets` |Pass|
| DB-04 | Cancel | Student cancels own `waiting` ticket | `status` becomes `cancelled`; the row is kept | |
| DB-05 | Persistence on refresh | Create a ticket, refresh the page | Ticket is still there |Pass|
| DB-06 | Persistence on restart | Stop the server, run `node app.js` again | All users and tickets still exist |Pass|
| DB-07 | Foreign keys | Try to create a ticket for a non-existent student or office | Database/server rejects it |Pass|
| DB-08 | Invalid status transitions | As staff, try to move a `completed` or `cancelled` ticket back to `waiting` or `serving`; as a student, send a POST that sets a ticket to `completed` | Rejected with an error; `status` in `queue_tickets` is unchanged. Allowed flow: waiting, serving, completed (or skipped/cancelled) | |
| DB-09 | Ticket number sequencing | Create several tickets for the same office, then two at nearly the same time in two browser tabs | Ticket numbers are unique and increase in order for that office; no duplicates; other offices are not affected | |
| DB-10 | Staff edits ticket purpose | As staff, edit the purpose of a ticket in your own office | New purpose saved in `queue_tickets`; other fields unchanged | |
| DB-11 | Cancel rules | As a student, try to cancel your own ticket that is `serving`, `completed`, `skipped`, or already `cancelled` | It doesn't have a cancel button; `status` is unchanged. Only a `waiting` ticket can be cancelled | |
| DB-12 | Cancelled ticket is not called | Cancel a waiting ticket, then staff clicks Call next | The cancelled ticket is skipped; the next `waiting` ticket is called | |
| DB-13 | Admin adds an office | As admin, add a new office | New row in `offices`; the first ticket in that office starts at 1 with its own prefix | |
| DB-14 | Duplicate office | As admin, add an office with an existing name | Error message; no duplicate row | |
| DB-15 | Admin moves staff to another office | As admin, change the office of a staff member | `office_id` updated in `users`; the staff member now sees the queue of the new office | |
| DB-16 | Admin deletes a user | As admin, delete a user without tickets, then a student who has tickets | The user without tickets is removed from `users`. The student with tickets is not deleted; an error message is shown and the user and tickets stay in the database. No server crash | |

## 4. Access Control (test every role)

| ID | Test case | Steps | Expected result | Result |
|---|---|---|---|---|
| AC-01 | Student cannot open admin page | Log in as student, type an admin URL (e.g. `/admin/users`) directly | 403 Forbidden or redirect; page not shown |Pass|
| AC-02 | Student cannot open staff page | Log in as student, type a staff URL (e.g. `/staff/queue`) directly | 403 Forbidden or redirect |Pass|
| AC-03 | Staff cannot open admin page | Log in as staff, type an admin URL directly | 403 Forbidden or redirect |Pass|
| AC-04 | Admin can open admin pages | Log in as admin, open admin pages | Page loads normally |Pass|
| AC-05 | Staff can manage the queue | Log in as staff, call next / complete a ticket | Action works |Pass|
| AC-06 | Student sees only own tickets | Log in as student, open "My tickets" | Only that student's tickets are shown |Pass|
| AC-07 | Student cannot act on others' tickets | Student sends a POST to cancel another student's ticket ID | Request rejected |Pass|
| AC-08 | Restricted POST routes | While logged out, send a POST to a protected route (e.g. call next) | Redirected to login; no change in database |Pass|
| AC-09 | Menu matches role | Log in as each role | Menu shows only links allowed for that role |Pass|
| AC-10 | Staff sees only own office | Log in as staff of office A | Only the queue of office A is shown; no way to select another office | |
| AC-11 | Staff cannot act on another office | As staff of office A, send a POST (call next, complete, or edit purpose) for a ticket of office B | Request rejected; ticket unchanged | |
| AC-12 | Admin cannot add or edit users | As admin, send a POST to add a user or edit a user's name/role (these features were removed) | Request rejected (404 or error); no change in `users` | |
| AC-13 | Only admin can move staff | As student and as staff, send a POST to change a staff member's office | Request rejected; `office_id` unchanged | |
| AC-14 | Logged-out access to protected pages | While logged out, open `/admin/users`, `/admin/offices`, and `/staff/queue` directly | Redirected to `/login` | |

## 5. Security Checks

| ID | Test case | Steps | Expected result | Result |
|---|---|---|---|---|
| SEC-01 | `.env` is not in the GitHub repository | Browse the repository files | Not listed in the repo |Pass|
| SEC-02 | `.env.example` contains no real passwords | Open `.env.example` on GitHub | Only placeholder values |Pass|
| SEC-03 | `node_modules/` is not in the repository | Browse the repository files | Not listed in the repo |Pass|
| SEC-04 | Session cookie is `httpOnly` | Check the session cookie in browser dev tools (Application tab) | Cookie has HttpOnly ticked, so JavaScript cannot read it |Pass|
| SEC-05 | No secrets in Git history | Run `git log --all --oneline -- .env` and `git log --all -p -- .env.example` | First command prints nothing; second shows only placeholder values. No real passwords or secrets in any commit |Pass|

## 6. Scope Notes (Not Tested in Round 1)

- Password reset, change password, and email verification are not implemented, so they are not tested.
- Real-time queue updates and notifications are not implemented. The queue page must be refreshed manually.
- Daily reset of ticket numbers is not implemented. Numbers are counted separately for each office and keep increasing.
- Security features such as HTTPS, CSRF protection, and login rate limiting are outside the scope of Round 1.

---

## Bug Log

| Bug ID | Test ID | Description | GitHub Issue | Status |
|---|---|---|---|---|
| | | | | |

## Summary

- Total tests: 56
- Passed: 56
- Failed: 0
- Date tested: 2026-10-23
