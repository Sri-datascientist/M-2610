export {
  useStore as useDoctorStore,
  useStore,
  getState,
  setState,
  actions,
} from "@/lib/store";

export type {
  Saved,
  AdrReport,
  AdrReport as DraftReport,
  Formulation,
  Notification,
  SupportRequest,
  Publication,
  LibraryContribution,
  DoctorReferral,
  DoctorReferralAccount,
  ReferralStatus,
} from "@/lib/store";

export {
  StoreProvider as AdminStoreProvider,
  useStore as useAdminStore,
  DEMO_ACCOUNTS,
} from "@/lib/admin-store";
