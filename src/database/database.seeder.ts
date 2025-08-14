import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../modules/user/entities/usuario.entity';
import { UserRolesEnum } from '../modules/user/usuario.types';
import { generateHash } from '../modules/auth/utils/hash.helper';
import { nanoid } from 'nanoid';

@Injectable()
export class DatabaseSeeder {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async seed() {
    console.log('🌱 Iniciando seeder...');

    // Verificar si ya existe un usuario administrador
    const adminExists = await this.usuarioRepository.findOne({
      where: { rol: UserRolesEnum.ADMINISTRADOR }
    });

    if (adminExists) {
      console.log('✅ Usuario administrador ya existe, saltando seeder...');
      return;
    }

    // Crear usuario administrador
    console.log('👤 Creando usuario administrador...');
    
    const hashedPassword = await generateHash('123456');
    const qrCode = nanoid(12);

    const admin = this.usuarioRepository.create({
      nombre: 'Rodrigo Mendoza',
      correo: 'ruymenca1@gmail.com',
      password: hashedPassword,
      qrCode: qrCode,
      rol: UserRolesEnum.ADMINISTRADOR,
      active: true
    });

    await this.usuarioRepository.save(admin);

    console.log('✅ Usuario administrador creado exitosamente');
    console.log(`📧 Email: ${admin.correo}`);
    console.log(`🔑 Password: 123456`);
    console.log(`📱 QR Code: ${admin.qrCode}`);
    console.log('🌱 Seeder completado exitosamente');
  }
}
