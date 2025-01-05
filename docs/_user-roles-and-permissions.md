# User Roles and Permissions

This documentation outlines the permissions and actions available to users in the roles of **User**, **Administrator**, and **Owner**. Permissions are applied to two primary entities: **User** and **Author**.

---

## Roles and Permissions Overview

### 👤 User Roles
| **Role**          | **Level** | **Description**                                                                 |
|-------------------|-----------|---------------------------------------------------------------------------------|
| **Member**        | 3         | Standard user with limited access to their own account and author profile.      |
| **Administrator** | 2         | System administrator with full access to all user accounts and author profiles. |
| **Owner**         | 1         | System owner with full control over all user accounts and author profiles.      |

### 👤 User Entity Permissions
| **Role**          | **Action** | **Access** | **Notes**                                                           |
|-------------------|------------|------------|---------------------------------------------------------------------|
| **Member**        | view       | own        | Members can only view their own account information.                |
|                   | update     | own        | Members are allowed to update only their own account details.       |
| **Administrator** | view       | any        | Administrators can view all user accounts.                          |
|                   | create     | any        | Administrators can create accounts for non-owner roles.             |
|                   | update     | any        | Administrators can update accounts for all roles except for owners. |
|                   | delete     | any        | Administrators can delete accounts for all roles except for owners. |
| **Owner**         | view       | any        | Owners can view all user accounts.                                  |
|                   | create     | any        | Owners can create accounts for all roles, including other owners.   |
|                   | update     | any        | Owners can update any user account.                                 |
|                   | delete     | any        | Owners can delete any user account, including other owners.         |

### ✍️ Author Entity Permissions
| **Role**          | **Action** | **Access** | **Notes**                                                |
|-------------------|------------|------------|----------------------------------------------------------|
| **Member**        | view       | own        | Members can view their own author profile.               |
|                   | update     | own        | Members can update their own author profile information. |
| **Administrator** | view       | any        | Administrators can view all author profiles.             |
|                   | create     | any        | Administrators can create author profiles for any user.  |
|                   | update     | any        | Administrators can update all author profiles.           |
|                   | delete     | any        | Administrators can delete any author profiles.           |
| **Owner**         | view       | any        | Owners can view all author profiles.                     |
|                   | create     | any        | Owners can create author profiles for any user.          |
|                   | update     | any        | Owners can update any author profile.                    |
|                   | delete     | any        | Owners can delete any author profile.                    |

---

## Legend

- **Access**:
  - **Own**: Permissions apply only to the user’s own data or associated content.
  - **Any**: Permissions apply to all data or content in the system.
  - **Not owner**: Permissions apply to all entities except those owned by users with the "Owner" role.
- **Notes**: Provides additional context or restrictions for specific actions and roles.

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

