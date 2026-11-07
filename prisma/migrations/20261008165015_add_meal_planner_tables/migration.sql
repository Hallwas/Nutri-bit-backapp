-- CreateTable
CREATE TABLE "MealPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "profileId" INTEGER NOT NULL,
    CONSTRAINT "MealPlan_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Week" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "label" TEXT,
    "startDate" DATETIME,
    "mealPlanId" INTEGER NOT NULL,
    CONSTRAINT "Week_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Day" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weekday" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "weekId" INTEGER NOT NULL,
    CONSTRAINT "Day_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "time" TEXT,
    "dayId" INTEGER NOT NULL,
    CONSTRAINT "Meal_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "note" TEXT,
    "mealId" INTEGER NOT NULL,
    "foodId" INTEGER NOT NULL,
    CONSTRAINT "Ingredient_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ingredient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Food" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tbcaCode" TEXT,
    "name" TEXT NOT NULL,
    "umidade" REAL,
    "glicose" REAL,
    "frutose" REAL,
    "lactose" REAL,
    "sacarose" REAL,
    "acucaresTotaisDisponiveis" REAL,
    "amidoTotal" REAL,
    "amidoDisponivel" REAL,
    "carboidratosDisponiveis" REAL,
    "calorias" REAL,
    "proteinas" REAL
);

-- CreateIndex
CREATE UNIQUE INDEX "Food_tbcaCode_key" ON "Food"("tbcaCode");
