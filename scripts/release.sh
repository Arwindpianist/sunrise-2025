#!/bin/bash

# Release Script for Sunrise 2025
# This script helps automate the release process from beta to main

set -e

echo "🚀 Sunrise 2025 Release Script"
echo "================================"

# Check if we're on the beta branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "beta" ]; then
    echo "❌ Error: You must be on the beta branch to release"
    echo "Current branch: $CURRENT_BRANCH"
    echo "Please run: git checkout beta"
    exit 1
fi

# Get the version from user
echo ""
read -p "Enter version number (e.g., 1.0.0): " VERSION

if [ -z "$VERSION" ]; then
    echo "❌ Error: Version number is required"
    exit 1
fi

echo ""
echo "📋 Release Checklist:"
echo "====================="
echo "1. All features tested and working? (y/n)"
read -p "   Answer: " FEATURES_TESTED

echo "2. No critical bugs present? (y/n)"
read -p "   Answer: " NO_CRITICAL_BUGS

echo "3. All tests pass? (y/n)"
read -p "   Answer: " TESTS_PASS

echo "4. Documentation updated? (y/n)"
read -p "   Answer: " DOCS_UPDATED

echo "5. Environment variables configured? (y/n)"
read -p "   Answer: " ENV_CONFIGURED

# Check all answers
if [ "$FEATURES_TESTED" != "y" ] || [ "$NO_CRITICAL_BUGS" != "y" ] || [ "$TESTS_PASS" != "y" ] || [ "$DOCS_UPDATED" != "y" ] || [ "$ENV_CONFIGURED" != "y" ]; then
    echo ""
    echo "❌ Release checklist not complete. Please address all items before releasing."
    exit 1
fi

echo ""
echo "✅ Release checklist complete!"
echo ""

# Confirm release
read -p "Proceed with release to main? (y/n): " CONFIRM_RELEASE

if [ "$CONFIRM_RELEASE" != "y" ]; then
    echo "❌ Release cancelled"
    exit 1
fi

echo ""
echo "🔄 Starting release process..."

# Switch to main branch
echo "1. Switching to main branch..."
git checkout main

# Merge beta into main
echo "2. Merging beta into main..."
git merge beta

# Create release tag
echo "3. Creating release tag v$VERSION..."
git tag -a "v$VERSION" -m "Release version $VERSION"

# Push to main
echo "4. Pushing to main..."
git push origin main

# Push the tag
echo "5. Pushing release tag..."
git push origin "v$VERSION"

# Switch back to beta
echo "6. Switching back to beta branch..."
git checkout beta

echo ""
echo "🎉 Release v$VERSION completed successfully!"
echo ""
echo "📝 Summary:"
echo "- Beta branch merged into main"
echo "- Release tag v$VERSION created"
echo "- All changes pushed to remote"
echo "- Back on beta branch for continued development"
echo ""
echo "🔗 View release on GitHub: https://github.com/Arwindpianist/sunrise-2025/releases/tag/v$VERSION" 