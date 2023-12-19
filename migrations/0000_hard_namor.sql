CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`author_name` text NOT NULL,
	`content` text NOT NULL
);
