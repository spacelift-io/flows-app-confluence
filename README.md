# Confluence Integration for Flows

Comprehensive Confluence integration for content teams and knowledge management. Automate page creation, manage content hierarchies, facilitate collaboration through comments, and integrate Confluence workflows with your documentation pipelines.

## Features

### Page Management

- **Create & Update Pages**: Full page lifecycle with rich content formatting
- **Delete Pages**: Safe deletion with trash/permanent options
- **List & Search Pages**: Powerful filtering with pagination and sorting
- **Get Page Details**: Retrieve complete page information including versions
- **Content Formats**: Support for storage, atlas_doc_format, and wiki markup

### Content Collaboration

- **Footer Comments**: General page discussions and feedback
- **Inline Comments**: Context-specific comments anchored to text selections
- **Comment Threading**: Reply to comments for structured conversations
- **Rich Text Support**: Formatted content using multiple representation formats

### Content Organization

- **Space Management**: Browse and filter Confluence spaces
- **Page Hierarchy**: Navigate parent-child page relationships
- **Version History**: Track changes and retrieve historical versions
- **Content Structure**: Maintain organized knowledge bases

### Advanced Features

- **Content Versioning**: Complete version control with author tracking
- **Hierarchical Navigation**: Parent-child page relationships
- **Text Selection Comments**: Precise inline commenting on specific content
- **Flexible Formatting**: Multiple content representation formats

## Quick Start

### 1. Configure Confluence Connection

1. Generate credentials:

   **For Atlassian Cloud:**
   - Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Click "Create API token" and copy it

   **For Self-hosted Confluence:**
   - Use your Confluence username and password, or
   - Generate a Personal Access Token in Confluence settings

2. Configure the app:
   - **Confluence URL**: Your instance URL (e.g., `https://yourcompany.atlassian.net` or `https://confluence.yourcompany.com`)
   - **Email**: Your Confluence account email (for Cloud) or username (for self-hosted)
   - **API Token**: The token from step 1 or your password

### 2. Start Automating

Add Confluence blocks to your flows and connect them to your documentation and content workflows.

## Available Blocks

### Page Operations (5 blocks)

- **Create Page**: Create new pages with rich content and hierarchy
- **Get Page**: Retrieve page details with optional version and content data
- **Update Page**: Modify titles, content, and status with version control
- **Delete Page**: Remove pages with trash or permanent deletion options
- **List Pages**: Search and filter pages with advanced criteria

### Space Operations (1 block)

- **Get Spaces**: Browse and filter Confluence spaces with pagination

### Comment Operations (2 blocks)

- **Create Footer Comment**: Add general comments to pages
- **Create Inline Comment**: Add context-specific comments to text selections

### Version Management (1 block)

- **Get Versions**: Retrieve complete version history with change tracking

### Hierarchy Navigation (1 block)

- **Get Child Pages**: Navigate page hierarchies and retrieve direct children

## Authentication & Security

- **API Token Authentication**: Secure token-based authentication with Atlassian
- **Permission Scoping**: Uses your Confluence permissions - only access what you can access
- **Encrypted Storage**: API tokens stored securely with encryption
- **Content Versioning**: Full audit trail for all content changes

## Common Use Cases

- **Documentation Automation**: Auto-generate and update technical documentation
- **Knowledge Management**: Maintain organized knowledge bases with proper hierarchy
- **Content Review Workflows**: Facilitate collaborative content creation and review
- **Release Documentation**: Automatically create and update release notes and changelogs
- **Team Collaboration**: Enable structured discussions through inline and footer comments
- **Content Migration**: Bulk operations for moving and organizing content
