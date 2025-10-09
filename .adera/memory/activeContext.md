# Active Context - Adera Hybrid App Development

**Date**: 2025-01-09  
**Status**: Foundation Phase - UI & Architecture Setup  
**Current Branch**: dev  
**Active Focus**: Resolving version inconsistencies and completing basic infrastructure

## Current Work Context

### Primary Focus
- **Version Alignment**: Fixing React/Expo version inconsistencies across monorepo
- **Dependency Management**: Ensuring all packages have correct dependencies installed
- **UI Component Library**: Completing Material 3 design system implementation
- **Authentication Setup**: Preparing Supabase integration architecture

### Recent Progress
- ✅ Monorepo structure established with Turborepo + pnpm
- ✅ Ethiopian-inspired color palette implemented
- ✅ Onboarding and Gateway screens created with proper UX flow
- ✅ Basic ThemeProvider and Button components functional

### Immediate Blockers
1. **Version Mismatch**: Apps use different Expo/React versions than UI package
2. **Missing Dependencies**: Several workspace packages lack proper dependencies
3. **Build Issues**: Current setup may not build due to version conflicts

## Active Decisions & Considerations

### Technology Choices Confirmed
- **Expo SDK**: Targeting version 54 (latest stable for production)
- **React Native**: Version 0.81.4 (compatible with Expo 54)
- **Design System**: Material 3 with Ethiopian cultural elements
- **State Management**: TBD (Zustand vs Redux Toolkit)

### Architecture Patterns
- **Monorepo**: Turborepo with pnpm workspaces
- **Shared Packages**: Clean separation between UI, auth, payments, maps, utils
- **Role-Based Access**: Implemented at app level with shared authentication

### UX Decisions
- **Onboarding Flow**: 4-slide introduction with Ethiopian market imagery
- **App Selection**: Clear separation between PTP and Shop experiences
- **Guest Mode**: Allowed for browsing, authentication required for actions

## Next Steps

### Phase 1: Foundation Stabilization (Current)
1. Fix all version inconsistencies
2. Install missing dependencies
3. Verify build system works across all packages
4. Complete basic UI component library

### Phase 2: Core Services Setup
1. Set up Supabase project and database schema
2. Implement authentication package
3. Create role-based routing system
4. Set up localization framework

### Phase 3: Feature Implementation
1. Build PTP parcel creation and tracking
2. Implement Shop marketplace functionality
3. Integrate payment gateways
4. Add notifications system

## Open Questions
- Should we use Zustand or Redux Toolkit for state management?
- What's the preferred approach for offline-first architecture?
- How should we handle image optimization for Ethiopian 3G constraints?
- Should we implement a unified design token system?

## Quality Gates
- All packages must use consistent dependency versions
- Every component must follow Material 3 design principles
- Ethiopian cultural elements must be authentically represented
- Performance budget: 150MB RAM, 3G-optimized
