/// <reference types="lucia" />

import {
  EmailAddress,
  UserDisplayName,
  UserHandle,
} from "@fieldzoo/system-model";

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

declare global {
  namespace App {
    // interface Error {}
    // interface PageData {}
    // interface Platform {}

    interface Locals {
      lucia: import("$lib/server/lucia").Lucia;
      auth: import("lucia").AuthRequest;
      repos: import("$lib/server/database-repos").DatabaseRepos;
    }
  }

  namespace Lucia {
    type Auth = import("$lib/server/lucia").Lucia;
    type DatabaseUserAttributes = {
      email: EmailAddress;
      emailVerified: boolean;
      displayName: UserDisplayName | null;
      userHandle: UserHandle | null;
      lastLoginAt: Date | null;
      disabledAt: Date | null;
    };
    type DatabaseSessionAttributes = Record<never, any>;
  }
}

export {}; // important
