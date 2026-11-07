-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN "grams" REAL;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "activityLevel" TEXT;
ALTER TABLE "Profile" ADD COLUMN "height" REAL;
ALTER TABLE "Profile" ADD COLUMN "sex" TEXT;
ALTER TABLE "Profile" ADD COLUMN "weight" REAL;
