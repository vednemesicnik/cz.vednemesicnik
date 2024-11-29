# User Roles and Permissions

This documentation outlines the permissions and actions available to users in the roles of **User**, **Administrator**, and **Owner**. Permissions are applied to two primary entities: **User** and **Author**.

---

## Roles and Permissions Overview

| **Role**          | **Action**               | **Access** | **👤 User** | **✍️ Author** |
|-------------------|--------------------------|------------|-------------|---------------|
| **User**          | View                     | Own        | ✅           | ✅             |
|                   | Create                   | None       | ❌           | ❌             |
|                   | Update                   | Own        | ✅           | ✅             |
|                   | Delete                   | None       | ❌           | ❌             |
|                   | Assign Role: Owner       | None       | ❌           | ❌             |
|                   | Assign Role: Admin       | None       | ❌           | ❌             |
|                   | Assign Role: User        | None       | ❌           | ❌             |
|                   | Assign Role: Editor      | None       | ❌           | ❌             |
|                   | Assign Role: Author      | None       | ❌           | ❌             |
|                   | Assign Role: Contributor | None       | ❌           | ❌             |
| **Administrator** | View                     | Own, Any   | ✅           | ✅             |
|                   | Create                   | Own, Any   | ✅           | ✅             |
|                   | Update                   | Own, Any   | ✅           | ✅             |
|                   | Delete                   | Own, Any   | ✅           | ✅             |
|                   | Assign Role: Owner       | None       | ❌           | ❌             |
|                   | Assign Role: Admin       | Own, Any   | ✅           | ❌             |
|                   | Assign Role: User        | Own, Any   | ✅           | ❌             |
|                   | Assign Role: Editor      | Own, Any   | ❌           | ✅             |
|                   | Assign Role: Author      | Own, Any   | ❌           | ✅             |
|                   | Assign Role: Contributor | Own, Any   | ❌           | ✅             |
| **Owner**         | View                     | Own, Any   | ✅           | ✅             |
|                   | Create                   | Own, Any   | ✅           | ✅             |
|                   | Update                   | Own, Any   | ✅           | ✅             |
|                   | Delete                   | Own, Any   | ✅           | ✅             |
|                   | Assign Role: Owner       | Own, Any   | ✅           | ❌             |
|                   | Assign Role: Admin       | Own, Any   | ✅           | ❌             |
|                   | Assign Role: User        | Own, Any   | ✅           | ❌             |
|                   | Assign Role: Editor      | Own, Any   | ❌           | ✅             |
|                   | Assign Role: Author      | Own, Any   | ❌           | ✅             |
|                   | Assign Role: Contributor | Own, Any   | ❌           | ✅             |

---

## Legend

- **Access**:
  - **Own**: Permissions apply only to the user’s own data or associated content.
  - **Any**: Permissions apply to all data or content in the system.
  - **None**: No permission is granted for the action.
- **✅**: Permission granted.
- **❌**: Permission denied.

---

## Entities Descriptions

| **Entity** | **Description**                                  |
|------------|--------------------------------------------------|
| **User**   | System users with access to CMS or system tools. |
| **Author** | Content creators and managers within the system. |

---

## Roles Explained

### **User**

- **Capabilities**:
  - Can view and update their own **User** and **Author** entities.
- **Restrictions**:
  - Cannot create, delete, or assign roles.

### **Administrator**

- **Capabilities**:
  - Full management of both **User** and **Author** entities.
  - Can assign roles such as **Admin**, **User**, **Editor**, **Author**, and **Contributor**.
- **Restrictions**:
  - Cannot assign the **Owner** role.

### **Owner**

- **Capabilities**:
  - Full control over all actions and entities.
  - Can assign any role, including the **Owner** role.
- **Restrictions**:
  - Limited to one active **Owner** at a time.
