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

### Role Level Hierarchy

The **level** field establishes a hierarchical authority structure for role assignment and access control:

- **Level 1 (Owner)**: Highest authority - can assign Administrator and Member roles; the Owner role cannot be assigned to anyone (single-owner policy)
- **Level 2 (Administrator)**: Mid-level authority - can assign Administrator and Member roles, but NOT Owner
- **Level 3 (Member)**: Entry level - cannot assign roles to others

Lower level numbers indicate higher authority. This hierarchy prevents privilege escalation by ensuring users can only assign roles at their level or below.

**How it works:**
When assigning roles, users can only assign roles with a level greater than or equal to their own level.

**Examples:**
- ✅ Administrator (level 2) can assign Administrator (level 2) or Member (level 3) roles
- ❌ Administrator (level 2) CANNOT assign Owner (level 1) role
- ✅ Owner (level 1) can assign Administrator (level 2) or Member (level 3) roles
- ❌ Owner (level 1) CANNOT assign the Owner role — the system has exactly one Owner (single-owner policy)
- ❌ Member (level 3) cannot assign any roles (no administrative access)

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
|                   | create     | any        | Owners can create accounts for Administrator and Member roles; the Owner role cannot be assigned (single-owner policy). |
|                   | update     | any        | Owners can update any user account (including the Owner profile), but the Owner's role cannot be changed. |
|                   | delete     | any        | Owners can delete any user account except the sole Owner account.   |

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
- **Notes**: Provides additional context or restrictions for specific actions and roles.

---

## Entities Descriptions

| **Entity** | **Description**                                  |
|------------|--------------------------------------------------|
| **User**   | System users with access to CMS or system tools. |
| **Author** | Content creators and managers within the system. |

---

## Roles Explained

### **Member** (User Role - Level 3)

- **Capabilities**:
  - Can view and update their own **User** account.
  - Can view and update their own **Author** profile.
- **Restrictions**:
  - Cannot assign any roles (no administrative access).
  - Cannot create or delete any accounts.
  - Cannot access other users' accounts or author profiles.

### **Administrator** (User Role - Level 2)

- **Capabilities**:
  - Full management of both **User** and **Author** entities.
  - Can assign **User roles** with level ≥ 2: Administrator, Member.
  - Can assign **Author roles**: Coordinator, Creator, Contributor (see Author Roles documentation).
  - Can view all user accounts, including Owner accounts.
  - Can create accounts for Administrator and Member roles.
  - Can update and delete accounts for Members and other Administrators.
- **Restrictions**:
  - Cannot assign roles with level < 2 (cannot assign Owner role).
  - Cannot create, update, or delete **Owner** accounts (level 1 is protected by role hierarchy).

### **Owner** (User Role - Level 1)

- **Capabilities**:
  - Full control over all actions and entities in the system.
  - Can assign **User roles** Administrator and Member; the Owner role cannot be assigned (single-owner policy).
  - Can assign **Author roles**: Coordinator, Creator, Contributor.
  - Can create, view, update, and delete user accounts and author profiles.
- **Restrictions**:
  - Exactly one **Owner** exists, created from the database seed.
  - The Owner role cannot be assigned to anyone, nor changed away from the Owner account (enforced server-side).
  - The sole Owner account cannot be deleted.

