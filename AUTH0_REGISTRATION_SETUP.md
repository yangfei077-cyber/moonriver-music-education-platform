# Auth0 Registration Setup Guide

This guide will help you enable user registration in your Auth0 application.

## 🔧 Auth0 Dashboard Configuration

### 1. Enable Signup in Auth0 Dashboard

1. **Login to Auth0 Dashboard**
   - Go to [auth0.com](https://auth0.com) and login
   - Navigate to your application

2. **Configure Database Connection**
   - Go to **Authentication > Database > Username-Password-Authentication**
   - Click on the database connection name
   - Scroll down to **Settings**
   - Set **"Disable Sign Ups"** to `false` (this enables registration)

3. **Configure Password Policy**
   - In the same settings page, configure password strength requirements
   - Set minimum password length (recommended: 8 characters)
   - Enable/disable password complexity requirements

### 2. Configure Application Settings

1. **Allowed Callback URLs**
   - Go to **Applications > Settings**
   - Add these callback URLs:
     ```
     http://localhost:3000/api/auth/callback
     https://yourdomain.com/api/auth/callback
     ```

2. **Allowed Logout URLs**
   - Add these logout URLs:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```

3. **Allowed Web Origins**
   - Add these web origins:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```

### 3. Email Configuration (Optional)

1. **Configure Email Provider**
   - Go to **Branding > Email Templates**
   - Choose an email provider (SendGrid, Mandrill, etc.)
   - Configure SMTP settings

2. **Customize Email Templates**
   - **Welcome Email**: Customize the welcome message for new users
   - **Verification Email**: Configure email verification flow
   - **Password Reset**: Set up password reset emails

### 4. User Metadata and Roles

1. **Configure User Metadata**
   - Go to **User Management > Users**
   - You can add custom metadata for user roles
   - The application automatically assigns roles based on email domain

2. **Role Assignment Logic**
   - `admin@moonriver.com` → Admin role
   - `educator@moonriver.com` → Educator role
   - `student@moonriver.com` → Student role
   - Other emails → Student role (default)

## 🚀 Testing Registration

### 1. Test Registration Flow

1. **Start your application**
   ```bash
   npm run dev
   ```

2. **Navigate to registration**
   - Go to `http://localhost:3000/auth`
   - Click "Create Account with Auth0"
   - Or go directly to `http://localhost:3000/api/auth/register`

3. **Create a test account**
   - Use a real email address
   - Follow the registration flow
   - Check your email for verification (if enabled)

### 2. Test User Roles

1. **Create test users with different roles**
   - `admin@moonriver.com` - Will get admin access
   - `educator@moonriver.com` - Will get educator access
   - `student@moonriver.com` - Will get student access
   - `your-email@gmail.com` - Will get student access (default)

## 🔐 Security Considerations

### 1. Password Policy
- Enable strong password requirements
- Consider requiring special characters and numbers
- Set appropriate password expiration policies

### 2. Email Verification
- Enable email verification for new accounts
- Configure verification email templates
- Set verification link expiration

### 3. Rate Limiting
- Enable rate limiting for login attempts
- Configure account lockout policies
- Monitor for suspicious activity

### 4. Multi-Factor Authentication (Optional)
- Enable MFA for enhanced security
- Configure SMS or authenticator app options
- Require MFA for admin accounts

## 📱 Application Integration

### 1. Registration Endpoints

The application now supports these Auth0 endpoints:

- **Login**: `/api/auth/login`
- **Register**: `/api/auth/register`
- **Logout**: `/api/auth/logout`
- **Callback**: `/api/auth/callback`

### 2. User Interface

- **Landing Page**: `/landing` - Marketing page with registration links
- **Auth Page**: `/auth` - Dedicated login/register page
- **Dashboard**: `/` - Main application (requires authentication)

### 3. Role-Based Access

The application automatically:
- Assigns roles based on email domain
- Redirects users to appropriate dashboard sections
- Enforces role-based permissions throughout the app

## 🛠️ Troubleshooting

### Common Issues

1. **"Sign up is disabled"**
   - Check Auth0 Dashboard > Authentication > Database settings
   - Ensure "Disable Sign Ups" is set to `false`

2. **Callback URL mismatch**
   - Verify callback URLs in Auth0 Dashboard
   - Check that URLs match exactly (including protocol)

3. **Email verification issues**
   - Check email provider configuration
   - Verify SMTP settings
   - Check spam folder for verification emails

4. **Role assignment not working**
   - Check the `afterCallback` function in `[...auth0].ts`
   - Verify email domain matching logic
   - Check user metadata in Auth0 Dashboard

### Debug Mode

Enable debug logging by adding to your `.env.local`:
```
AUTH0_DEBUG=true
```

## 📚 Additional Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Next.js Auth0 SDK](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Auth0 Dashboard](https://manage.auth0.com/)

## 🎯 Next Steps

After enabling registration:

1. Test the complete user flow
2. Configure email templates
3. Set up monitoring and analytics
4. Consider implementing user onboarding
5. Configure advanced security features

Your Auth0 registration is now fully integrated with the Music Education Platform! 🎵
