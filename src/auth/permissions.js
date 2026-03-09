// src/auth/permissions.js
export const PERMS = {
  DASHBOARD_VIEW: "dashboard:view",

  MEDICINES_VIEW: "medicines:view",
  MEDICINES_CREATE: "medicines:create",
  MEDICINES_EDIT: "medicines:edit",
  MEDICINES_DELETE: "medicines:delete",

  BILLING_VIEW: "billing:view",
  BILLING_CREATE: "billing:create",
  BILLING_REFUND: "billing:refund",

  PURCHASES_VIEW: "purchases:view",
  PURCHASES_CREATE: "purchases:create",
  PURCHASES_EDIT: "purchases:edit",
  PURCHASES_DELETE: "purchases:delete",

  SUPPLIERS_VIEW: "suppliers:view",
  SUPPLIERS_CREATE: "suppliers:create",
  SUPPLIERS_EDIT: "suppliers:edit",
  SUPPLIERS_DELETE: "suppliers:delete",

  CUSTOMERS_VIEW: "customers:view",
  CUSTOMERS_CREATE: "customers:create",
  CUSTOMERS_EDIT: "customers:edit",
  CUSTOMERS_DELETE: "customers:delete",

  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export"
};

// Default permission matrix (demo). Backend later replace.
export const ROLE_DEFAULT_PERMISSIONS = {
  ADMIN: Object.values(PERMS),

  PHARMACIST: [
    PERMS.DASHBOARD_VIEW,

    PERMS.MEDICINES_VIEW,
    PERMS.MEDICINES_CREATE,
    PERMS.MEDICINES_EDIT,
    // delete optional (keep disabled for pharmacist)
    // PERMS.MEDICINES_DELETE,

    PERMS.BILLING_VIEW,
    PERMS.BILLING_CREATE,
    PERMS.BILLING_REFUND,

    PERMS.PURCHASES_VIEW,
    PERMS.PURCHASES_CREATE,
    PERMS.PURCHASES_EDIT,

    PERMS.SUPPLIERS_VIEW,
    PERMS.SUPPLIERS_CREATE,
    PERMS.SUPPLIERS_EDIT,

    PERMS.CUSTOMERS_VIEW,
    PERMS.CUSTOMERS_CREATE,
    PERMS.CUSTOMERS_EDIT
  ],

  CASHIER: [
    PERMS.DASHBOARD_VIEW,

    PERMS.MEDICINES_VIEW, // view only

    PERMS.BILLING_VIEW,
    PERMS.BILLING_CREATE,
    // refund optional for cashier (enabled here)
    PERMS.BILLING_REFUND,

    PERMS.CUSTOMERS_VIEW,
    PERMS.CUSTOMERS_CREATE,
    PERMS.CUSTOMERS_EDIT
  ]
};