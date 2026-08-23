import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

import { hash, verify } from "@node-rs/argon2";
import { Redis } from "ioredis";

const redis = new Redis(env.REDIS_URL);

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    requireEmailVerification: false,
    password: {
      hash: (password) =>
        hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 }),
      verify: ({ hash: h, password }) => verify(h, password),
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    customRules: {
      "/sign-in/email": { window: 300, max: 5 },
      "/sign-up/email": { window: 3600, max: 3 },
    },
    storage: "secondary-storage",
  },

  secondaryStorage: {
    get: (key) => redis.get(key),
    set: (key, value, ttl) =>
      ttl
        ? redis.set(key, value, "EX", ttl).then(() => undefined)
        : redis.set(key, value).then(() => undefined),
    delete: (key) => redis.del(key).then(() => undefined),
    getAndDelete: async (key) => {
      const value = await redis.get(key);
      if (value !== null) await redis.del(key);
      return value;
    },
    increment: async (key, ttl) => {
      const value = await redis.incrby(key, 1);
      if (ttl) await redis.expire(key, ttl);
      return value;
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // interdit au client de s'auto-attribuer un rôle
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 jours
    updateAge: 60 * 60 * 24, // refresh quotidien
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // cache session 5 min
    },
  },

  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    nextCookies(), // doit rester en dernier
  ],
});

export type Session = typeof auth.$Infer.Session;
