# MoonRiver Platform - Auth0 Setup Guide

## 🚀 Quick Start with Real Auth0

### 1. Create Auth0 Application

1. **Sign up for Auth0**: Go to [auth0.com](https://auth0.com) and create a free account
2. **Create Application**: 
   - Go to Applications → Create Application
   - Name: "MoonRiver Platform"
   - Type: "Regular Web Application"
   - Click Create

### 2. Configure Application Settings

**Basic Information:**
- **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
- **Allowed Logout URLs**: `http://localhost:3000`
- **Allowed Web Origins**: `http://localhost:3000`
- **Allowed Origins (CORS)**: `http://localhost:3000`

**Advanced Settings:**
- **Grant Types**: Authorization Code, Refresh Token
- **Token Endpoint Authentication Method**: POST

### 3. Set Up Social Connections (Optional)

**Google Login:**
1. Go to Authentication → Social
2. Click on Google
3. Enable the connection
4. Add your Google OAuth credentials

**GitHub Login:**
1. Go to Authentication → Social  
2. Click on GitHub
3. Enable the connection
4. Add your GitHub OAuth credentials

### 4. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Generate AUTH0_SECRET with: openssl rand -hex 32
AUTH0_SECRET='your-32-character-secret'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'

# Token Vault Configuration
TOKEN_VAULT_SECRET='your-token-vault-secret-key'

# Auth0 Management API (for user management)
AUTH0_MANAGEMENT_CLIENT_ID='your-management-client-id'
AUTH0_MANAGEMENT_CLIENT_SECRET='your-management-client-secret'
AUTH0_MANAGEMENT_AUDIENCE='https://your-domain.auth0.com/api/v2/'
```

### 5. Set Up Management API (For User Management)

1. **Create Management API Application**:
   - Go to Applications → Create Application
   - Name: "MoonRiver Management API"
   - Type: "Machine to Machine"
   - Authorize for: "Auth0 Management API"
   - Scopes: Select all scopes (or at minimum: `read:users`, `update:users`)

2. **Get Management API Credentials**:
   - Copy the Client ID and Client Secret
   - Add them to your `.env.local` file

### 6. Create Test Users

**Option 1: Create users in Auth0 Dashboard**
1. Go to User Management → Users
2. Click "Create User"
3. Create users with emails:
   - `admin@moonriver.com`
   - `educator@moonriver.com` 
   - `student@moonriver.com`

**Option 2: Use Social Login**
- Users can sign up with Google, GitHub, or other social providers
- They'll automatically get "student" role by default

### 7. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and click "Login with Auth0"

## 🔧 Features Implemented

### ✅ Real Auth0 Authentication
- **Email/Password Login**: Users can sign up and login with email
- **Social Login**: Google, GitHub, and other providers
- **Secure Sessions**: JWT tokens with proper validation
- **Logout**: Secure logout with return URL

### ✅ User Management (Admin Only)
- **View All Users**: See all registered users
- **Role Assignment**: Assign admin, educator, or student roles
- **User Statistics**: Track user counts by role
- **Real-time Updates**: Refresh user list

### ✅ Role-Based Access Control
- **Admin**: Full system access, user management
- **Educator**: Course management, student oversight
- **Student**: Course access, progress tracking

### ✅ Token Vault Integration
- **Encrypted Storage**: AES-256-GCM encryption
- **User-Scoped**: Each user sees only their tokens
- **Secure API**: Protected endpoints

### ✅ Fine-Grained Authorization
- **Data Filtering**: Users see only data they're authorized for
- **API Protection**: Role-based API access
- **Context Awareness**: Different views per role

## 🎯 Auth0 Challenge Compliance

This implementation demonstrates all three required pillars:

1. **🔐 User Authentication**: Real Auth0 integration with social login
2. **🗝️ Token Vault**: Secure encrypted token management
3. **🛡️ Fine-Grained Auth**: Role-based access control and data filtering

## 🧪 Testing

1. **Login as Admin**: Full access to user management
2. **Login as Educator**: Course and student management
3. **Login as Student**: Course access and progress
4. **Social Login**: Test with Google/GitHub accounts
5. **Role Assignment**: Admin can change user roles
6. **Token Vault**: Secure token storage and retrieval
7. **Fine-Grained Auth**: Different data views per role

## 🚀 Production Deployment

For production deployment:

1. **Update Auth0 URLs**: Change to your production domain
2. **Environment Variables**: Set production Auth0 credentials
3. **HTTPS**: Ensure all URLs use HTTPS
4. **Domain Configuration**: Update Auth0 application settings

The platform is now ready for the Auth0 for AI Agents Challenge with real authentication!
