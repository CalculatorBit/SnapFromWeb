# Contributing to SnapFromWeb

Thank you for your interest in contributing to SnapFromWeb! We welcome contributions from everyone.

## Getting Started

### Prerequisites

-   Node.js (LTS version recommended)
-   pnpm (Package Manager)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/snapfromweb.git
    cd snapfromweb
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Start the development server:**

    ```bash
    pnpm run dev
    ```

    The app should now be running at `http://localhost:4321`.

## Development Workflow

1.  **Fork the repository** and clone it locally.
2.  **Create a new branch** for your feature or bug fix:
    ```bash
    git checkout -b feature/amazing-feature
    ```
3.  **Make your changes**. Ensure you follow the project's code style.
4.  **Test your changes** locally to ensure everything works as expected.
5.  **Commit your changes** with descriptive commit messages:
    ```bash
    git commit -m "feat: Add amazing feature"
    ```
6.  **Push to your fork**:
    ```bash
    git push origin feature/amazing-feature
    ```
7.  **Open a Pull Request** on the main repository.

## Project Structure

-   `src/`: Source code for the application.
    -   `pages/`: Astro pages.
    -   `components/`: Reusable React and Astro components.
    -   `layouts/`: Page layouts.
-   `public/`: Static assets.

## Code Style

-   We use **Prettier** for code formatting.
-   We use **ESLint** for linting.
-   Please ensure your code is clean and readable.

## Reporting Issues

If you find a bug or have a feature request, please open an issue using the provided templates.

Thank you for contributing!
