ALTER TABLE `Form` ADD COLUMN `background` LONGTEXT NULL;
UPDATE `Form` SET `background` = '' WHERE `background` IS NULL;
ALTER TABLE `Form` MODIFY `background` LONGTEXT NOT NULL;
