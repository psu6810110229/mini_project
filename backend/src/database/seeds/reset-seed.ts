import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { UserSeeder } from './user.seeder';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from '../../equipments/entities/equipment.entity';
import { EquipmentItem } from '../../equipments/entities/equipment-item.entity';
import { EquipmentItemStatus, EquipmentStatus } from '../../common/enums';

async function resetAndSeed() {
    console.log('🚀 Starting database reset and seed...\n');

    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);

    // Clear all data in correct order (respecting foreign keys)
    console.log('🗑️  Clearing old data...');

    await dataSource.query('DELETE FROM "audit_logs"');
    console.log('   ✅ Cleared audit_logs');

    await dataSource.query('DELETE FROM "rentals"');
    console.log('   ✅ Cleared rentals');

    await dataSource.query('DELETE FROM "equipment_items"');
    console.log('   ✅ Cleared equipment_items');

    await dataSource.query('DELETE FROM "equipments"');
    console.log('   ✅ Cleared equipments');

    await dataSource.query('DELETE FROM "users"');
    console.log('   ✅ Cleared users');

    console.log('');

    // Seed users
    const userSeeder = app.get(UserSeeder);
    await userSeeder.seed();

    // Seed equipment
    console.log('\n📦 Creating equipment...');

    const equipmentRepo = dataSource.getRepository(Equipment);
    const equipmentItemRepo = dataSource.getRepository(EquipmentItem);

    // Equipment data with categories
    const equipmentData = [
        { name: 'Canon EOS R5', category: 'Camera', stockQty: 3 },
        { name: 'Sony A7 IV', category: 'Camera', stockQty: 2 },
        { name: 'Nikon Z8', category: 'Camera', stockQty: 2 },
        { name: 'GoPro Hero 12', category: 'Camera', stockQty: 5 },
        { name: 'DJI Pocket 3', category: 'Camera', stockQty: 3 },
        { name: 'Canon RF 24-70mm f/2.8L', category: 'Lens', stockQty: 2 },
        { name: 'Canon RF 70-200mm f/2.8L', category: 'Lens', stockQty: 2 },
        { name: 'Sony 50mm f/1.4 GM', category: 'Lens', stockQty: 3 },
        { name: 'Rode VideoMic Pro+', category: 'Microphone', stockQty: 4 },
        { name: 'Rode Wireless GO II', category: 'Microphone', stockQty: 3 },
        { name: 'Sennheiser MKE 600', category: 'Microphone', stockQty: 2 },
        { name: 'DJI RS 3 Pro', category: 'Gimbal', stockQty: 2 },
        { name: 'DJI Ronin 4D', category: 'Gimbal', stockQty: 1 },
        { name: 'Manfrotto MT055CXPRO4', category: 'Tripod', stockQty: 5 },
        { name: 'Sachtler Ace XL', category: 'Tripod', stockQty: 2 },
        { name: 'Godox AD600 Pro', category: 'Lighting', stockQty: 4 },
        { name: 'Aputure 600d Pro', category: 'Lighting', stockQty: 2 },
        { name: 'Nanlite Forza 60C', category: 'Lighting', stockQty: 3 },
        { name: 'SanDisk Extreme PRO 128GB CFexpress', category: 'Storage', stockQty: 10 },
        { name: 'Sony Tough CFexpress 160GB', category: 'Storage', stockQty: 5 },
    ];

    for (const eq of equipmentData) {
        const equipment = equipmentRepo.create({
            name: eq.name,
            category: eq.category,
            stockQty: eq.stockQty,
            status: EquipmentStatus.AVAILABLE,
        });
        await equipmentRepo.save(equipment);

        // Create individual items
        for (let i = 1; i <= eq.stockQty; i++) {
            const item = equipmentItemRepo.create({
                equipmentId: equipment.id,
                itemCode: String(i).padStart(3, '0'),
                status: EquipmentItemStatus.AVAILABLE,
            });
            await equipmentItemRepo.save(item);
        }

        console.log(`   ✅ ${eq.name} (${eq.stockQty} items)`);
    }

    // Clear localStorage categories (frontend)
    console.log('\n💡 Note: Categories are stored in localStorage on frontend.');
    console.log('   If you want to reset categories, clear localStorage in browser.');

    await app.close();

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Database reset and seed complete!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 Test Accounts:');
    console.log('   Admin: studentId=6810110001, password=123456');
    console.log('   User:  studentId=6810110223, password=123456');
    console.log('');
    console.log('📦 Equipment Created: ' + equipmentData.length + ' types');
    console.log('   Categories: Camera, Lens, Microphone, Gimbal, Tripod, Lighting, Storage');
    console.log('');
}

resetAndSeed().catch(console.error);
