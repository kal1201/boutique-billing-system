ALTER TABLE `products` ADD `sku` text NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `description` text;--> statement-breakpoint
ALTER TABLE `products` ADD `low_stock_threshold` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);