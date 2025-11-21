import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSafetyChecklists1700000002345 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'safety_checklists',
                columns: [
                    { name: 'id', type: 'varchar', length: '36', isPrimary: true },
                    { name: 'orderId', type: 'varchar', length: '36', isNullable: true },
                    { name: 'submittedBy', type: 'varchar', length: '36', isNullable: true },
                    { name: 'checklistData', type: 'json' },
                    { name: 'dateOfCheck', type: 'date' },
                    { name: 'attachments', type: 'json', isNullable: true },
                    { name: 'preserved', type: 'tinyint', default: 1 },
                    { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
                ]
            })
        );

        await queryRunner.createForeignKey(
            'safety_checklists',
            new TableForeignKey({
                columnNames: ['orderId'],
                referencedTableName: 'orders',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL'
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('safety_checklists');
        const fk = table.foreignKeys.find((f) => f.columnNames.indexOf('orderId') !== -1);
        if (fk) await queryRunner.dropForeignKey('safety_checklists', fk);
        await queryRunner.dropTable('safety_checklists');
    }
}
