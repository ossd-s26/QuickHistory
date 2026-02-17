# Contributing to QuickHistory

Thank you for your interest in contributing to QuickHistory!
We welcome bug reports, feature ideas, and code improvements.

------------------------------------------------------------------------

## Getting Started

1.  Fork this repository\

2.  Clone your fork:

   ```git clone https://github.com/YOUR-USERNAME/QuickHistory.git\```
   ```cd QuickHistory```

3.  Install dependencies:

    ```npm install```

4.  Build the extension:

    ```npm run build```

5.  Load the extension in Chrome:

    -   Open chrome://extensions\
    -   Enable **Developer mode**\
    -   Click **Load unpacked**\
    -   Select the dist/ folder

------------------------------------------------------------------------

## Development Workflow

Please follow this workflow:

1.  Create a new branch from main

    ```git checkout -b feature/your-feature-name```

2.  Make your changes

3.  Run type checking:

    ```npm run check```

4.  Commit your changes with clear messages

5.  Push your branch and open a Pull Request

------------------------------------------------------------------------

## Pull Request Guidelines

Before submitting a PR:

-   Keep changes small and focused\
-   Write clear commit messages\
-   Explain what your PR does\
-   Include screenshots for UI changes when possible\
-   Ensure the project builds successfully

------------------------------------------------------------------------

## Code Style

-   Use TypeScript
-   Follow the existing project structure\
-   Prefer simple and readable code\
-   Reuse shared types from src/shared.ts when possible

------------------------------------------------------------------------

## Reporting Issues

If you find a bug or want to suggest a feature:

-   Use the GitHub **Issues** tab\
-   Provide clear reproduction steps\
-   Include screenshots or logs if helpful

------------------------------------------------------------------------

## Good First Contributions

Areas that are friendly for new contributors:

-   Popup UI improvements\
-   Error handling improvements\
-   Documentation updates\
-   Performance improvements

------------------------------------------------------------------------

Thank you for helping improve QuickHistory 🚀
