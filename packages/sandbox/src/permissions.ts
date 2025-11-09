import type { PermissionContext, PermissionGrant } from '@frw/common';

export class PermissionManager {
  private permissions: Map<PermissionContext, boolean>;

  constructor() {
    this.permissions = new Map();
  }

  grant(context: PermissionContext, allowed = true): void {
    this.permissions.set(context, allowed);
  }

  revoke(context: PermissionContext): void {
    this.permissions.delete(context);
  }

  has(context: PermissionContext): boolean {
    return this.permissions.get(context) === true;
  }

  require(context: PermissionContext): void {
    if (!this.has(context)) {
      throw new Error(`Permission denied: ${context}`);
    }
  }

  list(): PermissionGrant[] {
    return Array.from(this.permissions.entries())
      .filter(([, allowed]) => allowed)
      .map(([context]) => ({
        context,
        granted: true,
        grantedAt: Date.now()
      }));
  }

  clear(): void {
    this.permissions.clear();
  }
}
