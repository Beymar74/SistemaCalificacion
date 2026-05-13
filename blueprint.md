# Project Blueprint: Sistema de Calificación

## Overview
A Next.js application for a "Sistema de Calificación" (Grading System). Built with Next.js 15, React 19, and Tailwind CSS.

## Features & Design
- **Core**: Next.js App Router.
- **Styling**: Tailwind CSS for modern, responsive UI.
- **Environment**: Configured for development in Firebase Studio/IDX.

## Implementation Plan: Dockerization
The goal is to containerize the application to ensure consistency across different environments.

### Steps
1. **Create `.dockerignore`**: Exclude `node_modules`, `.next`, and other build artifacts.
2. **Create `Dockerfile`**: 
   - Stage 1: Dependencies installation.
   - Stage 2: Building the application.
   - Stage 3: Production runner using a lightweight image.
3. **Create `docker-compose.yml`**: Define the service for the web application, mapping ports and setting up restart policies.

## Recent Changes
- **Entity Renaming**: Changed all occurrences of "Facultad de Ingeniería Industrial" to "Carrera de Ingeniería Industrial" across the application.
- **Login Bypass**: Modified the login logic in `src/app/login/page.tsx` to allow access without credentials for development and testing purposes. All login attempts now redirect to the admin dashboard.
- **Docentes UI/UX Enhancement**: Completed a complete overhaul of the teachers' management page. Added summary statistics, glassmorphism design, framer-motion animations, and improved interactive elements for a premium experience.
- **Docente Portal UI/UX Enhancement**: Completed an upgrade for the evaluator's landing page. Introduced a responsive grid layout, glassmorphism header, entrance animations, and high-quality interactive project cards for an improved assessment experience.
- **Admin Proyectos UI/UX Enhancement**: Completed a full redesign of the projects administration page. Added an interactive dashboard, glassmorphic tables, advanced filtering, and premium progress visualizations.
- **Brand Integration**: Integrated the official career logo across key interfaces.
- **Login Page UI/UX Enhancement**: Redesigned with a high-clarity light theme. Removed dark containers and decorative patterns to ensure institutional branding (logo) stands out. Implemented a professional split-screen layout with clean feature descriptions and modern authentication fields.

## UI/UX Enhancement Plan: Login Page
The goal is to provide a stunning, secure-feeling, and professional entrance to the platform.

### Features
1. **Dynamic Background**: A deep, professional gradient with subtle animated SVG blobs to provide depth and motion.
2. **Glassmorphic Card**: A centered login container using backdrop blur, border-gradients, and soft shadows.
3. **Immersive Branding**: Large, high-quality display of the career logo and system title with premium typography.
4. **Enhanced Inputs**: 
   - Modern, spacious text fields with floating-label-like feel.
   - Interactive focus states with subtle glows.
5. **Interactive Login Button**: A high-contrast button with micro-animations and loading states.
7. **Split-Screen Layout**: On desktop, use a two-column distribution to fill the side space. Left side for immersive branding and fair highlights; right side for the focused authentication form.

## UI/UX Enhancement Plan: Admin Proyectos
The goal is to provide a high-performance, visually stunning management interface for all projects in the fair.

### Features
1. **Interactive Dashboard**: Top-level stats with animated cards showing total projects, completion percentage, and active evaluators.
2. **Glassmorphic Data Table**:
   - Clean, spacious layout with rounded corners and backdrop blur.
   - Entrance animations for each project row.
   - Dynamic status badges with "glow" effects.
3. **Advanced Control Bar**:
   - Integrated search and multi-select filters for categories and status.
   - Clean, modern UI for filtering actions.
4. **Overall Progress Visualization**: A premium progress tracking component with real-time updates and goal indicators.
5. **Responsive & Accessible**: Fully optimized for various screen sizes, maintaining high readability.

## UI/UX Enhancement Plan: Docente Portal
The goal is to provide evaluators with a premium, focused, and intuitive interface for project assessment.

### Features
1. **Glassmorphic Header**: A modern navigation bar with blurred background and refined iconography.
2. **Dynamic Hero Section**: A welcoming header with subtle gradients and high-quality typography.
3. **Interactive Project Cards**:
   - Staggered animations using `framer-motion`.
   - Visual distinction between "Pending" and "Completed" evaluations using modern status tags.
   - Enhanced "Evaluar" buttons with glow effects and micro-interactions.
4. **Adaptive Layout**: Optimized for desktop, tablet, and mobile devices, ensuring accessibility and ease of use in the field (e.g., during a fair).
5. **Progress Tracking**: Clear visual feedback on remaining evaluations.

## UI/UX Enhancement Plan: Docentes Page
The objective is to transform the "Gestión de Docentes" page into a professional, intuitive dashboard segment.

### Features
1. **Summary Statistics**: Add a top section with key metrics (Total Teachers, Active Status, Project Load).
2. **Advanced Filtering**: Implement a more robust search and filter interface.
3. **Enhanced Visuals**: 
   - Use Glassmorphism and modern shadows.
   - Animated transitions using `framer-motion`.
   - Custom-styled progress bars and status indicators.
4. **Responsive Table**: Ensure the data remains accessible and readable across all devices.
5. **Interactive Feedback**: Add hover effects and micro-interactions for buttons and rows.

