import { describe, expect, it } from "vitest";
import {
  grantedPermissions,
  profileFieldError,
  profilePermissionGroups,
  rolesFromAccount,
} from "@/features/admin/profile-details";

describe("administrator profile details", () => {
  it("requires a name and a valid email", () => {
    expect(profileFieldError({ name: " ", email: "admin@meyveda.com" })).toBe("Enter a full name.");
    expect(profileFieldError({ name: "Ananya Iyer", email: "not-an-email" })).toBe(
      "Enter a valid email address.",
    );
    expect(profileFieldError({ name: "Ananya Iyer", email: "admin@meyveda.com" })).toBeNull();
  });

  it("grants only permissions configured for the role", () => {
    const granted = grantedPermissions(rolesFromAccount(["Platform Administrator"], "Platform Administrator"));
    const clinical = profilePermissionGroups.find((group) => group.title === "Clinical case review");
    expect(clinical?.permissions).toEqual([]);
    expect(granted.has("Review doctors")).toBe(true);
    expect(granted.has("Manage users")).toBe(true);
    expect(
      profilePermissionGroups
        .flatMap((group) => group.permissions)
        .filter((permission) => !granted.has(permission)),
    ).toEqual([]);
  });
});
