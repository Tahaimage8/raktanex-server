# Raktanex Server

Backend API for Raktanex - a blood donation and fund management service.

## Overview

This is a small Express.js API that provides endpoints for donors, donation requests, and fund management. It uses MongoDB for persistence and JWT verification via a remote JWKS endpoint.

## Features

- Public endpoints for listing donors and donation requests
- Role-protected admin/volunteer operations (update/delete/request management)
- Fund creation and total calculation
- JWT verification using a remote JWKS (CLIENT_URL + /api/auth/jwks)

## Requirements

- Node.js 18+ (or compatible)
- MongoDB (remote or local)

## Environment

Create a .env file in the project root with at least the following variables:

- MONGO_DB_URI — MongoDB connection string
- CLIENT_URL — URL of the client that exposes /api/auth/jwks for JWT verification

## Install

```bash
npm install
```

## Run

Start the server:

```bash
npm start
```

The server listens on port 5000 by default.

## Important endpoints (summary)

- GET / — health check (returns "Hello World!")
- GET /api/donors — list active donors (supports filters: bloodGroup, district, upazila, name)
- GET /api/donation-requests — list donation requests
- POST /api/donation-request — create donation request (protected)
- PATCH /api/donation-requests/:id/donate — confirm donation for a request
- GET /api/funds — get funds
- POST /api/funds — create fund entry
- Admin routes: /api/admin/* require admin/volunteer role and JWT verification

## Notes

- Authentication: requests using verifyToken expect an Authorization: Bearer <token> header. JWTs are verified against the remote JWKS at ${CLIENT_URL}/api/auth/jwks.
- The code depends on jose-cjs, mongodb, express, cors, and dotenv (see package.json).

## Deployment

- A vercel.json file exists — when deploying to Vercel make sure to set MONGO_DB_URI and CLIENT_URL in the Vercel environment settings.

## License

ISC
