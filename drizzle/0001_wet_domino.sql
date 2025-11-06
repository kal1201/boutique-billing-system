CREATE TABLE `offers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`discount_percent` real,
	`discount_amount` real,
	`valid_from` text,
	`valid_until` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `bills` ADD `loyalty_points_redeemed` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bills` ADD `loyalty_points_earned` integer DEFAULT 0 NOT NULL;