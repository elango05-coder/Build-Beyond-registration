# Buildathon Registration Portal API Documentation

This document lists all the routes, request schemas, authentication layers, and response structures discovered in the backend.

---

## 🔐 Auth & Identity Module (`/api/auth`)

| Method | Endpoint | Description | Auth Required | Request Body | Status Code (Success) |
|:---|:---|:---|:---|:---|:---|
| `POST` | `/google` | Exchange client ID token for backend JWT | No | `{ "token": "id_token" }` | `200 OK` |
| `GET` | `/google` | Redirect-based Google strategy sign-in | No | None (redirect flow) | `302 Redirect` |
| `GET` | `/google/callback` | Google strategy OAuth callback handler | No | Query parameters | `302 Redirect` |
| `GET` | `/me` | Retrieve active authenticated session profile | Yes (User/Admin) | None (uses Header/Cookie) | `200 OK` |
| `POST` | `/logout` | Terminate session and invalidate cookie | Yes (User/Admin) | None | `200 OK` |

---

## 👥 Student User Module (`/api/users`)

All routes require a valid student session token.

| Method | Endpoint | Description | Request Body | Status Code | Notes / Constraints |
|:---|:---|:---|:---|:---|:---|
| `GET` | `/profile` | Get participant profile and team details | None | `200 OK` | Populates leader & teammates |
| `PUT` | `/profile` | Save intermediate profile details | `{ "phone", "registerNumber", "department", "year", "gender", "github", "linkedin", "portfolio" }` | `200 OK` | Allowed only when status is not `'Approved'` |
| `POST` | `/register` | Submit profile for Buildathon registration | `{ "phone", "registerNumber", "department", "year", "gender", "github", "linkedin", "portfolio", "participationType" }` | `200 OK` | Sets status to `'Pending'`. Checks team details |
| `GET` | `/status` | Retrieve registration and attendance status | None | `200 OK` | Returns `registrationStatus` & `isPresent` |
| `GET` | `/pass` | Generate Entry Pass QR Code base64 data | None | `200 OK` | Available only if `registrationStatus` is `'Approved'` |

---

## ⚔️ Team Module (`/api/team`)

All routes require a valid student session token.

| Method | Endpoint | Description | Request Body | Status Code | Constraints |
|:---|:---|:---|:---|:---|:---|
| `POST` | `/create` | Create team as leader | `{ "teamName": "string" }` | `201 Created` | Rejects if user is already in a team |
| `POST` | `/join` | Join team using teammate's code | `{ "joinCode": "string" }` | `200 OK` | Rejects if team capacity (2) is reached |
| `GET` | `/details` | Get current team profile | None | `200 OK` | Returns member name lists and leader status |

---

## 🛡️ Admin Console Module (`/api/admin`)

Requires Admin credentials/token.

| Method | Endpoint | Description | Request Body | Status Code | Notes |
|:---|:---|:---|:---|:---|:---|
| `POST` | `/login` | Admin credentials authentication | `{ "email", "password" }` | `200 OK` | Standard email/password check |
| `GET` | `/dashboard` | Metrics, summary stats, latest entries | None | `200 OK` | Counts Approved, Pending, Rejected, Present |
| `GET` | `/pending` | Retrieve all pending registration profiles | None | `200 OK` | Sorted by `updatedAt: -1` |
| `GET` | `/approved` | Retrieve approved registration profiles | None | `200 OK` | Sorted by name |
| `GET` | `/rejected` | Retrieve rejected registration profiles | None | `200 OK` | Sorted by name |
| `POST` | `/approve/:id` | Approve user registration application | None (uses URL param ID) | `200 OK` | Generates unique UUID token |
| `POST` | `/reject/:id` | Reject user registration application | None (uses URL param ID) | `200 OK` | Clears QR tokens |
| `GET` | `/search/users` | Search users by keyword query | Query: `?query=keyword` | `200 OK` | Checks name, email, registerNumber, dept |
| `GET` | `/search/teams` | Search teams by name | Query: `?query=keyword` | `200 OK` | Checks teamName |

---

## 📊 Attendance Operations Module (`/api/attendance`)

Requires Admin credentials/token.

| Method | Endpoint | Description | Request Body | Status Code | Strict Actions |
|:---|:---|:---|:---|:---|:---|
| `POST` | `/scan` | Validate scan entry pass | `{ "token": "UUID_TOKEN" }` | `200 OK` | Verifies UUID token matches Approved student |
| `POST` | `/mark` | Mark student check-in | `{ "token": "UUID_TOKEN" }` | `200 OK` | Sets `isPresent = true`. Rejects duplicate mark |
| `GET` | `/list` | List checks-ins | Query: `?present=true/false` | `200 OK` | Filtered list of attendees |
| `GET` | `/stats` | Statistics summary of scans | None | `200 OK` | Present/absent counts and rates |
