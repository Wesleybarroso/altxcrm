CREATE TABLE `whatsappSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`openwaSessionId` varchar(120) NOT NULL,
	`name` varchar(80) NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'created',
	`phone` varchar(40),
	`pushName` varchar(160),
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsappSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsappSessions_openwaSessionId_unique` UNIQUE(`openwaSessionId`)
);
--> statement-breakpoint
ALTER TABLE `workspaceSettings` ADD `openwaBaseUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `workspaceSettings` ADD `openwaApiKeyEncrypted` text;--> statement-breakpoint
ALTER TABLE `whatsappSessions` ADD CONSTRAINT `whatsappSessions_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;