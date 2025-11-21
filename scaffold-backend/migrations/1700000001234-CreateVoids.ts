import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';


export class CreateVoids1700000001234 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'void_protections',
                columns: [
                    { name: 'id', type: 'varchar', length: '36', isPrimary: true },
                    { name: 'orderId', type: 'varchar', length: '36', isNullable: true },
                    { name: 'type', type: 'enum', enum: ['PRE', 'POST'] },
                    { name: 'installer', type: 'varchar', length: '255', isNullable: true },
                    { name: 'installedOn', type: 'date', isNullable: true },
                    { name: 'expiryDate', type: 'date', isNullable: true },
                    { name: 'notes', type: 'text', isNullable: true },
                    { name: 'attachments', type: 'json', isNullable: true },
                    { name: 'status', type: 'enum', enum: ['OPEN', 'COMPLETED', 'EXPIRED'], default: "'OPEN'" },
                    { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
                ]
            })
        );


        // foreign key to orders.id
        await queryRunner.createForeignKey(
            'void_protections',
            new TableForeignKey({
                columnNames: ['orderId'],
                referencedTableName: 'orders',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL'
            })
        );
    }


    public async down(queryRunner: QueryRunner): Promise<void> {
        // drop foreign key then table
        const table = await queryRunner.getTable('void_protections');
        const fk = table.foreignKeys.find((f) => f.columnNames.indexOf('orderId') !== -1);
        if (fk) {
            await queryRunner.dropForeignKey('void_protections', fk);
        }
        await queryRunner.dropTable('void_protections');
    }
}