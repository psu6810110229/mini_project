import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { EquipmentStatus } from '../../common/enums';

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

    @CreateDateColumn()
    createdAt: Date;
}
