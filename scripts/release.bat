@echo off
setlocal enabledelayedexpansion

echo 🚀 Sunrise 2025 Release Script
echo ================================

REM Check if we're on the beta branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
if not "%CURRENT_BRANCH%"=="beta" (
    echo ❌ Error: You must be on the beta branch to release
    echo Current branch: %CURRENT_BRANCH%
    echo Please run: git checkout beta
    pause
    exit /b 1
)

REM Get the version from user
echo.
set /p VERSION="Enter version number (e.g., 1.0.0): "

if "%VERSION%"=="" (
    echo ❌ Error: Version number is required
    pause
    exit /b 1
)

echo.
echo 📋 Release Checklist:
echo =====================
set /p FEATURES_TESTED="1. All features tested and working? (y/n): "
set /p NO_CRITICAL_BUGS="2. No critical bugs present? (y/n): "
set /p TESTS_PASS="3. All tests pass? (y/n): "
set /p DOCS_UPDATED="4. Documentation updated? (y/n): "
set /p ENV_CONFIGURED="5. Environment variables configured? (y/n): "

REM Check all answers
if not "%FEATURES_TESTED%"=="y" (
    echo.
    echo ❌ Release checklist not complete. Please address all items before releasing.
    pause
    exit /b 1
)
if not "%NO_CRITICAL_BUGS%"=="y" (
    echo.
    echo ❌ Release checklist not complete. Please address all items before releasing.
    pause
    exit /b 1
)
if not "%TESTS_PASS%"=="y" (
    echo.
    echo ❌ Release checklist not complete. Please address all items before releasing.
    pause
    exit /b 1
)
if not "%DOCS_UPDATED%"=="y" (
    echo.
    echo ❌ Release checklist not complete. Please address all items before releasing.
    pause
    exit /b 1
)
if not "%ENV_CONFIGURED%"=="y" (
    echo.
    echo ❌ Release checklist not complete. Please address all items before releasing.
    pause
    exit /b 1
)

echo.
echo ✅ Release checklist complete!
echo.

REM Confirm release
set /p CONFIRM_RELEASE="Proceed with release to main? (y/n): "

if not "%CONFIRM_RELEASE%"=="y" (
    echo ❌ Release cancelled
    pause
    exit /b 1
)

echo.
echo 🔄 Starting release process...

REM Switch to main branch
echo 1. Switching to main branch...
git checkout main

REM Merge beta into main
echo 2. Merging beta into main...
git merge beta

REM Create release tag
echo 3. Creating release tag v%VERSION%...
git tag -a "v%VERSION%" -m "Release version %VERSION%"

REM Push to main
echo 4. Pushing to main...
git push origin main

REM Push the tag
echo 5. Pushing release tag...
git push origin "v%VERSION%"

REM Switch back to beta
echo 6. Switching back to beta branch...
git checkout beta

echo.
echo 🎉 Release v%VERSION% completed successfully!
echo.
echo 📝 Summary:
echo - Beta branch merged into main
echo - Release tag v%VERSION% created
echo - All changes pushed to remote
echo - Back on beta branch for continued development
echo.
echo 🔗 View release on GitHub: https://github.com/Arwindpianist/sunrise-2025/releases/tag/v%VERSION%

pause 