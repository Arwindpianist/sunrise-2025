# Contact Import Methods

This document explains the different ways users can import contacts into the Sunrise 2025 app.

## Available Import Methods

### 1. Native Contact Access (Contacts API)

**What it does:** Directly accesses the user's phone contacts through the browser's native Contacts API.

**How it works:**
- Opens the device's native contact picker
- User selects which contacts to import
- Contacts are imported directly without file upload

**Browser Support:**
- ✅ **Chrome/Edge (Android):** Full support (HTTPS required)
- ✅ **Safari (iOS):** Full support (HTTPS required)
- ❌ **Desktop browsers:** Not supported
- ❌ **Firefox:** Limited support
- ❌ **HTTP sites:** Not supported (HTTPS required)

**User Experience:**
- Most seamless experience
- No file preparation needed
- Direct access to phone contacts
- User maintains full control over which contacts to import

**Privacy:** User explicitly grants permission and selects specific contacts.

### 2. Web Share API

**What it does:** Opens the device's share menu to share contacts from the user's contacts app.

**How it works:**
- Triggers the native share dialog
- User selects their contacts app
- Contacts are shared via the system's share mechanism

**Browser Support:**
- ✅ **Chrome/Edge (Android):** Full support (HTTPS required)
- ✅ **Safari (iOS):** Full support (HTTPS required)
- ❌ **Desktop browsers:** Limited support
- ❌ **Firefox:** Limited support
- ❌ **HTTP sites:** Not supported (HTTPS required)

**User Experience:**
- Familiar sharing interface
- Works with any contacts app
- Requires user to manually share contacts

**Privacy:** User controls what and how to share through their device's share interface.

### 3. File Upload (VCF/CSV)

**What it does:** Allows users to upload contact files in VCF (vCard) or CSV format.

**How it works:**
- User exports contacts from their phone/contacts app
- Uploads the exported file
- App parses and imports the contacts

**Browser Support:**
- ✅ **All browsers:** Full support
- ✅ **All devices:** Works everywhere

**User Experience:**
- Requires manual export from contacts app
- Works on all devices and browsers
- More steps but guaranteed to work

**Privacy:** User controls exactly what data is exported and uploaded.

### 4. Google OAuth Import

**What it does:** Imports contacts directly from Google Contacts using OAuth.

**How it works:**
- User authorizes the app to access their Google account
- App fetches contacts from Google People API
- Contacts are imported automatically

**Browser Support:**
- ✅ **All browsers:** Full support
- ✅ **All devices:** Works everywhere

**User Experience:**
- One-click import from Google
- Automatic categorization based on organization data
- Requires Google account

**Privacy:** User grants permission to access Google contacts through OAuth.

## Implementation Details

### Native Contact Access

```javascript
// Check if Contacts API is supported
if ('contacts' in navigator) {
  const contacts = await navigator.contacts.select(
    ['name', 'email', 'tel'],
    { multiple: true }
  )
}
```

### Web Share API

```javascript
// Check if Web Share API is supported
if ('share' in navigator) {
  await navigator.share({
    title: 'Import Contacts',
    text: 'Please share your contacts with this app',
    url: window.location.href
  })
}
```

### File Upload

```javascript
// Handle VCF/CSV file upload
const file = event.target.files[0]
const formData = new FormData()
formData.append('file', file)
formData.append('category', selectedCategory)

const response = await fetch('/api/contacts/import/phone', {
  method: 'POST',
  body: formData
})
```

## Fallback Strategy

The app implements a smart fallback strategy:

1. **First choice:** Native Contact Access (if supported)
2. **Second choice:** Web Share API (if supported)
3. **Third choice:** File Upload (always available)
4. **Alternative:** Google OAuth Import (always available)

## Security Considerations

- **Native APIs:** Require explicit user permission
- **File uploads:** Validated for file type and content
- **OAuth:** Uses secure OAuth 2.0 flow
- **Data processing:** All contact data is validated before storage

## User Guidance

### For Mobile Users:
1. Try "Native Contact Access" first (most convenient)
2. If not available, use "Share Contacts" 
3. As fallback, export contacts as VCF and upload

### For Desktop Users:
1. Use Google OAuth import if you have Google contacts
2. Export contacts from your phone/contacts app as VCF
3. Upload the VCF file

### For All Users:
- Google OAuth import is always available as an alternative
- File upload works on all devices and browsers
- All methods preserve user privacy and control

## Troubleshooting

### "Native Contact Access Not Supported"
- This is normal on desktop browsers or HTTP sites
- Requires HTTPS and mobile browser
- Use file upload or Google import instead

### "Share Contacts Not Working"
- May not be supported in your browser
- Requires HTTPS and mobile browser
- Try file upload method instead

### "File Upload Failed"
- Ensure file is in VCF or CSV format
- Check file size (should be under 10MB)
- Verify file contains valid contact data

### "Google Import Failed"
- Check internet connection
- Ensure Google account has contacts
- Try refreshing the page and retrying 