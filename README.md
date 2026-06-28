# Buildathon Registration Portal Backend Server

A robust, highly secure, and scalable REST API backend built in Node.js and Express.js for managing registrations, team associations, and entry check-ins for the college Buildathon.

---

## Folder Structure

```text
backend/
├── config/
│   ├── db.js             # MongoDB Atlas connection manager
│   ├── passport.js       # Passport Google OAuth strategy configuration
│   └── seed.js           # Automatic default admin account initializer
├── controllers/
│   ├── adminController.js     # Admin dashboards, status toggles, user/team searches
│   ├── attendanceController.js# Scanning QR passes, checking in users & counting statistics
│   ├── authController.js       # ID token credentials exchange & redirects
│   ├── teamController.js       # Team creations & teammate joining validations
│   └── userController.js       # Profile management, registrations, and pass generation
├── middleware/
│   ├── auth.js           # JWT protection guards & Role-Based Access Control (RBAC)
│   ├── error.js          # Centralized error handler and 404 router
│   ├── logger.js         # Morgan stream setup writing logs/access.log
│   └── validation.js     # Input checker handler mapping express-validator errors
├── models/
│   ├── Admin.js          # Mongoose Admin schema (Local credential hash checks)
│   ├── Team.js           # Mongoose Team schema (Teammates association, capacity limit: 2)
│   └── User.js           # Mongoose User schema (User details, QR token, statuses)
├── routes/
│   ├── adminRoutes.js    # Routes for admin controls (/api/admin)
│   ├── attendanceRoutes.js# Routes for scanning passes (/api/attendance)
│   ├── authRoutes.js     # Routes for OAuth authentication (/api/auth)
│   ├── teamRoutes.js     # Routes for team handling (/api/team)
│   └── userRoutes.js     # Routes for student registers (/api/users)
├── services/
│   └── qrService.js      # Service generating Base64 QR code PNG strings
├── utils/
│   └── jwt.js            # JWT token signing assistant
├── validators/
│   ├── adminValidator.js # Validation fields rules for admin login
│   ├── teamValidator.js  # Validation fields rules for team requests
│   └── userValidator.js  # Validation fields rules for user profile & registrations
├── logs/                 # Access traffic logs (Generated at runtime)
│   └── access.log
├── .env.example          # Sample environment values
├── .env                  # Configuration variables
├── package.json          # Dependency requirements
└── README.md             # Guide document
```

---

## Technology Stack

- **Node.js** & **Express.js** (Application server)
- **MongoDB Atlas** & **Mongoose** (Database & Schemas)
- **Passport Google OAuth 2.0** & **Google-Auth-Library** (Identity verification)
- **JSON Web Tokens (JWT)** (Session Authorization)
- **QRCode** (Base64 pass generation)
- **Security**: Helmet, CORS, Express-Rate-Limit, Mongo-Sanitize, BcryptJS

---

## Installation

### Prerequisites
- Node.js (v16.x or higher)
- npm (v7.x or higher)
- MongoDB local instance or MongoDB Atlas Connection String

### Setup Steps
1. Clone the project files into your workspace directory.
2. Open terminal in the directory and run:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Populate the `.env` configuration with your credentials. See the [Environment Variables](#environment-variables) section below.

---

## Environment Variables

Configure the following variables inside your `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/buildathon?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=supersecurejwtkey123!@#
JWT_EXPIRES_IN=7d

# Google OAuth Setup
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# College Restrictions
COLLEGE_EMAIL_DOMAIN=mycollege.edu

# Local Admin Credentials (Seeded Automatically)
DEFAULT_ADMIN_EMAIL=admin@mycollege.edu
DEFAULT_ADMIN_PASSWORD=AdminSecurePassword123!

# Frontend Redirection Url
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

---

## Run Commands

Run the application locally:

* **Development mode (with nodemon hot-reload):**
  ```bash
  npm run dev
  ```
* **Production mode:**
  ```bash
  npm start
  ```

---

## MongoDB Setup & Admin Seeding

1. Create a database cluster on MongoDB Atlas.
2. Whitelist your IP in Atlas Network Access.
3. Retrieve your MongoDB Connection String and paste it in `MONGO_URI` in `.env`.
4. **Admin Seeding**: On the initial startup of the server, if the database's `admins` collection contains no accounts, the seeder will automatically insert the user configured by `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` (default: `admin@mycollege.edu` and `AdminSecurePassword123!`).

---

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Search for "OAuth consent screen", select **External** (or **Internal** if available within your institution workspace), and populate the required application details.
4. Set Authorized Domains to your college domain (e.g. `mycollege.edu`).
5. Navigate to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
6. Set Application type to **Web application**.
7. Under **Authorized redirect URIs**, add your backend callback handler URL:
   `http://localhost:5000/api/auth/google/callback`
8. Copy the generated **Client ID** and **Client Secret** and add them to your `.env` file.

---

## API Documentation

All requests return consistent JSON structures.

### Authentication Module (`/api/auth`)

* **POST `/google`** (Exchange Credential)
  - Body: `{ "token": "GOOGLE_ID_TOKEN" }`
  - Notes: Supports `mock_username` for local tests if client ID is dummy. Verifies domain ends with `COLLEGE_EMAIL_DOMAIN`.
* **GET `/google`** (Passport Redirect)
  - Redirects browser to Google Authentication Screen.
* **GET `/google/callback`** (Passport Callback)
  - Handles response from Google. Generates JWT and redirects to `FRONTEND_URL/login.html?token=JWT_TOKEN`.
* **GET `/me`** (Current Profile)
  - Headers: `Authorization: Bearer <JWT>`
  - Returns authenticated user details.
* **POST `/logout`** (Exit Session)
  - Clears authentication cookie.

---

### Team Module (`/api/team`)

* **POST `/create`** (Create Team)
  - Headers: `Authorization: Bearer <JWT>`
  - Body: `{ "teamName": "Team Alpha" }`
  - Action: Creates team, assigns caller as leader and member, generates unique 6-digit `joinCode`.
* **POST `/join`** (Join Team)
  - Headers: `Authorization: Bearer <JWT>`
  - Body: `{ "joinCode": "XXXXXX" }`
  - Action: Joins team. Rejects if team is full (max 2 members) or if user is already in a team.
* **GET `/details`** (Get Teammates)
  - Headers: `Authorization: Bearer <JWT>`
  - Returns team name, leader details, and member lists.

---

### User Profile & Registration (`/api/users`)

* **GET `/profile`** (Populated Profile)
  - Headers: `Authorization: Bearer <JWT>`
  - Returns full profile populated with team and teammates.
* **PUT `/profile`** (Update Fields)
  - Body: `{ "phone", "registerNumber", "department", "year", "gender", "github", "linkedin", "portfolio" }`
  - Notes: Rejects edits once status is `Approved`.
* **POST `/register`** (Submit Registration)
  - Body: `{ "phone", "registerNumber", "department", "year", "gender", "github", "linkedin", "portfolio", "participationType" }`
  - Action: Changes registration status to `Pending` for Admin review. Checks team association if participationType is 'Team'.
* **GET `/status`** (Checks Statuses)
  - Returns current registrationStatus and check-in (isPresent) status.
* **GET `/pass`** (Retrieves Pass)
  - Notes: Available only if status is `Approved`. Returns Base64 QR Code image data URI.

---

### Admin Console (`/api/admin`)

* **POST `/login`** (Admin Login)
  - Body: `{ "email": "admin@mycollege.edu", "password": "AdminSecurePassword123!" }`
  - Action: Authenticates local credentials, returns admin JWT token.
* **GET `/dashboard`** (Metrics Overview)
  - Headers: `Authorization: Bearer <Admin_JWT>`
  - Returns Total Registrations, Pending, Approved, Rejected, Present, Absent, and 10 latest applicants.
* **GET `/pending`** (List Pending)
* **GET `/approved`** (List Approved)
* **GET `/rejected`** (List Rejected)
* **POST `/approve/:id`** (Approve User)
  - Action: Changes status to Approved. Generates a secure, cryptographically random UUID token and saves it under `attendanceQRToken`.
* **POST `/reject/:id`** (Reject User)
  - Action: Changes status to Rejected.
* **GET `/search/users?query=keyword`**
  - Action: Search user by name, email, registerNumber, department.
* **GET `/search/teams?query=keyword`**
  - Action: Search team by teamName.

---

### Attendance Checking Module (`/api/attendance`)

* **POST `/scan`** (Verify QR Pass)
  - Headers: `Authorization: Bearer <Admin_JWT>`
  - Body: `{ "token": "UUID_TOKEN" }`
  - Action: Verifies token validity, registration approval, and returns student identity details.
* **POST `/mark`** (Mark Present)
  - Headers: `Authorization: Bearer <Admin_JWT>`
  - Body: `{ "token": "UUID_TOKEN" }`
  - Action: Checks in participant once (`isPresent = true`). If already present, returns success status with `Already Present` message.
* **GET `/list?present=true`** (Check-in list)
* **GET `/stats`** (Scan Analytics)
  - Returns present counts, absent counts, and check-in percentage.

---

## Postman Collection Testing

A pre-configured Postman collection `postman_collection.json` is located in the project root.
1. Import `postman_collection.json` into Postman.
2. The collection has a variable `base_url` set to `http://localhost:5000` by default.
3. Authenticating using the **Admin Login** API automatically captures the JWT token and updates the collection variable `jwt_token`. All subsequent admin and protected operations read from this variable automatically.
4. For testing student endpoints, copy the returned user token from **Google Login (Token Exchange)** and replace the `jwt_token` value in the environment variables, or customize the API authorization header.

---

## Deployment Guide

To deploy this Node.js/Express server to a cloud provider (e.g. Render, Heroku, AWS Elastic Beanstalk):

1. **Setup Production Database**: Ensure you use a production-ready MongoDB Atlas cluster connection string.
2. **Environment Variables**: Set the production keys in your deployment platform settings (Render Dashboard, Heroku Config Vars, etc.). Make sure to change `NODE_ENV` to `production` and provide a long, secure `JWT_SECRET`.
3. **Allowed Redirect URLs**: Make sure to update `GOOGLE_CALLBACK_URL` and `FRONTEND_URL` to point to the production live domains.
4. **CORS Settings**: Set `FRONTEND_URL` to the exact URL of your production client frontend to allow credentials and secure transmissions.
5. **Start Script**: Ensure the service provider runs:
   ```bash
   npm install --production
   npm start
   ```
