# Settings Components - Profile and Avatar Management

This directory contains the implementation for Task 2: Profile and Avatar Management from the settings interface specification.

## Components

### AvatarUpload
**Location:** `src/components/settings/AvatarUpload.tsx`

Handles user avatar upload with crop/resize functionality and initials fallback.

**Features:**
- Image upload with file type validation (JPEG, PNG, WebP)
- File size validation (max 5MB)
- Interactive image cropping with circular preview
- Automatic resize to 200x200 pixels
- Initials-based fallback when no avatar is set
- Remove avatar functionality

**Props:**
```typescript
interface AvatarUploadProps {
  currentAvatar?: string
  userName: string
  onUpload: (file: File) => Promise<string>
  onRemove: () => Promise<void>
}
```

### ProfileForm
**Location:** `src/components/settings/ProfileForm.tsx`

Form for editing user profile information with auto-save and validation.

**Features:**
- Auto-save with 500ms debounce
- Real-time validation
- Read-only fields for email and role
- Role badge display with color coding
- Manual save button as fallback
- Save status indicator (Saving/Saved/Error)

**Props:**
```typescript
interface ProfileFormProps {
  profile: UserProfile
  onUpdate: (data: Partial<UserProfile>) => Promise<void>
}
```

**Editable Fields:**
- Full Name (required, 2-100 characters)
- Employee ID (optional)
- Department (optional)
- Phone Number (optional, E.164 format)
- Work Location (optional)

**Read-only Fields:**
- Email Address
- Role (displayed as badge)

### ProfileSettings
**Location:** `src/components/settings/ProfileSettings.tsx`

Container component that combines AvatarUpload and ProfileForm.

**Features:**
- Fetches user profile data
- Handles avatar upload/removal
- Handles profile updates
- Loading and error states
- Responsive layout with cards

**Props:**
```typescript
interface ProfileSettingsProps {
  userId: string
}
```

## API Endpoints

### GET /api/users/profile
Retrieves the current user's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "UserRole",
    "avatar": "string?",
    "employeeId": "string?",
    "department": "string?",
    "phoneNumber": "string?",
    "workLocation": "string?",
    "isActive": boolean,
    "createdAt": "Date",
    "updatedAt": "Date"
  }
}
```

### PATCH /api/users/profile
Updates the current user's profile information.

**Request Body:**
```json
{
  "name": "string",
  "employeeId": "string?",
  "department": "string?",
  "phoneNumber": "string?",
  "workLocation": "string?"
}
```

**Features:**
- Validates input using Zod schema
- Creates audit log entry
- Returns updated profile

### POST /api/users/avatar
Uploads and processes a new avatar image.

**Request:** FormData with 'avatar' file

**Features:**
- Validates file type and size
- Processes image with Sharp (resize to 200x200)
- Saves to `/public/uploads/avatars/`
- Deletes old avatar file
- Creates audit log entry

**Response:**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "/uploads/avatars/filename.jpg"
  }
}
```

### DELETE /api/users/avatar
Removes the current user's avatar.

**Features:**
- Removes avatar from user preferences
- Deletes avatar file from filesystem
- Creates audit log entry

## Data Storage

### User Preferences
Profile data is stored in the User model's `preferences` JSON field:

```typescript
{
  avatar: string?,
  employeeId: string?,
  department: string?,
  phoneNumber: string?,
  workLocation: string?,
  // ... other preferences
}
```

### Avatar Files
Avatar images are stored in:
- **Directory:** `/public/uploads/avatars/`
- **Format:** `{userId}-{timestamp}.jpg`
- **Size:** 200x200 pixels
- **Quality:** 90% JPEG

## Validation

### Profile Validation
- **Name:** 2-100 characters, required
- **Phone:** E.164 format (e.g., +1234567890), optional
- **Employee ID:** Alphanumeric, optional
- **Other fields:** Optional text

### Avatar Validation
- **File Types:** JPEG, PNG, WebP
- **Max Size:** 5MB
- **Output:** 200x200 JPEG at 90% quality

## Dependencies

- **react-image-crop:** Interactive image cropping
- **sharp:** Server-side image processing
- **react-hot-toast:** Toast notifications
- **zod:** Schema validation

## Usage Example

```tsx
import { ProfileSettings } from '@/components/settings/ProfileSettings'

export default function SettingsPage() {
  const { data: session } = useSession()
  
  return (
    <div>
      {session?.user?.id && (
        <ProfileSettings userId={session.user.id} />
      )}
    </div>
  )
}
```

## Audit Logging

All profile and avatar changes are logged to the AuditLog table with:
- User ID
- Action type (UPDATE)
- Entity type (User)
- Old and new values
- IP address and user agent
- Timestamp

## Security Considerations

1. **Authentication:** All endpoints require valid session
2. **Authorization:** Users can only modify their own profile
3. **File Validation:** Strict file type and size checks
4. **Path Security:** Avatar files use user ID in filename
5. **Audit Trail:** All changes are logged

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **2.1:** Profile form with all required fields
- **2.2:** Name validation (2-100 characters)
- **2.5:** Profile update with success notification
- **2.6:** Error handling with failure messages
- **3.1:** Avatar display with initials fallback
- **3.2:** Image upload with crop/resize
- **3.4:** Remove avatar functionality
- **3.5:** Avatar updates across interface

## Future Enhancements

- Image optimization (WebP format)
- Multiple avatar sizes (thumbnail, medium, large)
- Avatar history/rollback
- Drag-and-drop upload
- Webcam capture option
