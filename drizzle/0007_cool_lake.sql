ALTER TABLE `domains` MODIFY COLUMN `dnsTarget` varchar(255);--> statement-breakpoint
ALTER TABLE `workspaceSettings` MODIFY COLUMN `providerLabel` varchar(160);--> statement-breakpoint
ALTER TABLE `workspaceSettings` MODIFY COLUMN `integrationEndpoint` varchar(1024);