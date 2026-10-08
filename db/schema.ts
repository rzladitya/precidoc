import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const accounts = pgTable('precidoc_accounts', {
  userId: text('user_id').primaryKey().notNull(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const newsletter = pgTable('precidoc_newsletter', {
  email: text('email').primaryKey().notNull(),
  locale: text('locale').notNull(),
  unsubscribeToken: text('unsubscribe_token').unique().notNull(),
  consentVersion: text('consent_version').notNull(),
  consentAt: timestamp('consent_at', { withTimezone: true }).notNull().defaultNow(),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
});
export const newsletterRate = pgTable('precidoc_newsletter_rate', {
  fingerprint: text('fingerprint').primaryKey().notNull(),
  bucket: integer('bucket').notNull(),
  attempts: integer('attempts').notNull(),
});
