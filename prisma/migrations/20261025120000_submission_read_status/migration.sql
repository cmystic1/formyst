ALTER TABLE `Submission` ADD COLUMN `readAt` DATETIME(3) NULL;
CREATE INDEX `Submission_formId_readAt_idx` ON `Submission`(`formId`, `readAt`);
