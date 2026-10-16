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

The **Student Queueing System** is a web-based application designed to help schools manage student queues and organize queue-related transactions. It provides different access levels for students, staff, and administrators to support their respective tasks.

## Features

- **User Registration and Login** – Allows users to create accounts and log in.
- **Password Hashing** – Uses `bcryptjs` to hash passwords before storing them.
- **Session Management** – Uses `express-session` to maintain user sessions.
- **Role-Based Access Control** – Restricts access according to user roles.
- **Student Dashboard** – Provides access to student-related functions.
- **Staff Dashboard and Queue Management** – Supports queue viewing and management.
- **Office Management** – Allows administrators to manage office records.
- **User Management** – Allows administrators to manage user accounts.

*Note: Features should be verified against the implemented application and test results.*

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
- MySQL
- EJS (Embedded JavaScript templates)
- bcryptjs
- express-session
- HTML and CSS

## System Requirements

Before running the application, make sure you have installed:

- Node.js and npm
- MySQL Server
- Git (optional, for cloning the repository)
- A web browser

## Installation and Setup

### 1. Get the Project

Clone the repository or download the project files. If you already have the project locally, open its folder in VS Code.

### 2. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

### 3. Configure the Database

Make sure your MySQL server is running.

Create the database named `queueing_system`, or use the database name specified by the project's existing configuration.

Check the project's database configuration files to determine the required database name, tables, and connection settings.

### 4. Configure Environment Variables

Check `.env.example` for the required environment variables.

Create a local `.env` file and provide the appropriate values for your database connection and session secret.

**Important:** Do not commit your `.env` file or expose database passwords and session secrets.

### 5. Prepare the Database

If the project includes a database schema or setup script, follow the instructions provided by the project.

To create the sample user accounts, configure the database first and run:

```bash
node scripts/seed.js
```

Run this script only if it exists in the project and is appropriate for your local database.

### 6. Start the Application

Run:

```bash
node app.js
```

If the application starts successfully, the terminal should display the server address.

### 7. Open the Application

Open your browser and visit:

http://localhost:3000

## User Roles

The system supports three user roles:

| Role | Main Responsibilities |
|---|---|
| Student | Access student-related pages and queue functions. |
| Staff | View and manage queues and access staff functions. |
| Administrator | Manage offices and user accounts and access authorized administrative functions. |

Access is restricted according to the user's role.

## Sample Test Accounts

The project's seed script defines sample accounts for testing:

| Role | Email |
|---|---|
| Administrator | `admin@school.edu` |
| Staff | `staff@school.edu` |
| Student | `student@school.edu` |

Use the passwords specified in the project's test plan or seed configuration.

**Security reminder:** Use sample credentials only in a local testing environment. Never use them for production accounts.

## Testing

The manual testing checklist is available in [`docs/test-plan.md`](docs/test-plan.md).

Testing should include:

- User registration and login
- Session creation and logout
- Student access to student pages
- Staff access to staff pages
- Administrator access to administrative pages
- Prevention of unauthorized access between roles
- Queue management functions
- Office and user management functions

Record the actual result of each test as **Pass** or **Fail**. Document failures in GitHub Issues and retest after corrections.

Automated testing should be documented here once it has been configured and verified.

## Security Notes

- Keep `.env` out of version control.
- Never commit real passwords, database credentials, or session secrets.
- Store password hashes instead of plain-text passwords.
- Apply role-based access checks to protected routes.
- Test both authorized and unauthorized access.
- Do not expose sensitive information in error messages.

## AI Disclosure

AI assistance was used to help prepare project documentation and provide guidance during development and testing. The project team is responsible for reviewing the code, verifying the documented features, and confirming all test results.

## Project Status

The project is undergoing development and testing. Refer to [`docs/test-plan.md`](docs/test-plan.md) for the testing checklist and recorded results.
