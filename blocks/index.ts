// Page blocks
import { createPage } from "./pages/createPage";
import { updatePage } from "./pages/updatePage";
import { getPage } from "./pages/getPage";
import { deletePage } from "./pages/deletePage";
import { listPages } from "./pages/listPages";

// Space blocks
import { getSpaces } from "./spaces/getSpaces";

// Comment blocks
import { createFooterComment } from "./comments/createFooterComment";
import { createInlineComment } from "./comments/createInlineComment";

// Version blocks
import { getVersions } from "./versions/getVersions";

// Children blocks
import { getChildPages } from "./children/getChildPages";

/**
 * Dictionary of all available blocks organized by category
 * Key: block identifier (for programmatic access)
 * Value: block definition
 */
export const blocks = {
  // Page Management
  createPage,
  updatePage,
  getPage,
  deletePage,
  listPages,

  // Space Management
  getSpaces,

  // Comment Management
  createFooterComment,
  createInlineComment,

  // Version Management
  getVersions,

  // Children Management
  getChildPages,
} as const;

// Named exports for individual blocks (optional, for external imports)
export {
  createPage,
  updatePage,
  getPage,
  deletePage,
  listPages,
  getSpaces,
  createFooterComment,
  createInlineComment,
  getVersions,
  getChildPages,
};
