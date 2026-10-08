import { sql } from 'drizzle-orm';
import { pgTable, text } from 'drizzle-orm/pg-core';

export const accounts = pgTable('precidoc_accounts', {
  userId: text('user_id').primaryKey().notNull(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
