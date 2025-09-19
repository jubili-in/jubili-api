# Google OAuth Setup Guide

## Required Environment Variables

Add these to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/users/auth/google/callback

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=http://localhost:3000

# JWT Secret (if not already set)
JWT_SECRET=your_jwt_secret_here
```

## Google Console Configuration

In your Google Console OAuth Client configuration, make sure you have these redirect URIs:

### For Development:
- `http://localhost:8000/api/users/auth/google/callback`

### For Production:
- `https://yourdomain.com/api/users/auth/google/callback`

## API Endpoints

### 1. Initiate Google OAuth
**GET** `/api/users/auth/google`
- Redirects user to Google OAuth consent screen

### 2. Handle OAuth Callback
**GET** `/api/users/auth/google/callback`
- Handles the callback from Google
- Creates/logs in user
- Redirects to frontend with success/error

## Frontend Integration

### HTML Button
```html
<a href="http://localhost:8000/api/users/auth/google" class="google-oauth-btn">
  Sign in with Google
</a>
```

### JavaScript
```javascript
// Redirect to Google OAuth
function loginWithGoogle() {
  window.location.href = 'http://localhost:8000/api/users/auth/google';
}
```

## Success/Error Handling

After OAuth completion, users will be redirected to:
- Success: `${FRONTEND_URL}/login-success?token=${jwt_token}`
- Error: `${FRONTEND_URL}/login-error?message=${error_message}`

Handle these routes in your frontend application to:
1. Extract the JWT token from URL parameters
2. Store it (localStorage, cookies, etc.)
3. Redirect user to appropriate page

## User Data Structure

Google OAuth users will be stored with:
```javascript
{
  userId: "uuid",
  name: "User Full Name",
  email: "user@gmail.com",
  googleId: "google_user_id",
  picture: "profile_picture_url",
  authProvider: "google",
  isEmailVerified: true,
  createdAt: "ISO_timestamp",
  updatedAt: "ISO_timestamp"
}
```

## Testing

1. Start your server: `npm run dev`
2. Visit: `http://localhost:8000/api/users/auth/google`
3. Complete Google OAuth flow
4. Check if user is created in your DynamoDB Users table
