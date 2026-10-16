# Student Queueing System

## 1. Project Description

The Student Queueing System is a web-based application designed to help schools manage student queues and organize queue-related transactions. It provides different access levels for students, staff, and administrators.

## 2. Team Members

1. Abanes Francine Joy
2. Dimacali Edgardo
3. Tominio Angel

## 3. Assigned System

**System Name:** Student Queueing System

The system manages student queue tickets and provides different functions based on user roles.

## 4. Features

- User registration and login
- Password hashing using `bcryptjs`
- Session management
- Role-based access for students, staff, and administrators
- Student dashboard and queue ticket requests
- Staff dashboard and queue management
- Office management
- User management for administrators

*Note: Verify each feature in the running application before presenting it as fully implemented.*

## 5. Technologies

- Node.js
- Express.js
- EJS
- MySQL
- HTML and CSS
- bcryptjs
- express-session
- dotenv
- Git and GitHub

## 6. Installation

1. Install Node.js, npm, and MySQL Server.
2. Clone the repository:

   ```bash
   git clone https://github.com/francinejoy06/student-queueing-system.git
   cd student-queueing-system
   ```

3. Install the project dependencies:

   ```bash
   npm install
   ```

## 7. Configuration

1. Create a `.env` file in the project root using `.env.example` as a guide.
2. Configure the environment variables according to your local setup. For example:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=queueing_system
   SESSION_SECRET=your_local_session_secret
   ```

3. Replace the example values with the correct settings for your environment. Use a strong, private session secret.
4. Do not upload your actual `.env` file or private credentials to GitHub.

## 8. Database Setup

1. Start MySQL using your local database tool, such as XAMPP.
2. Open phpMyAdmin or another MySQL client.
3. Import or execute the `db/schema.sql` file.

The schema creates the `queueing_system` database and the following tables:

- `users` — stores user account details, password hashes, and roles.
- `offices` — stores office records.
- `queue_tickets` — stores student queue tickets and their statuses.

The schema also inserts four default offices:

- Registrar
- Cashier
- Guidance Office
- Library

4. Make sure the database settings in your `.env` file match your MySQL configuration.

## 9. How to Run

1. Open a terminal in the project folder.
2. Make sure MySQL is running and the database is configured.
3. Run the seed script to create the sample accounts:

   ```bash
   node scripts/seed.js
   ```

4. Start the application:

   ```bash
   node app.js
   ```

5. Open the application in your browser:

   http://localhost:3000

## 10. User Accounts

Run `node scripts/seed.js` to create the following sample accounts.

| Role | Email | Sample Password |
|---|---|---|
| Administrator | admin@school.edu | `Admin123!` |
| Staff | staff@school.edu | `Staff123!` |
| Student | student@school.edu | `Student123!` |

**Reminder:** These sample credentials are for development and testing only. Do not use them for real accounts or production deployment.

The seed script uses `bcryptjs` to hash passwords before storing them in the database. Existing accounts with the same email may not be updated when the script runs again.

## 11. Project Structure

```text
student-queueing-system/
├── config/
│   └── db.js
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── staffController.js
│   └── studentController.js
├── db/
│   └── schema.sql
├── docs/
│   └── test-plan.md
├── middleware/
│   └── auth.js
├── models/
│   ├── adminModel.js
│   ├── queueModel.js
│   └── userModel.js
├── public/
│   └── css/
│       └── app.css
├── routes/
│   ├── adminRoutes.js
│   ├── auth.js
│   ├── authRoutes.js
│   ├── staffRoutes.js
│   └── studentRoutes.js
├── scripts/
│   └── seed.js
├── views/
│   ├── admin/
│   ├── auth/
│   ├── partials/
│   ├── staff/
│   └── student/
├── .env.example
├── .gitignore
├── app.js
├── package.json
├── package-lock.json
├── LICENSE
└── README.md
```

*Note: The project structure above should match the actual files and folders in the repository. Update it if anything is missing or named differently.*

## 12. Known Limitations

The system is intended for development and testing. Any incomplete features, known bugs, or untested functions should be documented here after verification by the team.

## 13. AI Assistance Disclosure

AI tools were used to assist with documentation and development guidance. The team is responsible for reviewing the code, testing the application, and verifying the accuracy of the documentation.

## 14. License

This project is licensed under the MIT License. See the `LICENSE` file for details.
