# API Testing and Verification Report

This report summarizes the results of the comprehensive manual testing and verification run on the Buildathon Registration Portal backend APIs.

---

## 📊 Summary of Execution Results

- **Total Test Cases Executed:** 19
- **Successful Checks (Passed):** 19
- **Unsuccessful Checks (Failed):** 0
- **Database Consistency Checks:** 100% verified (CRUD writes/reads)
- **Vulnerability Checks (Auth/Validations):** 100% passed

---

## 📝 Detailed Verification Matrix

| Test ID | Method & Route | Scenario / Intended Action | Expected Result | Actual Result | Status |
|:---:|:---|:---|:---|:---|:---:|
| **1** | `GET /health` | Health Check | `200 OK`, `success: true` | `200 OK`, `success: true` | **PASS** |
| **2** | `POST /api/auth/google` | Exchange google token with missing token parameter | `400 Bad Request`, `success: false` | `400 Bad Request`, `success: false` | **PASS** |
| **3** | `POST /api/auth/google` | Exchange token with unauthorized email domain (gmail) | `403 Forbidden`, `success: false` | `403 Forbidden`, `success: false` | **PASS** |
| **4** | `POST /api/auth/google` | Valid college Google ID token login exchange | `200 OK`, JWT returned | `200 OK`, JWT returned | **PASS** |
| **5** | `GET /api/users/profile` | Request user details without sending JWT | `401 Unauthorized`, `success: false` | `401 Unauthorized`, `success: false` | **PASS** |
| **6** | `GET /api/users/profile` | Request user details with invalid signature JWT | `401 Unauthorized`, `success: false` | `401 Unauthorized`, `success: false` | **PASS** |
| **7** | `POST /api/team/create` | Create team using invalid short name (1 char) | `400 Bad Request`, error list | `400 Bad Request`, error list | **PASS** |
| **8** | `POST /api/team/create` | Create team with valid 16-character alphanumeric name | `201 Created`, joinCode returned | `201 Created`, joinCode returned | **PASS** |
| **9** | `POST /api/team/create` | Create second team for same user (teammate check) | `400 Bad Request`, `success: false` | `400 Bad Request`, `success: false` | **PASS** |
| **10** | `PUT /api/users/profile` | Update user profile sending invalid text string phone | `400 Bad Request`, `success: false` | `400 Bad Request`, `success: false` | **PASS** |
| **11** | `POST /api/users/register` | Submit registration with valid phone, register#, URLs | `200 OK`, registrationStatus: `'Pending'` | `200 OK`, status: `'Pending'` | **PASS** |
| **12** | `POST /api/admin/login` | Log in local admin sending wrong password | `401 Unauthorized`, `success: false` | `401 Unauthorized`, `success: false` | **PASS** |
| **13** | `POST /api/admin/login` | Log in admin sending correct credentials | `200 OK`, admin JWT returned | `200 OK`, JWT returned | **PASS** |
| **14** | `POST /api/admin/approve/:id` | Admin approves pending user ID | `200 OK`, UUID QR token generated | `200 OK`, UUID generated | **PASS** |
| **15** | `GET /api/users/pass` | Student fetches generated pass | `200 OK`, base64 QR PNG data URL | `200 OK`, base64 data URL | **PASS** |
| **16** | `POST /api/attendance/scan` | Scanner scans the generated QR UUID token | `200 OK`, details validation | `200 OK`, profile returned | **PASS** |
| **17** | `POST /api/attendance/mark` | Admin marks student check-in present | `200 OK`, `isPresent` set to `true` | `200 OK`, isPresent: true | **PASS** |
| **18** | `POST /api/attendance/mark` | Admin marks same student check-in present again | `200 OK`, success: false, 'Already Present' | `200 OK`, success: false, 'Already Present' | **PASS** |
| **19** | `GET /api/admin/dashboard` | Admin queries metrics counts and latest registrations | `200 OK`, approved >=1, present >=1 | `200 OK`, verified counts | **PASS** |

---

## 🛠️ Validation and Security Findings

1. **Authentication guards:** Security is fully enforced on all protected student routes (`/api/users/*`, `/api/team/*`) and admin routes (`/api/admin/*` and `/api/attendance/*`). Missing or bad JWT requests fail with clean `401` states.
2. **Double check-in control:** When scanning an already-checked-in QR code, the server successfully rejects it and responds with `success: false` and message `'Already Present'` (Test ID #18).
3. **Data Sanitization & Limits:** Queries are sanitized automatically. Large request bodies are restricted by size limit configurations in `app.js`.
