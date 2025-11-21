import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class InventoryLostDamaged1700000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('inventory_items', [
      new TableColumn({ name: 'condition', type: 'varchar', length: '50', isNullable: true }),
      new TableColumn({ name: 'damagedAt', type: 'timestamp', isNullable: true }),
      new TableColumn({ name: 'damageNotes', type: 'text', isNullable: true }),
      new TableColumn({ name: 'damageFee', type: 'decimal', precision: 12, scale: 2, isNullable: true }),
      new TableColumn({ name: 'lostAt', type: 'timestamp', isNullable: true }),
      new TableColumn({ name: 'lostNotes', type: 'text', isNullable: true }),
      new TableColumn({ name: 'lostFee', type: 'decimal', precision: 12, scale: 2, isNullable: true })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('inventory_items', 'lostFee');
    await queryRunner.dropColumn('inventory_items', 'lostNotes');
    await queryRunner.dropColumn('inventory_items', 'lostAt');
    await queryRunner.dropColumn('inventory_items', 'damageFee');
    await queryRunner.dropColumn('inventory_items', 'damageNotes');
    await queryRunner.dropColumn('inventory_items', 'damagedAt');
    await queryRunner.dropColumn('inventory_items', 'condition');
  }
}
