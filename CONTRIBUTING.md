# Contributing to ZuriApp

We follow a professional workflow to ensure code quality and stability. Please follow these guidelines when contributing.

## Branching Strategy & Deployment

We use a structured flow to move code from development to production.

### 1. Development (Local)

- Create a new branch for your feature: `git checkout -b feature/my-feature`.
- Run the app locally with Docker:
  ```bash
  docker-compose up
  ```
- This starts the full environment with hot-reloading.

### 2. Staging (Pre-Production)

- **Goal**: Verify changes in a production-like environment.
- **Action**: Create a Pull Request (PR) from your feature branch to the **`staging`** branch.
- **Deployment**: Merging to `staging` automatically deploys to the **ZuriApp-Staging** environment on Railway.
- **Verification**: Test your changes in the Staging URL.

### 3. Production (Live)

- **Goal**: Release detailed and verified changes to users.
- **Action**: Create a Pull Request from `staging` to **`main`**.
- **Deployment**: Merging to `main` automatically deploys to the **ZuriApp-Production** environment on Railway.

## Quality Checks (CI)

Our GitHub Actions pipeline runs automatically on every Pull Request to ensure:

- Dependencies install correctly.
- All automated tests pass.

Ensure you run tests locally before pushing:

```bash
# Server
cd server
npm test

# Client
cd client
npm test
```

## Environment Variables

- `.env.development`: Key-value pairs for local development (git-ignored).
- `.env.production`: Template/Reference for production variables.
