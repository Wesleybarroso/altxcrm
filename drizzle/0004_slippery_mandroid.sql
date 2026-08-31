CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`patientName` varchar(160) NOT NULL,
	`patientPhone` varchar(40),
	`patientEmail` varchar(320),
	`service` varchar(160) NOT NULL,
	`professional` varchar(160) NOT NULL,
	`room` varchar(80),
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`status` enum('scheduled','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`source` enum('manual','whatsapp') NOT NULL DEFAULT 'manual',
	`whatsappChatId` varchar(160),
	`confirmationSentAt` timestamp,
	`reminderSentAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;