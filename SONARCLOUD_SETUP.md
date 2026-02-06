# SonarCloud Setup Guide

This guide will help you set up SonarCloud code quality analysis for the DevTools project.

## What is SonarCloud?

SonarCloud is a cloud-based code quality and security service that:
- Analyzes code for bugs, vulnerabilities, and code smells
- Tracks test coverage
- Provides quality gates to enforce code standards
- Automatically comments on pull requests with quality metrics
- **It's completely FREE for public repositories**

## Setup Steps

### 1. Sign Up for SonarCloud

1. Go to [SonarCloud.io](https://sonarcloud.io)
2. Click **"Sign in with GitHub"** (recommended for easier integration)
3. Authorize SonarCloud to access your GitHub account

### 2. Create an Organization

1. After signing in, click **"+"** in the top right → **"Analyze new project"**
2. If this is your first time, you'll be prompted to create an organization
3. Choose a name for your organization (e.g., your GitHub username or company name)
4. Keep the organization key (you'll need this later)

### 3. Import Your Repository

1. Click **"Analyze new project"**
2. Select your **DevTools** repository from the list
3. Click **"Set Up"**
4. Choose **"With GitHub Actions"** as the analysis method

### 4. Get Your Project Information

After setup, note these two values (you'll see them on the SonarCloud page):

- **Organization Key**: e.g., `your-username`
- **Project Key**: e.g., `your-username_DevTools`

### 5. Generate a SonarCloud Token

1. Go to your profile → **Account** → **Security**
2. Or go directly to: https://sonarcloud.io/account/security
3. Under "Generate Tokens":
   - **Name**: `DevTools CI` (or any name you prefer)
   - **Type**: Choose "User Token"
   - **Expiration**: Choose "No expiration" or set a long expiration
4. Click **"Generate"**
5. **Copy the token immediately** (you won't be able to see it again!)

### 6. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add the secret:
   - **Name**: `SONAR_TOKEN`
   - **Value**: Paste the token you copied from SonarCloud
5. Click **"Add secret"**

### 7. Update Configuration Files

Update the following values in your repository:

#### In `sonar-project.properties`:

```properties
sonar.projectKey=your-organization_DevTools  # Replace with your project key
sonar.organization=your-organization          # Replace with your org key
```

#### In `.github/workflows/ci.yml`:

Find the SonarCloud step and update:

```yaml
-Dsonar.projectKey=your-organization_DevTools  # Replace with your project key
-Dsonar.organization=your-organization          # Replace with your org key
```

### 8. Commit and Push

1. Commit the updated configuration files
2. Push to GitHub
3. The GitHub Actions workflow will run automatically
4. SonarCloud will analyze your code

### 9. View Results

1. Go to your SonarCloud dashboard: https://sonarcloud.io/organizations/your-organization/projects
2. Click on your **DevTools** project
3. You'll see:
   - **Overview**: Summary of bugs, vulnerabilities, code smells
   - **Issues**: Detailed list of all detected issues
   - **Measures**: Metrics like coverage, duplications, complexity
   - **Activity**: History of analyses

## Quality Badges

After your first analysis, you can add quality badges to your README:

```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=your-organization_DevTools&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=your-organization_DevTools)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=your-organization_DevTools&metric=coverage)](https://sonarcloud.io/summary/new_code?id=your-organization_DevTools)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=your-organization_DevTools&metric=bugs)](https://sonarcloud.io/summary/new_code?id=your-organization_DevTools)
```

Replace `your-organization_DevTools` with your actual project key.

## Configuring Quality Gates

Quality gates define the conditions that must be met for code to pass:

1. Go to your project on SonarCloud
2. Click **"Quality Gates"** in the left menu
3. You can use the default "Sonar way" or create a custom gate
4. Customize thresholds for:
   - Coverage percentage
   - Code smells
   - Bugs
   - Vulnerabilities
   - Duplicated code

## PR Decoration

SonarCloud will automatically:
- Comment on pull requests with quality analysis
- Show quality gate status
- Block PRs that fail quality gates (if configured)

To enable PR decoration:
1. Make sure SonarCloud has permission to comment on PRs (configured during GitHub integration)
2. PR decoration happens automatically on every pull request

## Troubleshooting

### "SONAR_TOKEN not found"
- Make sure you added the `SONAR_TOKEN` secret to GitHub repository secrets
- Check the secret name is exactly `SONAR_TOKEN` (case-sensitive)

### "Analysis failed"
- Check the GitHub Actions logs for error details
- Verify `sonar-project.properties` has correct organization and project keys
- Ensure test coverage is generated before SonarCloud runs

### "No coverage information"
- Make sure tests run before SonarCloud analysis
- Verify `coverage/lcov.info` file is generated
- Check `sonar.javascript.lcov.reportPaths` in `sonar-project.properties`

## Optional: Skip SonarCloud

If you don't want to use SonarCloud immediately:
- The CI workflow will continue to work
- The SonarCloud step has `continue-on-error: true`
- It will skip if `SONAR_TOKEN` is not configured
- You can set it up later whenever you're ready

## Resources

- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [GitHub Actions Integration](https://github.com/SonarSource/sonarcloud-github-action)
- [Quality Gates](https://docs.sonarcloud.io/improving/quality-gates/)
- [SonarCloud Community](https://community.sonarsource.com/c/sc/10)

---

**Need Help?** Check the [SonarCloud documentation](https://docs.sonarcloud.io/) or ask in their [community forum](https://community.sonarsource.com/).
