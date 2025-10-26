# Contributing to Sanskrit Manuscript Reconstruction Portal

Thank you for your interest in contributing to this project! This hackathon prototype has significant room for improvement and expansion.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/sanskrit-manuscript-portal.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit: `git commit -m "Add: your feature description"`
7. Push: `git push origin feature/your-feature-name`
8. Open a Pull Request

## 📋 Priority Areas for Contribution

### High Priority
- **Model Training**: Fine-tune MT5 model on Sanskrit corpus
- **OCR Improvement**: Enhance accuracy with manuscript-specific preprocessing
- **Testing**: Add comprehensive test coverage
- **Documentation**: Expand API documentation and user guides
- **Security**: Implement proper authentication and authorization

### Medium Priority
- **Knowledge Graph**: Populate Neo4j with Paninian grammar rules
- **Performance**: Add caching and optimization
- **Docker**: Test and fix container orchestration
- **UI/UX**: Improve frontend design and accessibility
- **Error Handling**: Robust error handling throughout

### Low Priority
- **Additional Languages**: Expand beyond current 5 languages
- **Batch Processing**: Handle multiple manuscripts
- **Analytics**: Usage statistics and insights
- **Mobile App**: Create mobile version

## 💻 Development Setup

### Backend Development
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements/api-gateway.txt
python backend_server.py
```

### Frontend Development
```bash
cd src/frontend/react-app
npm install
npm start
```

## 🧪 Testing

Currently, the project lacks comprehensive tests. Contributions adding tests are highly valued!

```bash
# Run backend tests (to be implemented)
pytest tests/

# Run frontend tests (to be implemented)
cd src/frontend/react-app
npm test
```

## 📝 Code Style

### Python
- Follow PEP 8 guidelines
- Use type hints where possible
- Add docstrings to functions and classes
- Keep functions focused and single-purpose

### JavaScript/React
- Follow ESLint configuration
- Use functional components with hooks
- Keep components small and reusable
- Add PropTypes or TypeScript types

### Commit Messages
```
Type: Brief description

- Detailed change 1
- Detailed change 2

Types: Add, Fix, Update, Remove, Refactor, Docs, Test
```

## 🐛 Reporting Bugs

1. Check existing issues first
2. Create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Python/Node versions)

## 💡 Feature Requests

1. Check if feature is already requested
2. Create an issue with:
   - Use case description
   - Proposed solution
   - Alternative approaches considered
   - Implementation complexity estimate

## 🔐 Security

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email the maintainers directly
3. Include detailed description and steps to reproduce
4. Allow time for fix before public disclosure

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

All contributors will be acknowledged in:
- README.md contributors section
- Release notes
- Project documentation

## ❓ Questions

- Open an issue with the "question" label
- Check existing documentation first
- Be specific about what you need help with

## 🎯 Pull Request Guidelines

### Before Submitting
- [ ] Code follows project style guidelines
- [ ] Changes are tested locally
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### PR Description Should Include
- What changes were made and why
- How to test the changes
- Screenshots (for UI changes)
- Related issues (if any)

### Review Process
1. Automated checks run (linting, tests)
2. Maintainer reviews code
3. Changes requested or approved
4. Merged into main branch

## 🚀 Development Workflow

```bash
# 1. Update your local main
git checkout main
git pull upstream main

# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes and commit
git add .
git commit -m "Add: amazing feature"

# 4. Push to your fork
git push origin feature/amazing-feature

# 5. Open Pull Request on GitHub
```

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Google Gemini AI](https://ai.google.dev/)
- [Sanskrit Grammar Resources](https://sanskritdocuments.org/)
- [Material-UI Components](https://mui.com/)

## 🌟 First-Time Contributors

Look for issues labeled:
- `good first issue` - Easy entry points
- `help wanted` - Areas needing assistance
- `documentation` - Improve docs without deep code knowledge

Don't hesitate to ask questions! We're here to help.

---

**Thank you for contributing to preserving ancient wisdom through modern technology!** 🏛️✨
