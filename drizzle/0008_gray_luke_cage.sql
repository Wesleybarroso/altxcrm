CREATE TABLE `authAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(32) NOT NULL,
	`providerAccountId` varchar(191) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `authAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `authAccounts_provider_account_unique` UNIQUE(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `passwordResetTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResetTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResetTokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` text;--> statement-breakpoint
ALTER TABLE `authAccounts` ADD CONSTRAINT `authAccounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `passwordResetTokens` ADD CONSTRAINT `passwordResetTokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `authAccounts_user_id_idx` ON `authAccounts` (`userId`);--> statement-breakpoint
CREATE INDEX `passwordResetTokens_user_id_idx` ON `passwordResetTokens` (`userId`);--> statement-breakpoint
CREATE INDEX `passwordResetTokens_expires_at_idx` ON `passwordResetTokens` (`expiresAt`);