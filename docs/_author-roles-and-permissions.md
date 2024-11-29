# Author Roles and Permissions

This documentation outlines the permissions and actions available to authors in the roles of **Contributor**, **Author**, and **Editor**. Permissions are applied to the following entities: **Article**, **Article Category**, **Article Tag**, **Podcast**, **Podcast Episode**, **Podcast Episode Link**, **Archived Issue**, **Editorial Board Position**, and **Editorial Board Member**.

---

## Roles and Permissions Overview

| **Role**        | **Action** | **Access** | **Content State**    | 📝 Article | 📂 Article Category | 🏷️ Article Tag | 🎙️ Podcast | 📻 Podcast Episode | 🔗 Podcast Episode Link | 🗞 Issue | 🧑‍💼 Editorial Member | 🪑 Editorial Position | **Notes**                                                                    |
|-----------------|------------|------------|----------------------|------------|---------------------|-----------------|-------------|--------------------|-------------------------|----------|------------------------|-----------------------|------------------------------------------------------------------------------|
| **Contributor** | View       | Own        | Draft                | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can only view their own drafts for content entities.                         |
|                 | Create     | Own        | Draft                | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can create drafts for content entities.                                      |
|                 | Update     | Own        | Draft                | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can update their drafts for content entities.                                |
|                 | Delete     | Own        | Draft                | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can delete their own drafts; cannot delete published or archived content.    |
|                 | Publish    | Own        | Draft → Published    | ❌          | ❌                   | ❌               | ❌           | ❌                  | ❌                       | ❌        | ❌                      | ❌                     | Cannot publish; requires "Author" or higher role.                            |
|                 | Retract    | Own        | Published → Draft    | ❌          | ❌                   | ❌               | ❌           | ❌                  | ❌                       | ❌        | ❌                      | ❌                     | Cannot retract; requires "Author" or higher role.                            |
|                 | Archive    | Own        | Published → Archived | ❌          | ❌                   | ❌               | ❌           | ❌                  | ❌                       | ❌        | ❌                      | ❌                     | Cannot archive published content.                                            |
|                 | Restore    | Own        | Archived → Draft     | ❌          | ❌                   | ❌               | ❌           | ❌                  | ❌                       | ❌        | ❌                      | ❌                     | Cannot restore archived content.                                             |
| **Author**      | View       | Any        | All                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can view all content but not editorial entities.                             |
|                 | Create     | Own        | Draft                | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can create drafts for all content entities.                                  |
|                 | Update     | Own        | Draft, Published     | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can update their drafts and published content; archived content is locked.   |
|                 | Delete     | Own        | Draft                | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can delete drafts but not published or archived content.                     |
|                 | Publish    | Own        | Draft → Published    | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can publish their drafts for all content entities.                           |
|                 | Retract    | Own        | Published → Draft    | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can retract their published content and revert it to draft.                  |
|                 | Archive    | Own        | Published → Archived | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can archive their own published content entities.                            |
|                 | Restore    | Own        | Archived → Draft     | ❌          | ❌                   | ❌               | ❌           | ❌                  | ❌                       | ❌        | ❌                      | ❌                     | Cannot restore archived content; requires "Editor" role.                     |
| **Editor**      | View       | Any        | All                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     | Can view all content and editorial entities.                                 |
|                 | Create     | Any        | Draft, Published     | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     | Can create drafts or directly publish content and manage editorial entities. |
|                 | Update     | Any        | All                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     | Can update any content in any state, including archived.                     |
|                 | Delete     | Any        | All                  | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ✅                      | ✅                     | Can delete drafts and archived content but not published content directly.   |
|                 | Publish    | Any        | Draft → Published    | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can publish drafts or directly create published content.                     |
|                 | Retract    | Any        | Published → Draft    | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can retract any published content and revert it to draft.                    |
|                 | Archive    | Any        | Published → Archived | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can archive any published content.                                           |
|                 | Restore    | Any        | Archived → Draft     | ✅          | ✅                   | ✅               | ✅           | ✅                  | ✅                       | ✅        | ❌                      | ❌                     | Can restore archived content to draft state.                                 |

---

## Legend

- **Access**:
  - **Own**: Permissions apply only to the author’s own content or responsibilities.
  - **Any**: Permissions apply to all content or responsibilities in the system.
- **✅**: Permission granted.
- **❌**: Permission denied.

## Additional Notes

- Roles and permissions are cumulative, meaning higher roles inherit permissions from lower ones.
- Contributors are limited to managing their own drafts and cannot perform actions on archived or published content.
- Authors have broader permissions for their own content but cannot manage other users' content or editorial entities.
- Editors have full access and management rights across all content and editorial entities.

---

## Entities Descriptions

| **Entity**                   | **Description**                                                        |
|------------------------------|------------------------------------------------------------------------|
| **Article**                  | Content pieces managed by authors.                                     |
| **Article Category**         | Categories under which articles are grouped.                           |
| **Article Tag**              | Tags associated with articles for improved search and classification.  |
| **Podcast**                  | Podcasts managed by authors.                                           |
| **Podcast Episode**          | Individual episodes within a podcast series.                           |
| **Podcast Episode Link**     | Links associated with podcast episodes, such as external resources.    |
| **Issue**                    | Released issue archived for reference.                                 |
| **Editorial Board Position** | Roles or positions within the editorial board (e.g., Editor-in-Chief). |
| **Editorial Board Member**   | Individuals holding positions within the editorial board.              |

---

## Roles Explained

### **Contributor**

- **Capabilities**:
  - Can create and edit their own content in the Draft stage.
  - Can view their own content in any stage.
- **Restrictions**:
  - Cannot publish, retract, archive, restore, or delete any content.
  - Cannot manage or view editorial board positions or members.
- **Primary Use Case**:
  - For users contributing content drafts without the ability to manage visibility or publishing.

### **Author**

- **Capabilities**:
  - Can create, edit, publish, retract, archive, restore, and delete their own content.
  - Can view editorial board positions and members.
  - Can manage their own tasks related to content and metadata (e.g., categories, tags).
- **Restrictions**:
  - Cannot delete editorial board members or positions.
  - Cannot modify or delete content created by others.
- **Primary Use Case**:
  - For users responsible for publishing and managing their own content.

### **Editor**

- **Capabilities**:
  - Full control over all content and metadata, including:
  - Creating, editing, publishing, retracting, archiving, restoring, and deleting any content.
  - Can view and manage editorial board positions and members.
- **Restrictions**:
  - None.
- **Primary Use Case**:
  - For users responsible for overseeing the entire content lifecycle and managing the work of others.
