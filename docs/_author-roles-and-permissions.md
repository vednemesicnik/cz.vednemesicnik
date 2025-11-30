# Author Roles and Permissions

This document describes access rights and actions available for different roles in the system.

## Roles Overview

| **Role**        | **Level** | **Description**                                                                                                                |
|-----------------|-----------|--------------------------------------------------------------------------------------------------------------------------------|
| **Contributor** | 3         | Content creator with limited access to their own drafts. Requires review before publishing.                                    |
| **Creator**     | 2         | Content creator with extended access to their own drafts and published content. Requires Coordinator review before publishing. |
| **Coordinator** | 1         | Content manager with full access to all drafts, published content, and archived content. Can self-publish without review.      |

### Role Level Hierarchy

The **level** field establishes a hierarchical authority structure for content review and approval workflows:

- **Level 1 (Coordinator)**: Highest authority - can review and approve content from all roles
- **Level 2 (Creator)**: Mid-level authority - can review and approve Contributor content
- **Level 3 (Contributor)**: Entry level - cannot review others' content

Lower level numbers indicate higher authority. This hierarchy prevents privilege escalation and ensures quality control through mandatory review processes.

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
- **Review Requirement**: Must obtain review and approval from a Creator (level 2) or Coordinator (level 1) before content can be published.

### **Creator**
- Extended permissions compared to Contributor: can publish, retract, and archive their own content.
- Can manage content in Draft and Published states.
- Can review and approve Contributor content.
- **Review Requirement**: Must obtain review and approval from a Coordinator (level 1) before publishing their own content.

### **Coordinator**
- Full access to any content (own or others') in Draft, Published, and Archived states.
- Can create, update, delete, publish, retract, archive, and restore content.
- Can review and approve content from all roles.
- **No Review Required**: Can self-publish content without approval.

---

## Content Review Workflow (Strict Review)

The system implements a **Strict Review** workflow to ensure content quality and editorial oversight:

### Review Requirements by Role

| **Author Role** | **Level** | **Can Publish Without Review?** | **Required Reviewer Level** | **Who Can Review?** |
|-----------------|-----------|----------------------------------|------------------------------|---------------------|
| Contributor     | 3         | ❌ No                             | ≤ 2                          | Creator or Coordinator |
| Creator         | 2         | ❌ No                             | = 1                          | Coordinator only |
| Coordinator     | 1         | ✅ Yes                            | N/A                          | No review needed |

### Review Authority Rules

Content can only be reviewed and approved by authors with **higher authority** (lower level number):

```
reviewer.role.level < contentAuthor.role.level
```

**Examples:**
- ✅ Coordinator (level 1) can review Creator (level 2) content
- ✅ Coordinator (level 1) can review Contributor (level 3) content
- ✅ Creator (level 2) can review Contributor (level 3) content
- ❌ Creator (level 2) CANNOT review Coordinator (level 1) content
- ❌ Contributor (level 3) CANNOT review anyone's content

### Workflow Process

1. **Content Creation**
   - Author creates content in Draft state
   - Content remains in Draft until reviewed (if required)

2. **Review Submission**
   - Author submits content for review
   - System identifies eligible reviewers based on level hierarchy

3. **Review & Approval**
   - Reviewer with sufficient authority reviews content
   - Reviewer can approve, request changes, or reject

4. **Publishing**
   - Once approved (or if no review required), content can be published
   - Content transitions from Draft to Published state

### Benefits of Strict Review

- **Quality Control**: All content from Contributors and Creators undergoes editorial review
- **Mentorship**: Higher-level authors provide feedback to lower-level authors
- **Accountability**: Clear approval chain for published content
- **Flexibility**: Coordinators can fast-track urgent content by self-publishing
