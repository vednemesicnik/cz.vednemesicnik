# User Roles and Permissions

This documentation outlines the permissions associated with users in the roles of **Author**, **Administrator**, and **Owner**, including permissions for role assignments and content management.

---

## Roles and Permissions Overview

| **Role**          | **Action**          | **Access** | **User** | **Editorial Board Position** | **Editorial Board Member** |
| ----------------- | ------------------- | ---------- | -------- | ---------------------------- | -------------------------- |
| **Author (User)** | View                | Own        | ❌       | ✅                           | ✅                         |
|                   | Create              | Own        | ❌       | ✅                           | ✅                         |
|                   | Update              | Own        | ❌       | ✅                           | ✅                         |
|                   | Delete              | Own        | ❌       | ✅                           | ✅                         |
| **Administrator** | View                | Own, Any   | ✅       | ✅                           | ✅                         |
|                   | Create              | Own, Any   | ✅       | ✅                           | ✅                         |
|                   | Update              | Own, Any   | ✅       | ✅                           | ✅                         |
|                   | Delete              | Own, Any   | ✅       | ✅                           | ✅                         |
|                   | Assign Role: Admin  | Own, Any   | ✅       | ❌                           | ❌                         |
|                   | Assign Role: Author | Own, Any   | ✅       | ❌                           | ❌                         |
| **Owner**         | View                | Own, Any   | ✅       | ✅                           | ✅                         |
|                   | Create              | Own, Any   | ✅       | ✅                           | ✅                         |
|                   | Update              | Own, Any   | ✅       | ✅                           | ✅                         |
|                   | Delete              | Own, Any   | ✅       | ✅                           | ✅                         |
|                   | Assign Role: Owner  | Own, Any   | ✅       | ❌                           | ❌                         |
|                   | Assign Role: Admin  | Own, Any   | ✅       | ❌                           | ❌                         |
|                   | Assign Role: Author | Own, Any   | ✅       | ❌                           | ❌                         |

---

## Legend

- **Access**:
  - **Own**: Permissions apply only to the user's own content or assignments.
  - **Any**: Permissions apply to all content or assignments in the system.
- **✅**: Permission granted.
- **❌**: Permission denied.

---

## Roles Explained

### **Author (User)**

- **Capabilities**:
  - Can manage **Editorial Board Positions** and **Editorial Board Members** for their own content.
- **Restrictions**:
  - Cannot manage Users or assign roles.

### **Administrator**

- **Capabilities**:
  - Can manage Users and Editorial Board entities for all users (Own and Any).
  - Can assign the **Administrator** and **Author** roles.
- **Restrictions**:
  - Cannot assign the **Owner** role.

### **Owner**

- **Capabilities**:
  - Full access to all entities and actions.
  - Can assign any role, including the **Owner** role.
- **Restrictions**:
  - There can only be one active **Owner** at any time.

---

## Entities Descriptions

| **Entity**                   | **Description**                                                            |
| ---------------------------- | -------------------------------------------------------------------------- |
| **User**                     | System users with access to the CMS or system tools.                       |
| **Editorial Board Position** | Positions within the editorial board (e.g., Editor-in-Chief, Contributor). |
| **Editorial Board Member**   | Members holding specific positions in the editorial board.                 |
