# Contributing to Etheria Survival Calculator

Thank you for your interest in contributing to the Etheria Survival Calculator! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** first to avoid duplicates
2. **Use a clear title** that describes the problem
3. **Provide detailed steps** to reproduce the issue
4. **Include your environment** (browser, OS, etc.)
5. **Add screenshots** if helpful

### Suggesting Features

1. **Check existing feature requests** to avoid duplicates
2. **Explain the use case** and why it would be valuable
3. **Describe the expected behavior** in detail
4. **Consider implementation complexity** and maintenance burden

### Submitting Code Changes

#### Prerequisites
- Node.js 16 or higher
- Git knowledge
- Basic React and JavaScript experience

#### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/yourusername/etheria-survival-calculator.git
cd etheria-survival-calculator

# Install dependencies
npm install

# Start development server
npm start
```

#### Making Changes
1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the project structure:
   - Components in `src/components/`
   - Utilities in `src/utils/`
   - Styles alongside components
   - Data files in `src/data/` or `public/txtData/`

3. **Test your changes** thoroughly:
   - Verify all existing functionality still works
   - Test edge cases and error conditions
   - Check responsive design on different screen sizes

4. **Follow coding standards**:
   - Use descriptive variable and function names
   - Add comments for complex logic
   - Keep components focused and reusable
   - Use consistent formatting

5. **Commit your changes** with clear messages:
   ```bash
   git add .
   git commit -m "feat: add guidance support for skill checks"
   ```

6. **Push and create a Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

#### Pull Request Guidelines

- **Clear title** describing the change
- **Detailed description** of what was changed and why
- **Link related issues** using "Fixes #123" or "Closes #123"
- **Include screenshots** for UI changes
- **Update documentation** if needed
- **Keep PRs focused** - one feature/fix per PR

## Project Structure

```
src/
├── components/          # React components
│   ├── GoldCalculator.js       # Main calculator interface
│   ├── ItemComparison.js       # Item profitability comparison
│   ├── ProfitEstimator.js      # Historical analysis
│   └── *.css                   # Component styles
├── utils/
│   └── parser.js               # Data parsing and calculations
├── data/
│   └── goldValues.js           # Item value mappings
└── App.js                      # Main application component

public/
└── txtData/                    # Raw Discord log files
```

## Data and Calculations

### Understanding the Game Mechanics
- **Skill Checks**: d20 + survival bonus vs DC to find creatures/items
- **Attack Rolls**: d20 + attack bonus vs creature AC to successfully hunt
- **Support Actions**: Help (advantage) vs Guidance (+1d4 to skills only)

### Working with Game Data
- Log files in `public/txtData/` contain raw encounter data
- `parser.js` extracts encounters and calculates probabilities
- Creature AC values are manually extracted from recent logs
- DC weights are based on statistical analysis of 36,000+ encounters

### Adding New Features
When adding calculation features:
1. **Understand the game mechanics** first
2. **Validate with real data** when possible
3. **Consider edge cases** and error handling
4. **Update tests** and documentation

## Testing

Before submitting changes:

1. **Manual Testing**:
   - Test all calculator functions
   - Verify support system works correctly
   - Check responsive design
   - Test with different party configurations

2. **Cross-browser Testing**:
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers

3. **Performance Testing**:
   - Large party sizes
   - Complex calculations
   - Data loading times

## Documentation

Keep documentation up to date:
- **README.md** for user-facing features
- **Code comments** for complex logic
- **Component props** and function parameters
- **Game mechanics** explanations

## Questions?

- **Open an issue** for questions about contributing
- **Check existing discussions** for similar questions
- **Be patient** - maintainers respond as time allows

Thank you for helping make the Etheria Survival Calculator better!
