# Test Plan - Student Queuing System

**Prepared by:** Member 3 (Database / Authentication / Testing)
**Environment:** Node.js + Express, MySQL (`queueing_system`), run at `http://localhost:3000`

> Update the URLs below if your route names differ.
> Result column: write **Pass** or **Fail**. Log every failure as a GitHub Issue (`fix:` commit linked to it).

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@school.edu | Admin123! |
| Staff | staff@school.edu | Staff123! |
| Student | student@school.edu | Student123! |

Accounts are created by `node scripts/seed.js` (`scripts/seed.js`).

---

## 1. Authentication

| ID | Test case | Steps | Expected result | Result |
|---|---|---|---|---|
| AUTH-01 | Correct login | Open `/login`, enter valid email and password, submit | Redirected to the dashboard for the user's role | |
| AUTH-02 | Wrong password | Enter valid email, wrong password | Error "Invalid email or password"; no session created | |
| AUTH-03 | Unknown email | Enter an email that is not registered | Same error "Invalid email or password" | |
| AUTH-04 | Empty credentials | Submit the login form with both fields empty | Validation error shown; nothing submitted to the database | |
| AUTH-05 | Logout | While logged in, click Logout | Session destroyed; redirected to `/login` | |
| AUTH-06 | Back button after logout | Log out, press the browser Back button | Protected page is not shown; redirected to login | |
| AUTH-07 | Protected page, not logged in | Open `/dashboard` directly without logging in | Redirected to `/login` | |
| AUTH-08 | Password stored hashed | After registering, check the `users` table in phpMyAdmin | `password_hash` is a bcrypt hash, not plain text | |

## 2. Registration and Forms

| ID | Test case | Steps | Expected result | Result |
|---|---|---|---|---|
| FORM-01 | Valid registration | Fill the register form with valid data | Account created; record appears in `users` | |
| FORM-02 | Empty fields | Submit the register form empty | Error messages for each required field | |
| FORM-03 | Invalid email format | Enter `abc` or `abc@` as email | Error "Invalid email format" | |
| FORM-04 | Short password | Enter a password under 8 characters | Error about minimum password length | |
| FORM-05 | Duplicate email | Register with an email that already exists | Error "Email already registered"; no duplicate row | |
| FORM-06 | Valid queue request | Logged in as student, submit the queue form with valid data | Ticket created and shown with a queue number | |
| FORM-07 | Empty queue request | Submit the queue form with required fields empty | Validation error; no ticket created | |
| FORM-08 | Invalid office value | Edit the form (browser dev tools) to send a non-existent office ID | Server rejects it with an error message | |
| FORM-09 | SQL injection attempt | Enter `' OR '1'='1` in the login email field | Login fails normally; no error leak or bypass | |
| FORM-10 | HTML/script input | Enter `<script>alert(1)</script>` in the purpose field | Text displayed escaped; no script runs | |
| FORM-11 | Role escalation at registration | Register normally, but add a field `role=admin` to the request (browser dev tools, or a POST tool) | Account is created as `student`; the role field is ignored | |

## 3. Database (CRUD)

| ID | Test case | Steps | Expected result | Result |
|---|---|---|---|---|
| DB-01 | Create | Submit a new queue ticket | New row in `queue_tickets` | |
| DB-02 | Read | Open the queue/status page | Tickets listed match the database | |
| DB-03 | Update | Staff changes a ticket status (waiting to serving to completed) | `status` updated in `queue_tickets` | |
| DB-04 | Delete / cancel | Student cancels own ticket (or admin deletes) | Ticket status becomes `cancelled` or the row is removed | |
| DB-05 | Persistence on refresh | Create a ticket, refresh the page | Ticket is still there | |
| DB-06 | Persistence on restart | Stop the server, run `node app.js` again | All users and tickets still exist | |
| DB-07 | Foreign keys | Try to create a ticket for a non-existent student or office | Database/server rejects it | |
| DB-08 | Invalid status transitions | As staff, try to move a `completed` or `cancelled` ticket back to `waiting` or `serving`; as a student, send a POST that sets a ticket to `completed` | Rejected with an error; `status` in `queue_tickets` is unchanged. Allowed flow: waiting, serving, completed (or skipped/cancelled) | |
| DB-09 | Ticket number sequencing | Create several tickets for the same office, then two at nearly the same time in two browser tabs | Ticket numbers are unique and increase in order; no duplicates | |

## 4. Access Control (test every role)

| ID | Test case | Steps | Expected result | Result |
|---|---|---|---|---|
| AC-01 | Student cannot open admin page | Log in as student, type an admin URL (e.g. `/admin/users`) directly | 403 Forbidden or redirect; page not shown | |
| AC-02 | Student cannot open staff page | Log in as student, type a staff URL (e.g. `/staff/queue`) directly | 403 Forbidden or redirect | |
| AC-03 | Staff cannot open admin page | Log in as staff, type an admin URL directly | 403 Forbidden or redirect | |
| AC-04 | Admin can open admin pages | Log in as admin, open admin pages | Page loads normally | |
| AC-05 | Staff can manage the queue | Log in as staff, call next / complete a ticket | Action works | |
| AC-06 | Student sees only own tickets | Log in as student, open "My tickets" | Only that student's tickets are shown | |
| AC-07 | Student cannot act on others' tickets | Student sends a POST to cancel another student's ticket ID | Request rejected | |
| AC-08 | Restricted POST routes | While logged out, send a POST to a protected route (e.g. call next) | Redirected to login; no change in database | |
| AC-09 | Menu matches role | Log in as each role | Menu shows only links allowed for that role | |

## 5. Security Checks

| ID | Test case | Steps | Expected result | Result |
|---|---|---|---|---|
| SEC-01 | `.env` is not in the GitHub repository | Browse the repository files | Not listed in the repo | |
| SEC-02 | `.env.example` contains no real passwords | Open `.env.example` on GitHub | Only placeholder values | |
| SEC-03 | `node_modules/` is not in the repository | Browse the repository files | Not listed in the repo | |
| SEC-04 | Session cookie is `httpOnly` | Check the session cookie in browser dev tools (Application tab) | Cookie has HttpOnly ticked, so JavaScript cannot read it | |
| SEC-05 | No secrets in Git history | Run `git log --all --oneline -- .env` and `git log --all -p -- .env.example` | First command prints nothing; second shows only placeholder values. No real passwords or secrets in any commit | |

## 6. Scope Notes (not tested in Round 1)

- **Office-scoped staff access:** In the current schema (`users` table) staff accounts are not linked to a specific office, so any staff member can manage any office's queue. This is listed as a known limitation and would require a `users.office_id` column plus a check in the queue routes. If the team adds it, add a test: staff from Office A cannot call, complete or skip tickets of Office B.

---

## Bug Log

| Bug ID | Test ID | Description | GitHub Issue | Status |
|---|---|---|---|---|
| | | | | |

## Summary

- Total tests: ___
- Passed: ___
- Failed: ___
- Date tested: ___