# Author Roles and Permissions

This document describes access rights and actions available for different roles in the system.

## Roles Overview

| **Role**        | **Level** | **Description**                                                                          |
|-----------------|-----------|------------------------------------------------------------------------------------------|
| **Contributor** | 3         | Content creator with limited access to their own drafts.                                 |
| **Creator**     | 2         | Content creator with extended access to their own drafts and published content.          |
| **Coordinator** | 1         | Content manager with full access to all drafts, published content, and archived content. |

## Permissions Overview

| **Role**        | **Action** | **Access** | **State**                  | 📝 Article | 📂 Article Category | 🏷️ Article Tag | 🎙️ Podcast | 📻 Podcast Episode | 🔗 Podcast Episode Link | 🗞 Issue | 🧑‍💼 Editorial Member | 🪑 Editorial Position |
|-----------------|------------|------------|----------------------------|------------|---------------------|-----------------|-------------|--------------------|-------------------------|----------|------------------------|-----------------------|
| **Contributor** | View       | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Create     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Update     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Delete     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
| **Creator**     | View       | Own        | Draft, Published           | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Create     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Update     | Own        | Draft, Published           | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Delete     | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Publish    | Own        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Retract    | Own        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Archive    | Own        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
| **Coordinator** | View       | Any        | Draft, Published, Archived | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Create     | Any        | Draft, Published           | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Update     | Any        | Draft, Published, Archived | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Delete     | Any        | Draft, Archived            | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     |
|                 | Publish    | Any        | Draft                      | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Retract    | Any        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Archive    | Any        | Published                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |
|                 | Restore    | Any        | Archived                   | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     |

## Role Descriptions

### **Contributor**
- Can access their own content in the Draft state.
- Allowed to create, update, view, and delete their own content.
- Cannot publish, archive, or restore content.

### **Creator**
- Extended permissions compared to Contributor: can publish, retract, and archive their own content.
- Can manage content in Draft and Published states.

### **Coordinator**
- Full access to any content (own or others') in Draft, Published, and Archived states.
- Can create, update, delete, publish, retract, archive, and restore content.
