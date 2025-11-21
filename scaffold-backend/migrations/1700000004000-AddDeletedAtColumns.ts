import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeletedAtColumns1700000004000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const tables = [
            'orders',
            'products',
            'inventory_items',
            'files',
            'swms',
            'safety_checklists',
            'void_protections',
            'invoices',
            'payments'
        ];

        for (const t of tables) {
            await queryRunner.addColumn(
                t,
                new TableColumn({
                    name: 'deletedAt',
                    type: 'timestamp',
                    isNullable: true,
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tables = [
            'orders',
            'products',
            'inventory_items',
            'files',
            'swms',
            'safety_checklists',
            'void_protections',
            'invoices',
            'payments'
        ];
        for (const t of tables) {
            await queryRunner.dropColumn(t, 'deletedAt');
        }
    }
}
