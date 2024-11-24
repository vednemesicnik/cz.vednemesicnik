# Author Roles and Permissions

This documentation outlines the permissions and actions available to authors in the roles of **Contributor**, **Author**, and **Editor**. Permissions are applied to the following entities: **Article**, **Article Category**, **Podcast**, **Podcast Episode**, **Podcast Episode Link**, **Archived Issue**, **Editorial Board Position**, and **Editorial Board Member**.

---

## Roles and Permissions Overview

| **Role**        | **Action** | **Access** | **Article** | **Article Category** | **Podcast** | **Podcast Episode** | **Podcast Episode Link** | **Archived Issue** | **Editorial Board Position** | **Editorial Board Member** |
| --------------- | ---------- | ---------- | ----------- | -------------------- | ----------- | ------------------- | ------------------------ | ------------------ | ---------------------------- | -------------------------- |
| **Contributor** | View       | Own        | ✅          | ❌                   | ✅          | ✅                  | ✅                       | ❌                 | ❌                           | ❌                         |
|                 | Create     | Own        | ✅          | ❌                   | ✅          | ✅                  | ✅                       | ❌                 | ❌                           | ❌                         |
|                 | Update     | Own        | ✅          | ❌                   | ✅          | ✅                  | ✅                       | ❌                 | ❌                           | ❌                         |
|                 | Delete     | Own        | ✅          | ❌                   | ✅          | ✅                  | ✅                       | ❌                 | ❌                           | ❌                         |
|                 | Publish    | None       | ❌          | ❌                   | ❌          | ❌                  | ❌                       | ❌                 | ❌                           | ❌                         |
| **Author**      | View       | Own        | ✅          | ✅                   | ✅          | ✅                  | ✅                       | ✅                 | ✅                           | ✅                         |
|                 | Create     | Own        | ✅          | ✅                   | ✅          | ✅                  | ✅                       | ✅                 | ✅                           | ✅                         |
|                 | Update     | Own        | ✅          | ✅                   | ✅          | ✅                  | ✅                       | ✅                 | ✅                           | ✅                         |
|                 | Delete     | Own        | ✅          | ✅                   | ✅          | ✅                  | ✅                       | ✅                 | ✅                           | ✅                         |
|                 | Publish    | Own        | ✅          | ✅                   | ✅          | ✅                  | ✅                       | ✅                 | ✅                           | ✅                         |
| **Editor**      | View       | Own, Any   | ✅          | ✅                   | ✅          | ✅                  | ✅                       | ✅                 | ✅                           | ✅                         |
|                 | Create     | Own, Any   | ✅          | ✅                   | ✅          | ✅                  | ✅                       | ✅                 | ✅                           | ✅                         |
|                 | Update     | Own, Any   | ✅          | ✅                   | ✅          | ✅                  | ✅                       | ✅                 | ✅                           | ✅                         |
|                 | Delete     | Own, Any   | ✅          | ✅                   | ✅          | ✅                  | ✅                       | ✅                 | ✅                           | ✅                         |
|                 | Publish    | Own, Any   | ✅          | ✅                   | ✅          | ✅                  | ✅                       | ✅                 | ✅                           | ✅                         |

---

## Legend

- **Access**:
  - **Own**: Permissions apply only to the author’s own content or responsibilities.
  - **Any**: Permissions apply to all content or responsibilities in the system.
  - **None**: No permission is granted for the action.
- **✅**: Permission granted.
- **❌**: Permission denied.

---

## Entities Descriptions

| **Entity**                   | **Description**                                                        |
| ---------------------------- | ---------------------------------------------------------------------- |
| **Article**                  | Content pieces managed by authors.                                     |
| **Article Category**         | Categories under which articles are grouped.                           |
| **Podcast**                  | Podcasts managed by authors.                                           |
| **Podcast Episode**          | Individual episodes within a podcast series.                           |
| **Podcast Episode Link**     | Links associated with podcast episodes, such as external resources.    |
| **Archived Issue**           | Previously published content archived for reference.                   |
| **Editorial Board Position** | Roles or positions within the editorial board (e.g., Editor-in-Chief). |
| **Editorial Board Member**   | Individuals holding positions within the editorial board.              |

---

## Roles Explained

### **Contributor**

- **Capabilities**:
  - Limited to managing their own content (e.g., articles, podcasts, podcast episodes).
- **Restrictions**:
  - Cannot publish any content.
  - Cannot access or manage archived issues or editorial board roles/members.

### **Author**

- **Capabilities**:
  - Full control over their own content, including publishing and managing editorial board-related entities.
- **Restrictions**:
  - Cannot manage content created by others.

### **Editor**

- **Capabilities**:
  - Full control over all content and entities, including managing others' content, responsibilities, and publishing.
- **Restrictions**:
  - None.
