import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AuthModule } from './auth/auth.module';
import { MealPlansModule } from './meal-plans/meal-plans.module';
import { MealsModule } from './meals/meals.module';
import { FoodsModule } from './foods/foods.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [//adicionado aqui global o configModule
    ConfigModule.forRoot({ isGlobal: true }), 
    UsersModule, 
    ProfilesModule, 
    AuthModule,
    MealPlansModule,
    MealsModule,
    FoodsModule], //conectar sub modulos
  controllers: [],
  providers: [],
})
export class AppModule { }
