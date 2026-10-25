-- Google identity is unique per user; NULL keeps password-only users unchanged.
ALTER TABLE `User`
    ADD COLUMN `googleId` VARCHAR(255) NULL,
    ADD UNIQUE INDEX `User_googleId_key`(`googleId`);
