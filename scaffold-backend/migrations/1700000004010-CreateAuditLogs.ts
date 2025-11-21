import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAuditLogs1700000004010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'entity', type: 'varchar', length: '100' },
          { name: 'entityId', type: 'varchar', length: '36', isNullable: true },
          { name: 'action', type: 'varchar', length: '100' },
          { name: 'performedBy', type: 'varchar', length: '36', isNullable: true },
          { name: 'before', type: 'json', isNullable: true },
          { name: 'after', type: 'json', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
        ]
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}
