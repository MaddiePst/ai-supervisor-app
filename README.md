# AI-Powered Supervisor Assistant System

## Table of Contents

-   Project Overview
-   Tech Stack
-   Branch Strategy
-   Branch Flow
-   Naming Convention
-   Daily Git Commands
-   Commit Format
-   Pull Request Rules

------------------------------------------------------------------------

## Project Overview

AI system to help supervisors assign employees to projects using AI
recommendations.

### Users

-   Employee
-   Admin / Supervisor
-   AI System

------------------------------------------------------------------------

## Tech Stack

-   React.js + Tailwind CSS
-   Node.js / Express
-   MySQL
-   Python / OpenAI API
-   Git + GitHub

------------------------------------------------------------------------

## Branch Strategy

-   main → production
-   develop → integration
-   alpha → feature development

Golden rule: Never push directly to main.

------------------------------------------------------------------------

## Branch Flow

alpha/feature → alpha → develop → main

------------------------------------------------------------------------

## Naming Convention

type/short-description

Examples: - alpha/employee-profile-form - alpha/ai-matching-engine -
alpha/fix-login-redirect

------------------------------------------------------------------------

## Daily Git Commands

### Big Feature

``` bash
git checkout alpha
git pull origin alpha
git checkout -b alpha/your-feature-name
git add .
git commit -m "feat: description"
git push origin alpha/your-feature-name
```

### Small Task

``` bash
git checkout develop
git pull origin develop
git add .
git commit -m "fix: description"
git push origin develop
```

------------------------------------------------------------------------

## Commit Format

feat, fix, style, refactor, test, docs, chore

------------------------------------------------------------------------

## Pull Request Rules

-   Clear title
-   Link issues
-   At least 1 reviewer
-   Resolve comments before merge
