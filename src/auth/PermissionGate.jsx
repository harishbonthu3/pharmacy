import { useAuth } from "./AuthContext";

/**
 * Usage:
 * <PermissionGate any={[PERMS.MEDICINES_EDIT]}>...</PermissionGate>
 */
export default function PermissionGate({ any = [], children, fallback = null }) {
  const { hasAnyPerm } = useAuth();
  if (!hasAnyPerm(any)) return fallback;
  return children;
}