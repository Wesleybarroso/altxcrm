CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`action` varchar(120) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` int,
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `domains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`domain` varchar(255) NOT NULL,
	`status` enum('pending','verified','suspended') NOT NULL DEFAULT 'pending',
	`dnsTarget` varchar(255) NOT NULL DEFAULT 'mx.altx.io',
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `domains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`mailboxId` int NOT NULL,
	`threadId` varchar(80),
	`senderEmail` varchar(320) NOT NULL,
	`senderName` varchar(160),
	`toEmails` text NOT NULL,
	`ccEmails` text,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`folder` enum('inbox','sent','archived','trash','draft') NOT NULL DEFAULT 'inbox',
	`isRead` tinyint NOT NULL DEFAULT 0,
	`isStarred` tinyint NOT NULL DEFAULT 0,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mailboxes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`domainId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`role` varchar(120) NOT NULL DEFAULT 'Equipe',
	`quotaGb` int NOT NULL DEFAULT 10,
	`usedGb` int NOT NULL DEFAULT 0,
	`status` enum('active','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mailboxes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`secret` varchar(255) NOT NULL,
	`events` text NOT NULL,
	`status` enum('active','paused') NOT NULL DEFAULT 'active',
	`lastDeliveryAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaceSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`storageLimitGb` int NOT NULL DEFAULT 200,
	`providerLabel` varchar(160) NOT NULL DEFAULT 'VPS Altx · Produção',
	`integrationEndpoint` varchar(1024) NOT NULL DEFAULT 'api.altx.io/v1/mail',
	`mfaRequired` tinyint NOT NULL DEFAULT 1,
	`securityAlerts` tinyint NOT NULL DEFAULT 1,
	`auditLogEnabled` tinyint NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaceSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaceSettings_ownerId_unique` UNIQUE(`ownerId`)
);
--> statement-breakpoint
ALTER TABLE `activityLogs` ADD CONSTRAINT `activityLogs_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `domains` ADD CONSTRAINT `domains_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailMessages` ADD CONSTRAINT `emailMessages_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailMessages` ADD CONSTRAINT `emailMessages_mailboxId_mailboxes_id_fk` FOREIGN KEY (`mailboxId`) REFERENCES `mailboxes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mailboxes` ADD CONSTRAINT `mailboxes_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mailboxes` ADD CONSTRAINT `mailboxes_domainId_domains_id_fk` FOREIGN KEY (`domainId`) REFERENCES `domains`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhooks` ADD CONSTRAINT `webhooks_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaceSettings` ADD CONSTRAINT `workspaceSettings_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;