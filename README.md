# Student Queueing System

## Project Description

The Student Queueing System is a web-based application developed to help manage student queues and organize queue-related transactions in a school.

## Technologies Used

- Node.js
- Express.js
- MySQL
- EJS
- bcryptjs
- express-session

## Features

- User registration and login
- Password hashing
- Session management
- Role-based access control for students, staff, and administrators
- Staff queue management routes
- Administrator routes for office and user management

*Note: Features should be confirmed against the implemented pages and tested routes.*

## Requirements

- Node.js and npm
- MySQL
- Git (optional, for cloning the repository)

## Installation and Setup

1. Clone or download this repository.
2. Open a terminal in the project folder.
3. Install the dependencies:

   ```bash
   npm install
   ```

4. Create a MySQL database named `queueing_system`, or use the database name configured in your local environment.
5. Configure the database connection and session secret using `.env.example` as a guide. Create a local `.env` file with your own values.
6. Start the application:

   ```bash
   node app.js
   ```

7. Open `http://localhost:3000` in your browser.

## Test Accounts

The project includes a seed script that defines test accounts for three roles. To create them, configure the database first and run:

```bash
node scripts/seed.js
```

| Role | Email |
|---|---|
| Admin | admin@school.edu |
| Staff | staff@school.edu |
| Student | student@school.edu |

The seed script uses bcryptjs to hash passwords before storing them. Use the passwords provided in the project's test plan in a local testing environment only. Do not use these sample credentials in a production deployment.

## Testing

The manual testing checklist is available in [`docs/test-plan.md`](docs/test-plan.md).

Record the actual result of each test as **Pass** or **Fail**. Document failures in the project's GitHub Issues and retest after fixes.

Automated testing is not yet configured in `package.json`.

## Security Notes

- Keep `.env` out of version control.
- Do not commit real passwords, database credentials, or session secrets.
- Use hashed passwords rather than storing plain-text passwords.
- Test access restrictions for each user role.

## AI Disclosure

AI assistance was used to help prepare project documentation and guide development and testing. Project code and test results should be reviewed and verified by the team.

## Project Status

Testing is in progress. See [`docs/test-plan.md`](docs/test-plan.md) for the checklist and recorded results.