# Release Workflow

## Branch Strategy

- **`main`**: Production-ready code, stable releases
- **`beta`**: Development and testing branch for new features

## Development Workflow

### 1. Daily Development (on beta branch)
```bash
# Ensure you're on beta branch
git checkout beta

# Make your changes and commit
git add .
git commit -m "feat: add new feature"

# Push to beta
git push origin beta
```

### 2. Testing Beta Versions
- Test all features thoroughly on the beta branch
- Fix any bugs found during testing
- Ensure all tests pass
- Verify the application works as expected

### 3. Releasing to Main

When a beta version is ready for production:

```bash
# 1. Switch to main branch
git checkout main

# 2. Merge beta into main
git merge beta

# 3. Create a release tag (optional)
git tag -a v1.0.0 -m "Release version 1.0.0"

# 4. Push to main
git push origin main

# 5. Push the tag (if created)
git push origin v1.0.0

# 6. Switch back to beta for continued development
git checkout beta
```

## Version Management

### Semantic Versioning
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.0.1): Bug fixes, backward compatible

### Commit Message Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Release Checklist

Before merging beta to main:

- [ ] All features are tested and working
- [ ] No critical bugs are present
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Environment variables are properly configured
- [ ] Database migrations are tested
- [ ] Performance is acceptable
- [ ] Security review completed

## Emergency Hotfixes

For critical production issues:

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-bug-fix

# 2. Fix the issue
# ... make changes ...

# 3. Commit and push
git add .
git commit -m "fix: critical bug description"
git push origin hotfix/critical-bug-fix

# 4. Merge to main
git checkout main
git merge hotfix/critical-bug-fix
git push origin main

# 5. Merge to beta to keep it in sync
git checkout beta
git merge main
git push origin beta

# 6. Delete hotfix branch
git branch -d hotfix/critical-bug-fix
git push origin --delete hotfix/critical-bug-fix
```

## Current Status

- **Current Branch**: `beta`
- **Last Release**: Commit `78ac505` (opengraph)
- **Next Release**: TBD

## Useful Commands

```bash
# Check current branch
git branch

# See commit history
git log --oneline -10

# See differences between branches
git diff main..beta

# Stash changes temporarily
git stash
git stash pop

# Reset to a specific commit (use with caution)
git reset --hard <commit-hash>
``` 