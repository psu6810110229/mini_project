import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { EquipmentStatus } from '../../common/enums';
import { EquipmentItem } from './equipment-item.entity';

@Entity('equipments')
export class Equipment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    category: string;

    @Column({
        type: 'enum',
        enum: EquipmentStatus,
        default: EquipmentStatus.AVAILABLE,
    })
    status: EquipmentStatus;

    @Column({ default: 1 })
    stockQty: number;

    @Column({ nullable: true })
    imageUrl: string;

    @OneToMany(() => EquipmentItem, (item) => item.equipment, { cascade: true, eager: true })
    items: EquipmentItem[];

    @CreateDateColumn()
    createdAt: Date;
}

