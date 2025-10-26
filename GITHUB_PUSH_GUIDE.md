# Quick GitHub Push Guide

## Prerequisites
- Git installed on your system
- GitHub account created
- Repository cleaned up (✅ Already done!)

## Step-by-Step Instructions

### 1. Open PowerShell/Terminal
```powershell
cd "c:\Users\paulj\OneDrive\Desktop\My_pro (4)\My_pro"
```

### 2. Initialize Git Repository (if needed)
```bash
git init
```

### 3. Configure Git (First Time Only)
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 4. Stage All Files
```bash
git add .
```

### 5. Check What Will Be Committed
```bash
git status
```

You should see:
- `.env.example` ✅
- `.gitignore` ✅
- All `.md` files ✅
- All `.py` files ✅
- `src/` directory ✅
- `requirements/` directory ✅
- etc.

You should **NOT** see:
- `.env` (if it exists)
- `__pycache__/`
- `node_modules/`
- `build/`
- Any test files ✅

### 6. Create Initial Commit
```bash
git commit -m "Initial commit: Sanskrit Manuscript Reconstruction Portal

- Complete React + FastAPI application
- Google Gemini AI integration
- Multilingual translation support
- Built during hackathon with time constraints
- See HACKATHON_NOTES.md for development details"
```

### 7. Create GitHub Repository

Go to: https://github.com/new

Fill in:
- **Repository name**: `sanskrit-manuscript-portal` (or your choice)
- **Description**: `🏛️ AI-powered Sanskrit manuscript reconstruction using Google Gemini AI - Hackathon Project`
- **Public** or **Private**: Your choice
- **❌ DO NOT** check "Add a README file" (we already have one)
- **❌ DO NOT** check "Add .gitignore" (we already have one)
- **❌ DO NOT** choose a license (we already have MIT)

Click **"Create repository"**

### 8. Link Your Local Repo to GitHub

GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/sanskrit-manuscript-portal.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### 9. Enter GitHub Credentials

When prompted:
- **Username**: Your GitHub username
- **Password**: Your GitHub Personal Access Token (not your password!)

**How to get a token**:
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "Sanskrit Portal Upload"
4. Select scopes: `repo` (all)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password

### 10. Verify Upload

Go to: `https://github.com/YOUR_USERNAME/sanskrit-manuscript-portal`

You should see:
- ✅ All your files
- ✅ README.md displayed on homepage
- ✅ License badge
- ✅ File tree with organized structure

## Troubleshooting

### Problem: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/sanskrit-manuscript-portal.git
```

### Problem: "Permission denied"
- Make sure you're using Personal Access Token, not password
- Check token has `repo` permissions
- Verify username is correct

### Problem: Files not showing up
```bash
# Check what Git sees
git status

# Check ignored files
git status --ignored
```

### Problem: Wrong files committed
```bash
# Undo last commit (keeps changes)
git reset --soft HEAD~1

# Review and recommit
git status
git add .
git commit -m "Your message"
```

## After Successful Push

### 1. Add Topics/Tags
On your GitHub repo page:
- Click the gear icon next to "About"
- Add topics: `sanskrit`, `ai`, `gemini`, `react`, `fastapi`, `hackathon`, `nlp`, `translation`

### 2. Edit Repository Details
- Update description
- Add website URL (if you deploy it)
- Choose topics

### 3. Create Issues (Optional)
Document known limitations as GitHub Issues:
- "TODO: Fine-tune MT5 model"
- "TODO: Add comprehensive tests"
- "TODO: Improve OCR accuracy"
- "Help Wanted: Knowledge Graph Population"

### 4. Add README Badges (Optional)

Edit README.md and add at the top:
```markdown
# Sanskrit Manuscript Reconstruction Portal (SMRP)

![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-18+-61dafb.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-hackathon_prototype-orange.svg)

> 🏆 **Hackathon Project** - Built with passion under time constraints
```

Then commit and push the change:
```bash
git add README.md
git commit -m "Add badges to README"
git push
```

## Future Updates

When you make changes:

```bash
# 1. Check what changed
git status

# 2. Stage changes
git add .

# 3. Commit with message
git commit -m "Describe your changes"

# 4. Push to GitHub
git push
```

## Command Reference

```bash
# Check status
git status

# See commit history
git log --oneline

# See remote URL
git remote -v

# Pull latest changes (if collaborating)
git pull

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# See all branches
git branch -a
```

## Need Help?

- Git documentation: https://git-scm.com/doc
- GitHub guides: https://guides.github.com/
- Git tutorial: https://www.atlassian.com/git/tutorials

## Success Checklist

After pushing, verify:
- [ ] Repository is visible on GitHub
- [ ] README displays correctly on homepage
- [ ] All files and folders are present
- [ ] No sensitive data (API keys) is visible
- [ ] License file is recognized by GitHub
- [ ] .gitignore is working (no build artifacts)
- [ ] Repository description is set
- [ ] Topics/tags are added

## 🎉 You're Done!

Your Sanskrit Manuscript Reconstruction Portal is now on GitHub and ready to share with the world!

Share your repository:
- On LinkedIn
- On Twitter/X
- In AI/ML communities
- With hackathon organizers
- In your portfolio

**Congratulations!** 🏛️✨
