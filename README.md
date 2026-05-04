# SamAuth

A custom OpenID Connect (OIDC) and OAuth 2.0 implementation built from scratch using TypeScript, Express, PostgreSQL, and Drizzle ORM. This project demonstrates a complete authorization code flow with email/password user authentication, client registration, and JWT-based token management.

## Features

- OIDC discovery endpoint (.well-known/openid-configuration)
- JWKS (JSON Web Key Set) endpoint for public key distribution
- User registration and email/password authentication
- OAuth 2.0 authorization code flow
- JWT-based access tokens and ID tokens
- Refresh token support with token rotation
- User info endpoint with scope-based claim filtering
- Session management via httpOnly cookies
- Zod-based request validation
- EJS-based consent and authentication UI
- PostgreSQL database with Drizzle ORM migrations

## Local Setup

### Prerequisites

- Node.js & npm
- Docker
- Git

### Installation

1. Clone the repository

```bash
git clone https://github.com/sameerbhagtani/sam-auth.git
cd sam-auth
```

2. Install dependencies

```bash
npm install
```

3. Start the database (using Docker)

```bash
npm run db:up
```

4. Run database migrations

```bash
npm run db:migrate
```

5. Set up environment variables

```bash
cp .env.example .env
```

Edit .env and configure it as per example.

6. Generate RSA keypair for JWT signing

```bash
bash generate-keys.sh
```

This creates cert/private-key.pem and cert/public-key.pub.

7. Start the development server

```bash
npm run dev
```

The server will run on http://localhost:3000.

## API Endpoints

### Discovery and JWKS

#### GET /.well-known/openid-configuration

Returns the OpenID Connect discovery document with endpoint URLs and metadata.

Response:

```json
{
    "issuer": "http://localhost:3000",
    "authorization_endpoint": "http://localhost:3000/authorize",
    "token_endpoint": "http://localhost:3000/token",
    "userinfo_endpoint": "http://localhost:3000/userinfo",
    "jwks_uri": "http://localhost:3000/.well-known/jwks.json"
}
```

#### GET /.well-known/jwks.json

Returns the JSON Web Key Set containing the public key for JWT verification.

### Authentication

#### GET /auth/register

Serves the user registration page. Requires authorization code flow parameters in the query string.

Query Parameters:

- client_id (required): The client application identifier
- redirect_uri (required): The registered redirect URI for the client
- scope (required): Space-separated scopes (must include "openid")
- response_type (required): Must be "code"
- state (required): An opaque value to maintain state between request and callback

#### POST /auth/register

Registers a new user and initiates the authorization flow.

Request Body:

```json
{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "client_id": "client_123",
    "redirect_uri": "http://localhost:3001/callback",
    "scope": "openid profile email",
    "response_type": "code",
    "state": "random_state_value"
}
```

Response on success:

```json
{
    "success": true,
    "redirectUrl": "/authorize?client_id=client_123&redirect_uri=..."
}
```

On error:

```json
{
    "success": false,
    "message": "User already exists"
}
```

#### GET /auth/login

Serves the user login page. Requires authorization code flow parameters in the query string.

Query Parameters: Same as GET /auth/register

#### POST /auth/login

Authenticates a user with email and password.

Request Body:

```json
{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "client_id": "client_123",
    "redirect_uri": "http://localhost:3001/callback",
    "scope": "openid profile email",
    "response_type": "code",
    "state": "random_state_value"
}
```

Response on success:

```json
{
    "success": true,
    "redirectUrl": "/authorize?client_id=client_123&redirect_uri=..."
}
```

Sets an httpOnly cookie with the session token.

### Authorization

#### GET /authorize

Retrieves or displays the authorization endpoint. If the user is not authenticated, returns the login page. If authenticated, returns the consent screen.

Query Parameters:

- client_id (required): The client application identifier
- redirect_uri (required): The redirect URI where the authorization code will be sent
- scope (required): Space-separated scopes (must include "openid")
- response_type (required): Must be "code"
- state (required): An opaque value for CSRF protection

Response: HTML login form or HTML consent screen

#### POST /authorize

Issues an authorization code after user consent.

Request Body:

```json
{
    "client_id": "client_123",
    "redirect_uri": "http://localhost:3001/callback",
    "scope": "openid profile email",
    "response_type": "code",
    "state": "random_state_value"
}
```

Response: Redirect to redirect_uri with authorization code and state

```
http://localhost:3001/callback?code=<32_byte_hex_code>&state=random_state_value
```

### Token Exchange

#### POST /token

Exchanges an authorization code for tokens or refreshes an access token.

Grant Type 1: authorization_code

Request Body:

```json
{
    "grant_type": "authorization_code",
    "code": "<authorization_code_from_callback>",
    "client_id": "client_123",
    "client_secret": "secret_key",
    "redirect_uri": "http://localhost:3001/callback"
}
```

Response:

```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "id_token": "eyJhbGciOiJSUzI1NiIs...",
    "refresh_token": "random_refresh_token",
    "token_type": "Bearer",
    "expires_in": 3600
}
```

Grant Type 2: refresh_token

Request Body:

```json
{
    "grant_type": "refresh_token",
    "refresh_token": "<refresh_token_from_previous_response>",
    "client_id": "client_123",
    "client_secret": "secret_key"
}
```

Response: Same as authorization_code (new access_token, id_token, and rotated refresh_token)

### User Info

#### GET /userinfo

Returns authenticated user information based on the scopes granted in the authorization request.

Headers:

```
Authorization: Bearer <access_token>
```

Response with scope "openid profile email":

```json
{
    "sub": "1",
    "name": "John Doe",
    "given_name": "John",
    "family_name": "Doe",
    "email": "john@example.com",
    "email_verified": true
}
```

Response with scope "openid" only:

```json
{
    "sub": "1"
}
```

## Authorization Flow

### Step 1: User Initiates Login

The user clicks "Sign in with SamAuth" on the client application. The client redirects to the authorization endpoint:

```
GET http://localhost:3000/authorize?
  client_id=client_123&
  redirect_uri=http://localhost:3001/callback&
  scope=openid%20profile%20email&
  response_type=code&
  state=abc123xyz
```

### Step 2: Authentication

If the user is not authenticated, the server returns the login page. The user enters their email and password.

```
POST /auth/login
Body: {
  "email": "john@example.com",
  "password": "SecurePass123!",
  "client_id": "client_123",
  "redirect_uri": "http://localhost:3001/callback",
  "scope": "openid profile email",
  "response_type": "code",
  "state": "abc123xyz"
}
```

The server validates credentials, creates a session, and returns a JSON response with the authorize redirect URL.

### Step 3: Consent

If the user is authenticated, the server displays a consent screen showing the requested scopes and the client name.

The user reviews and clicks "Approve" to grant access.

```
POST /authorize
Body: {
  "client_id": "client_123",
  "redirect_uri": "http://localhost:3001/callback",
  "scope": "openid profile email",
  "response_type": "code",
  "state": "abc123xyz"
}
```

### Step 4: Authorization Code Issued

The server validates the client and redirect URI, generates a 32-byte random authorization code, stores it with a 10-minute expiry, and redirects the browser:

```
HTTP 302 Redirect to:
http://localhost:3001/callback?code=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6&state=abc123xyz
```

### Step 5: Token Exchange

The client application exchanges the code for tokens:

```
POST http://localhost:3000/token
Content-Type: application/json
Body: {
  "grant_type": "authorization_code",
  "code": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "client_id": "client_123",
  "client_secret": "secret_key",
  "redirect_uri": "http://localhost:3001/callback"
}
```

The server validates the code, verifies credentials, deletes the code (one-time use), and returns tokens:

```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6",
    "token_type": "Bearer",
    "expires_in": 3600
}
```

### Step 6: Access Protected Resources

The client uses the access_token to retrieve user information:

```
GET http://localhost:3000/userinfo
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

The server verifies the JWT, decodes it, and returns user claims filtered by scope:

```json
{
    "sub": "1",
    "name": "John Doe",
    "given_name": "John",
    "family_name": "Doe",
    "email": "john@example.com",
    "email_verified": true
}
```

### Step 7: Token Refresh

When the access_token expires, the client uses the refresh_token to obtain a new one:

```
POST http://localhost:3000/token
Content-Type: application/json
Body: {
  "grant_type": "refresh_token",
  "refresh_token": "x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6",
  "client_id": "client_123",
  "client_secret": "secret_key"
}
```

The server validates the refresh_token, marks the old one as revoked, and issues a new token set.

## Database Schema

### users

- id: Primary key (serial)
- firstName: User first name (required)
- lastName: User last name (optional)
- email: User email (required, unique)
- emailVerified: Email verification status (boolean)
- passwordHash: Bcrypt hash of password
- profileImageURL: User profile picture URL (optional)
- deletedAt: Soft delete timestamp
- createdAt: Account creation timestamp
- updatedAt: Last update timestamp

### clients

- id: Primary key (serial)
- name: Client application name
- clientId: Public client identifier (unique)
- clientSecretHash: Bcrypt hash of client secret
- redirectUris: Array of registered redirect URIs
- allowedScopes: Array of scopes this client can request
- deletedAt: Soft delete timestamp
- createdAt: Registration timestamp
- updatedAt: Last update timestamp

### authSessions

- id: Primary key (serial)
- sessionTokenHash: SHA256 hash of session token (unique)
- userId: Foreign key to users
- expiresAt: Session expiration timestamp
- createdAt: Session creation timestamp

### authorizationCodes

- code: Authorization code (primary key, unique)
- userId: Foreign key to users
- clientId: Foreign key to clients
- redirectUri: Redirect URI for this authorization
- scopes: Array of granted scopes
- expiresAt: Code expiration (10 minutes)
- createdAt: Code creation timestamp

### refreshTokens

- id: Primary key (serial)
- tokenHash: SHA256 hash of refresh token (unique)
- userId: Foreign key to users
- clientId: Foreign key to clients
- grantedScopes: Array of scopes this token grants
- expiresAt: Token expiration (30 days)
- revokedAt: Revocation timestamp (null if active)
- createdAt: Token creation timestamp
