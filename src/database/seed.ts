import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DatabaseSeeder } from './database.seeder';

async function runSeeder() {
  console.log('🚀 Ejecutando seeder...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const seeder = app.get(DatabaseSeeder);
    await seeder.seed();
    console.log('🎉 Seeder ejecutado correctamente');
  } catch (error) {
    console.error('❌ Error ejecutando seeder:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runSeeder();
