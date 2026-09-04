import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{
 id:text('id').primaryKey(),invite:text('invite').notNull(),host:text('host').notNull(),guest:text('guest'),
 game:text('game').notNull(),revision:integer('revision').notNull().default(0),
 requests:text('requests').notNull().default('[]'),expires:integer('expires').notNull()
});
