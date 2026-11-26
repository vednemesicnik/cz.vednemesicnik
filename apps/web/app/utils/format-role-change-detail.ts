// Formats a role change for the audit log `detail` field, e.g.
// "role: member → administrator". Kept in its own prisma-free module so it can be
// unit-tested without importing db.server.
export const formatRoleChangeDetail = (from: string, to: string): string =>
  `role: ${from} → ${to}`
