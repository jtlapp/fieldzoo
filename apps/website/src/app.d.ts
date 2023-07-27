/// <reference types="lucia" />

import { EmailAddress, UserName, UserHandle } from "@fieldzoo/system-model";

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

declare global {
  namespace App {
    // interface Error {}
    // interface PageData {}
    // interface Platform {}

    interface Locals {
      auth: import("lucia").AuthRequest;
    }
  }

  namespace Lucia {
    type Auth = import("$lib/server/lucia").Auth;
    type DatabaseUserAttributes = {
      email: EmailAddress;
      name: UserName;
      handle: UserHandle;
      lastLoginAt: Date | null;
      disabledAt: Date | null;
    };
    type DatabaseSessionAttributes = Record<never, any>;
  }
}

export {}; // important
