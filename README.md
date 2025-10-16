# MoonRiver Platform - Auth0 for AI Agents Challenge

## Overview
This is a music education platform demonstrating the three core Auth0 AI pillars:
1. **User Authentication** - Secure the human prompting the agent
2. **Token Vault** - Control tools & API access  
3. **Fine-Grained Auth** - Limit knowledge & RAG access

## Test Accounts

### Admin Account
- **Email:** admin@moonriver.com
- **Password:** Admin123!
- **Role:** Admin
- **Permissions:** Full system access, user management, course management

### Educator Account  
- **Email:** educator@moonriver.com
- **Password:** Educator123!
- **Role:** Educator
- **Permissions:** Course creation/editing, student management, progress tracking

### Student Account
- **Email:** student@moonriver.com
- **Password:** Student123!
- **Role:** Student
- **Permissions:** Course enrollment, lesson completion, progress viewing

## Features Demonstrated

### 1. User Authentication (Pillar 1)
- Secure login/logout with Auth0
- Role-based session management
- Protected routes and API endpoints
- Session persistence and security

### 2. Token Vault (Pillar 2)
- Encrypted token storage using AES-256-GCM
- User-scoped token management
- Secure token retrieval and usage tracking
- Token lifecycle management (create, read, delete)

### 3. Fine-Grained Authorization (Pillar 3)
- Role-based data filtering
- Permission-based API access control
- Context-aware data visibility
- Secure action authorization

## Music Education Features

### Course Management
- Create and manage music courses
- Lesson tracking and completion
- Progress monitoring
- Multi-level course support (Beginner, Intermediate, Advanced)

### Student Management
- Student enrollment and tracking
- Progress monitoring
- Course completion tracking
- Performance analytics

### Role-Based Access
- **Admin:** Full system access, user management, analytics
- **Educator:** Course management, student oversight, progress tracking
- **Student:** Course access, lesson completion, progress viewing

## Getting Started

1. **Set up Auth0:**
   - Create an Auth0 account
   - Create a new application
   - Configure the application settings
   - Set up the environment variables

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Copy `env.example` to `.env.local`
   - Fill in your Auth0 credentials

4. **Run the application:**
   ```bash
   npm run dev
   ```

5. **Test the application:**
   - Visit `http://localhost:3000`
   - Use the test accounts provided above
   - Explore different features based on your role

## Auth0 Configuration

### Required Environment Variables
```
AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
TOKEN_VAULT_SECRET='your-token-vault-secret-key'
```

### Auth0 Application Settings
- **Application Type:** Regular Web Application
- **Allowed Callback URLs:** `http://localhost:3000/api/auth/callback`
- **Allowed Logout URLs:** `http://localhost:3000`
- **Allowed Web Origins:** `http://localhost:3000`

## Challenge Compliance

This application demonstrates all three required pillars of Auth0 for AI Agents:

✅ **User Authentication** - Secure user login and session management
✅ **Token Vault** - Encrypted token storage and management
✅ **Fine-Grained Auth** - Role-based access control and data filtering

The platform solves real-world problems around secure music education interactions, providing a practical use case for AI agent authentication and authorization.

## Deployment

The application is ready for deployment to platforms like Vercel, Netlify, or any Node.js hosting service. Make sure to update the Auth0 configuration for your production domain.

## Testing Instructions

1. **Login as Admin:**
   - Access user management features
   - View system statistics
   - Manage all courses and students

2. **Login as Educator:**
   - Create and edit courses
   - View student progress
   - Manage course content

3. **Login as Student:**
   - Enroll in courses
   - Complete lessons
   - Track personal progress

4. **Test Token Vault:**
   - Add API tokens securely
   - View encrypted token storage
   - Test token retrieval

5. **Test Fine-Grained Auth:**
   - Verify role-based data access
   - Test permission restrictions
   - Confirm context-aware filtering