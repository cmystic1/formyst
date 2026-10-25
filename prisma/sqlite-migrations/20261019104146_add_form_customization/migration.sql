-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Form" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "title" TEXT NOT NULL DEFAULT 'Untitled form',
    "description" TEXT NOT NULL DEFAULT '',
    "submitLabel" TEXT NOT NULL DEFAULT 'Submit',
    "logo" TEXT NOT NULL DEFAULT '',
    "cover" TEXT NOT NULL DEFAULT '',
    "poweredBy" BOOLEAN NOT NULL DEFAULT true,
    "successTitle" TEXT NOT NULL DEFAULT 'Thank you!',
    "successMessage" TEXT NOT NULL DEFAULT 'Your response has been recorded. We appreciate the time you took to reply.',
    "successButton" TEXT NOT NULL DEFAULT 'Submit another response',
    "theme" TEXT NOT NULL DEFAULT '{}',
    "fields" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Form" ("cover", "description", "fields", "id", "logo", "submitLabel", "theme", "title", "updatedAt") SELECT "cover", "description", "fields", "id", "logo", "submitLabel", "theme", "title", "updatedAt" FROM "Form";
DROP TABLE "Form";
ALTER TABLE "new_Form" RENAME TO "Form";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
