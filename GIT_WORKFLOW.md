# Git Workflow Guide - Engineering Org Manager

## Repository Setup ✅

**GitHub Repository:** https://github.com/abhijeetNmishra/engineering-org-manager

**Local Repository:** `/Users/abhijeet/Documents/projects/shipt-org-manager`

**Branch:** `main` (tracking `origin/main`)

---

## Daily Git Workflow

### 1. Before You Start Working

Always pull the latest changes:

```bash
git pull origin main
```

### 2. Making Changes

As you work, check what's changed:

```bash
git status
```

### 3. Committing Changes

Stage and commit your changes:

```bash
# Stage all changes
git add .

# Or stage specific files
git add src/components/NewComponent.tsx

# Commit with descriptive message
git commit -m "Add feature: detailed description of what changed"
```

**Good commit messages:**
- `feat: Add skill filtering to Dashboard`
- `fix: Resolve org chart collapse bug`
- `docs: Update README with deployment instructions`
- `refactor: Simplify TreeView component logic`
- `style: Improve dark mode contrast`

### 4. Pushing to GitHub

```bash
git push origin main
```

---

## Quick Reference Commands

### Check Status
```bash
git status                    # See what's changed
git log --oneline -5          # View recent commits
git diff                      # See unstaged changes
```

### Sync with GitHub
```bash
git pull origin main          # Get latest from GitHub
git push origin main          # Send your commits to GitHub
```

### Undo Changes
```bash
git restore <file>            # Discard changes to a file
git restore .                 # Discard all changes
git reset --soft HEAD~1       # Undo last commit (keep changes)
git reset --hard HEAD~1       # Undo last commit (discard changes)
```

### Branching (Future)
```bash
git checkout -b feature/new-feature    # Create and switch to new branch
git checkout main                       # Switch back to main
git merge feature/new-feature           # Merge branch into main
git branch -d feature/new-feature       # Delete merged branch
```

---

## Automated Workflow (Optional)

Create git aliases for common operations:

```bash
# Add to ~/.gitconfig or run these commands
git config --global alias.sync '!git pull origin main && git push origin main'
git config --global alias.save '!git add . && git commit -m'
git config --global alias.st 'status'
git config --global alias.lg 'log --oneline --graph --decorate'
```

Then use:
```bash
git save "Your commit message"    # Stage and commit
git sync                          # Pull and push in one command
git st                            # Quick status
git lg                            # Pretty log
```

---

## Conflict Resolution

If you get merge conflicts:

1. **See conflicted files:**
   ```bash
   git status
   ```

2. **Open the file and look for conflict markers:**
   ```
   <<<<<<< HEAD
   Your changes
   =======
   Remote changes
   >>>>>>> origin/main
   ```

3. **Edit to keep what you want, remove markers**

4. **Mark as resolved:**
   ```bash
   git add <conflicted-file>
   git commit -m "Resolve merge conflict in <file>"
   ```

---

## Best Practices

1. **Commit Often**: Small, focused commits are easier to track and revert
2. **Pull Before Push**: Always `git pull` before `git push` to avoid conflicts
3. **Descriptive Messages**: Write clear commit messages explaining what and why
4. **Test Before Commit**: Make sure code runs before committing
5. **Don't Commit Secrets**: Never commit API keys, passwords, or tokens

---

## Current Repository State

**Last Commits:**
- `b6792a1` - Merge remote README and keep comprehensive project documentation
- `bd68505` - Initial commit: Shipt Engineering Org Manager with smart org chart, people directory, and module ownership features

**Files Tracked:** 34 files
- Source code: 20 TypeScript/TSX files
- Configs: 5 files (package.json, tsconfig, vite.config, etc.)
- Documentation: README.md
- Assets: 2 SVG files

**Ignored (won't be committed):**
- `node_modules/`
- `dist/`
- `.DS_Store`
- Editor files (`.vscode/`, `.idea/`)
- Log files

---

## Keeping Branches in Sync

Since you're working solo on `main`:

```bash
# Simple workflow:
git add .
git commit -m "Description of changes"
git push origin main
```

When working with others or using feature branches, you'll want to pull before pushing:

```bash
git pull origin main    # Get latest
git add .
git commit -m "Message"
git push origin main    # Send your changes
```

---

## Troubleshooting

**"Updates were rejected":**
```bash
git pull origin main --rebase
git push origin main
```

**"Your branch is behind":**
```bash
git pull origin main
```

**"Uncommitted changes":**
```bash
git stash              # Temporarily save changes
git pull origin main   # Get updates
git stash pop          # Restore your changes
```

**Start over (dangerous!):**
```bash
git reset --hard origin/main    # Match exactly what's on GitHub
```

---

## Next Steps

1. ✅ Repository created and synced
2. ✅ Main branch tracking origin
3. ✅ Initial code pushed (34 files)
4. 🎯 Continue development with regular commits
5. 🎯 Consider creating feature branches for large changes

Happy coding! 🚀
