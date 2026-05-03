import {
    pgTable,
    serial,
    varchar,
    boolean,
    text,
    timestamp,
    integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),

    firstName: varchar("first_name", { length: 50 }).notNull(),
    lastName: varchar("last_name", { length: 50 }),

    profileImageURL: text("profile_image_url"),

    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),

    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const clients = pgTable("clients", {
    id: serial("id").primaryKey(),

    name: varchar("name", { length: 100 }).notNull(),

    clientId: varchar("client_id", { length: 255 }).notNull().unique(),
    clientSecretHash: varchar("client_secret_hash", { length: 255 }),

    redirectUris: text("redirect_uris").array().notNull(),
    allowedScopes: text("allowed_scopes").array().notNull(),

    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const authorizationCodes = pgTable("authorization_codes", {
    code: varchar("code", { length: 255 }).primaryKey(),

    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    clientId: integer("client_id")
        .notNull()
        .references(() => clients.id, { onDelete: "cascade" }),

    redirectUri: text("redirect_uri").notNull(),

    scopes: text("scopes").array().notNull(),

    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
    id: serial("id").primaryKey(),

    tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),

    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    clientId: integer("client_id")
        .notNull()
        .references(() => clients.id, { onDelete: "cascade" }),

    grantedScopes: text("granted_scopes").array().notNull(),

    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authSessions = pgTable("auth_sessions", {
    id: serial("id").primaryKey(),

    sessionTokenHash: varchar("session_token_hash", { length: 255 })
        .notNull()
        .unique(),

    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),

    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
