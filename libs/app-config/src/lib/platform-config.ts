/**
 * Module that populates and validates the platform configuration.
 */

import { Type } from "@sinclair/typebox";
import { StandardValidator } from "typebox-validators";

import { InvalidEnvironmentException } from "@fieldzoo/env-config";
import {
  LocalhostUrlString,
  NonEmptyString,
  UrlString,
} from "@fieldzoo/typebox-types";

/**
 * General platform configuration.
 */
export class PlatformConfig {
  static schema = Type.Object({
    NEXT_PUBLIC_SUPABASE_URL: Type.Union([UrlString(), LocalhostUrlString()], {
      description: "URL for the Supabase project",
      errorMessage: "Must be a URL, possibly localhost",
    }),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: NonEmptyString({
      description: "Anonymous key for the Supabase project",
      errorMessage: "Must be a non-empty string",
    }),
  });

  /**
   * Constructs the platform configuration from environment variables.
   */
  constructor() {
    const values = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    };

    const validator = new StandardValidator(PlatformConfig.schema);
    try {
      validator.validate(values);
    } catch (e: any) {
      throw InvalidEnvironmentException.fromTypeBoxErrors(e.errors);
    }

    // The Supabase client will read the environment variables directly.
  }

  /**
   * Returns help information for the expected environment variables.
   *
   * @returns An object mapping environment variable names to text that
   *  can be used to describe the environment variables in help output.
   */
  static getHelpInfo(): [string, string][] {
    return Object.entries(this.schema.properties).map(([key, value]) => [
      key,
      value.description!,
    ]);
  }
}
