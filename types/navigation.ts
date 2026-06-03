/**
 * ============================================
 * NAVIGATION TYPES
 * ============================================
 * 
 * Type-safe navigation helpers and route definitions
 * for Expo Router. Use these types to ensure consistent
 * navigation throughout the app.
 * 
 * @module types/navigation
 */

// ============================================
// ROUTE PATHS
// ============================================

/**
 * All valid route paths in the application.
 * Keep this in sync with the `app/` directory structure.
 */
export type AppRoute =
  | '/'                                    // Welcome / splash
  | '/project'                             // Project hub
  | '/style-matcher'                       // Style matcher kanban
  | '/style-matcher/[order]'               // Style questionnaire step
  | '/style-matcher/results'               // Style summary
  | '/scene-segmentation'                  // Scene segmentation kanban
  | '/scene-segmentation/input'            // Script paste input
  | '/scene-segmentation/scene-mapper'     // Stage 1: scene mapping
  | '/scene-segmentation/subject-mapper';  // Stage 2: subject mapping

// ============================================
// ROUTE PARAMETERS
// ============================================

/**
 * Parameters for the project route.
 */
export interface ProjectParams {
  /** Project title */
  title?: string;
}

/**
 * Parameters for the style matcher question route.
 */
export interface StyleMatcherQuestionParams {
  /** Question order (1-based) */
  order: string;
  /** Optional correction mode flag */
  mode?: 'correction';
}

/**
 * Parameters for the style results route.
 */
export interface StyleResultsParams {
  /** Generated style prompt */
  prompt?: string;
}

/**
 * Union of all route parameter types.
 */
export type RouteParams = 
  | ProjectParams 
  | StyleMatcherQuestionParams 
  | StyleResultsParams;

// ============================================
// NAVIGATION HELPERS
// ============================================

/**
 * Navigation destination with typed parameters.
 */
export interface NavigationDestination<P extends RouteParams = RouteParams> {
  /** Route path */
  pathname: AppRoute;
  /** Route parameters */
  params?: P;
}

/**
 * Breadcrumb path definition.
 * Used for hierarchical navigation display.
 */
export interface BreadcrumbPath {
  /** Route segments from root to current */
  segments: Array<{
    label: string;
    route?: AppRoute;
    params?: RouteParams;
  }>;
}

// ============================================
// NAVIGATION CONTEXT
// ============================================

/**
 * Navigation state tracked across the app.
 */
export interface NavigationState {
  /** Previous route for back navigation */
  previousRoute?: AppRoute;
  /** Current active route */
  currentRoute: AppRoute;
  /** Navigation history depth */
  historyDepth: number;
}
