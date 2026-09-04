CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`invite` text NOT NULL,
	`host` text NOT NULL,
	`guest` text,
	`game` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`requests` text DEFAULT '[]' NOT NULL,
	`expires` integer NOT NULL
);
