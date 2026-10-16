# Student Queueing System

## Project Description

The Student Queueing System is a web-based application designed to help organize student queueing activities in a school.

## Team Members

1. Abanes Francine Joy
2. Dimacali Edgardo
3. Tominio Angel

## Features

- User registration and login
- Password hashing
- Session management
- Role-based access control for students, staff, and administrators
- Protected staff and administrator routes
- MySQL database integration


## Technologies Used

- Node.js
- Express.js
- EJS
- MySQL
- Git and GitHub

## Installation and Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/francinejoy06/student-queueing-system.git
   cd student-queueing-system
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Configure your environment variables using `.env.example` as a guide. Create a local `.env` file with the required database settings and session secret. Do not upload `.env` to GitHub.

4. Start MySQL and create the database and tables required by the project.

5. If the database is configured, run the seed script to create sample accounts:

   ```bash
   node scripts/seed.js
   ```

6. Start the application using the start command configured in `package.json`.

7. Open `http://localhost:3000` in your browser.

## Test Accounts

The seed script defines these sample account emails:

| Role | Email |
|---|---|
| Administrator | admin@school.edu |
| Staff | staff@school.edu |
| Student | student@school.edu |

Run the seed script successfully before using these accounts. Check the script for the configured passwords, and use only local test accounts.

## AI Assistance Disclosure

AI tools were used to assist with documentation and development guidance. The team is responsible for reviewing, understanding, testing, and verifying the submitted code and documentation.
