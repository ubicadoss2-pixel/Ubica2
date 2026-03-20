/*
  Warnings:

  - You are about to alter the column `url` on the `business_images` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `business_images` ADD COLUMN `public_id` VARCHAR(500) NULL,
    MODIFY `url` VARCHAR(191) NOT NULL;
