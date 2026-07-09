# Android Studio APK Generation Troubleshooting Guide

## Problem: "Generate APK/Bundle" is greyed out in Android Studio

This is a common issue that can be caused by several factors. Follow this guide to diagnose and fix the problem.

## Quick Fix Steps

### 1. Fix Java Configuration (Most Common Issue)

**Problem**: You're using an old Java version (Java 1.7) but Gradle 8.11.1 requires Java 1.8 or later.

**Solution**: Run the Java configuration fix script as Administrator:

```powershell
# Right-click PowerShell and select "Run as Administrator"
powershell -ExecutionPolicy Bypass -File scripts/fix-java-config.ps1
```

### 2. Verify Java Installation

Run the Java verification script to check your current setup:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-java.ps1
```

### 3. Fix Android Studio Configuration

Run the Android Studio fix script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/fix-android-studio.ps1
```

## Manual Steps

### Step 1: Check Java Version

1. Open Command Prompt or PowerShell
2. Run: `java -version`
3. Ensure you're using Java 11 or higher (preferably Java 17 or 24)

### Step 2: Set JAVA_HOME

1. Open System Properties > Environment Variables
2. Add or update JAVA_HOME:
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Java\jdk-24`

### Step 3: Update PATH

1. In Environment Variables, find the PATH variable
2. Add `C:\Program Files\Java\jdk-24\bin` at the beginning
3. Remove any old Java paths

### Step 4: Restart Android Studio

1. Close Android Studio completely
2. Restart your computer (to ensure environment variables are loaded)
3. Open Android Studio again
4. Open the `mobile-build/android` folder as a project

### Step 5: Sync Gradle

1. In Android Studio, go to File > Sync Project with Gradle Files
2. Wait for the sync to complete
3. Check the Build tab for any errors

### Step 6: Generate APK

1. Go to Build > Generate Signed Bundle / APK
2. Select "APK" or "Android App Bundle"
3. Choose "debug" build variant
4. Use the debug keystore (already configured in the project)

## Common Issues and Solutions

### Issue 1: Gradle Sync Fails

**Symptoms**: Red error messages in the Build tab

**Solutions**:
- Check Java version (must be 1.8 or higher)
- Clear Gradle cache: File > Invalidate Caches and Restart
- Update Gradle wrapper if needed

### Issue 2: Missing Signing Configuration

**Symptoms**: "Generate Signed Bundle/APK" is greyed out

**Solutions**:
- The project now includes debug signing configuration
- Ensure you're opening the correct project folder (`mobile-build/android`)

### Issue 3: Build Variants Not Available

**Symptoms**: No build variants shown in the Build Variants panel

**Solutions**:
- Sync project with Gradle files
- Check that the project structure is correct
- Ensure all Gradle files are properly configured

### Issue 4: Memory Issues

**Symptoms**: OutOfMemoryError during build

**Solutions**:
- Increase Gradle memory in `gradle.properties`:
  ```
  org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
  ```

## Project Structure

Ensure your project structure looks like this:

```
sunrise-2025/
├── mobile-build/
│   ├── android/
│   │   ├── app/
│   │   │   ├── build.gradle
│   │   │   └── debug.keystore
│   │   ├── build.gradle
│   │   ├── gradle.properties
│   │   └── variables.gradle
│   └── capacitor.config.ts
└── scripts/
    ├── fix-android-studio.ps1
    ├── fix-java-config.ps1
    └── verify-java.ps1
```

## Verification Checklist

- [ ] Java version is 11 or higher
- [ ] JAVA_HOME is set correctly
- [ ] PATH includes Java bin directory
- [ ] Android Studio is opened with the correct project folder
- [ ] Gradle sync completed successfully
- [ ] Debug keystore exists
- [ ] Build variants are available
- [ ] No red error messages in Build tab

## Still Having Issues?

If you're still experiencing problems:

1. Check the Android Studio Event Log for specific error messages
2. Look at the Build tab for detailed error information
3. Try running the build from command line:
   ```bash
   cd mobile-build/android
   ./gradlew assembleDebug
   ```
4. Check the Gradle console for any warnings or errors

## Support

If none of these solutions work, please provide:
- Your Java version (`java -version`)
- Your JAVA_HOME setting
- Any error messages from Android Studio
- The contents of the Build tab 