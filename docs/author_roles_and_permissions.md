# Author Roles and Permissions

This documentation outlines the permissions associated with the roles of **Contributor**, **Author**, and **Editor** in the context of managing content entities such as podcasts, articles, and archived issues. The permissions specify actions, access levels, and applicable entities.

---

## Roles and Permissions Overview

| **Role**        | **Action** | **Access** | **Archived Issue** | **Podcast** | **Podcast Episode** | **Podcast Episode Link** | **Article** | **Article Category** |
| --------------- | ---------- | ---------- | ------------------ | ----------- | ------------------- | ------------------------ | ----------- | -------------------- |
| **Contributor** | View       | Own        | ❌                 | ✅          | ✅                  | ✅                       | ✅          | ❌                   |
|                 | Create     | Own        | ❌                 | ✅          | ✅                  | ✅                       | ✅          | ❌                   |
|                 | Update     | Own        | ❌                 | ✅          | ✅                  | ✅                       | ✅          | ❌                   |
|                 | Delete     | Own        | ❌                 | ✅          | ✅                  | ✅                       | ✅          | ❌                   |
| **Author**      | View       | Own        | ❌                 | ✅          | ✅                  | ✅                       | ✅          | ❌                   |
|                 | Create     | Own        | ❌                 | ✅          | ✅                  | ✅                       | ✅          | ❌                   |
|                 | Update     | Own        | ❌                 | ✅          | ✅                  | ✅                       | ✅          | ❌                   |
|                 | Delete     | Own        | ❌                 | ✅          | ✅                  | ✅                       | ✅          | ❌                   |
|                 | Publish    | Own        | ❌                 | ✅          | ✅                  | ✅                       | ✅          | ❌                   |
|                 | View       | Any        | ❌                 | ❌          | ❌                  | ❌                       | ❌          | ✅                   |
|                 | Update     | Any        | ❌                 | ❌          | ❌                  | ❌                       | ❌          | ✅                   |
| **Editor**      | View       | Own, Any   | ✅                 | ✅          | ✅                  | ✅                       | ✅          | ✅                   |
|                 | Create     | Own, Any   | ✅                 | ✅          | ✅                  | ✅                       | ✅          | ✅                   |
|                 | Update     | Own, Any   | ✅                 | ✅          | ✅                  | ✅                       | ✅          | ✅                   |
|                 | Delete     | Own, Any   | ✅                 | ✅          | ✅                  | ✅                       | ✅          | ✅                   |
|                 | Publish    | Own, Any   | ✅                 | ✅          | ✅                  | ✅                       | ✅          | ✅                   |

---

## Legend

- **✅**: Permission granted.
- **❌**: Permission denied.

---

## Roles Explained

### **Contributor**

- **View, Create, Update, Delete (Own)**:
  - **Entities**: Podcasts, Podcast Episodes, Podcast Episode Links, Articles.
  - **Restrictions**: Cannot access **Archived Issues** or manage **Article Categories**.

### **Author**

- **View, Create, Update, Delete, Publish (Own)**:
  - **Entities**: Podcasts, Podcast Episodes, Podcast Episode Links, Articles.
- **View, Update (Any)**:
  - **Entities**: Article Categories.
  - **Restrictions**: Limited to managing their own content, except for categories.

### **Editor**

- **View, Create, Update, Delete, Publish (Own, Any)**:
  - **Entities**: All listed entities.
- **Capabilities**:
  - Manage and reassign authorship of content.
  - Full control over content entities and categories.

---

## Entities Descriptions

| **Entity**               | **Description**                                                              |
| ------------------------ | ---------------------------------------------------------------------------- |
| **Archived Issue**       | Previously published content archived for reference.                         |
| **Podcast**              | Podcasts managed in the system.                                              |
| **Podcast Episode**      | Individual episodes within a podcast series.                                 |
| **Podcast Episode Link** | Links associated with podcast episodes, such as external resources.          |
| **Article**              | Articles managed in the system.                                              |
| **Article Category**     | Categories under which articles are organized for better content management. |
