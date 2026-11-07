-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "goal" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MealPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "calories" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "profileId" INTEGER,
    CONSTRAINT "MealPlan_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MealPlan" ("active", "createdAt", "description", "goal", "id", "name", "profileId", "updatedAt") SELECT "active", "createdAt", "description", "goal", "id", "name", "profileId", "updatedAt" FROM "MealPlan";
DROP TABLE "MealPlan";
ALTER TABLE "new_MealPlan" RENAME TO "MealPlan";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'user',
    "passwordHash" TEXT NOT NULL DEFAULT '$2b$10$21V92Zk9GwSDXAdgqRr/oul1AN7/roDDo.q/eqCW35OdH1wUQDg9O'
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash") SELECT "createdAt", "email", "id", "name", "passwordHash" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
