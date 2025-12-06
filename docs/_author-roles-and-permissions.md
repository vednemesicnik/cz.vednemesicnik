# Author Roles and Permissions

This document describes access rights and actions available for different roles in the system.

## Roles Overview

| **Role**        | **Level** | **Description**                                                                                      |
|-----------------|-----------|------------------------------------------------------------------------------------------------------|
| **Contributor** | 3         | Content creator with limited access to their own drafts.                                             |
| **Creator**     | 2         | Content creator with extended access to their own drafts and published content.                      |
| **Coordinator** | 1         | Content manager with full access to all drafts, published content, and archived content.             |

### Role Level Hierarchy

The **level** field establishes a hierarchical authority structure for access control:

- **Level 1 (Coordinator)**: Highest authority - full access to all content in all states
- **Level 2 (Creator)**: Mid-level authority - access to own content across states
- **Level 3 (Contributor)**: Entry level - limited to own draft content

Lower level numbers indicate higher authority. This hierarchy is used for access control and permission checks.

## Permissions Overview

| **Role**        | **Action** | **Access** | **State**                  | 📝 Article | 📂 Article Category | 🏷️ Article Tag | 🎙️ Podcast | 📻 Podcast Episode | 🔗 Podcast Episode Link | 🗞 Issue | 🧑‍💼 Editorial Member | 🪑 Editorial Position |
|-----------------|------------|------------|----------------------------|------------|---------------------|-----------------|-------------|--------------------|-------------------------|----------|------------------------|-----------------------|
| **Contributor** | View       | Own        | Draft, Published           | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Create     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Update     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Delete     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
| **Creator**     | View       | Any        | Draft, Published           | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ❌                     |
|                 | Create     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ❌                     |
|                 | Update     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ❌                     |
|                 | Delete     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ❌                     |
|                 | Publish    | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ❌                     |
|                 | Retract    | Own        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ❌                     |
|                 | Archive    | Own        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ❌                     |
|                 | Review     | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ❌                     |
| **Coordinator** | View       | Any        | Draft, Published, Archived | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Create     | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Update     | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Delete     | Any        | Draft, Archived            | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Publish    | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Retract    | Any        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Archive    | Any        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Restore    | Any        | Archived                   | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Review     | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |

## Role Descriptions

### **Contributor**
- Can view and manage their own content in Draft and Published states.
- Can create, update, and delete their own drafts.
- **Cannot publish, retract, archive, or restore content** - these actions require Creator or Coordinator intervention.
- **Cannot review content**.

### **Creator**
- Can **view any Draft and Published content** from all authors (broad visibility for editorial oversight).
- Can create, update, and delete their own drafts.
- Can publish, retract, and archive **their own content only**.
- **Can review Contributor content** (authors with level > 2) - sets `reviewed = true` on drafts.
- **Publishing own content requires review**: Can only publish their own drafts if `reviewed = true` (must be reviewed by Coordinator first).
- **Cannot publish Contributor content** - only helps Coordinator by pre-reviewing it.
- **Review action side effects**: When retracting own published content, `reviewed` is set to `false`.

### **Coordinator**
- Full access to any content (own or others') in Draft, Published, and Archived states.
- Can create, update, and delete any content in Draft and Archived states.
- Can publish, retract, and archive any content from any author.
- Can restore archived content to draft state.
- **Can review any content** from Creators and Contributors (authors with level > 1) - sets `reviewed = true` on drafts.
- **No review requirement for own content**: Can publish their own content without review.
- **Can publish reviewed content**: Final authority to publish Contributor and Creator content (after review).
- **Review action side effects**: When retracting or restoring content, `reviewed` is set to `false`.
