import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFilesOwnerColumns1700000003456 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'files',
      new TableColumn({
        name: 'ownerEntityType',
        type: 'varchar',
        length: '100',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'files',
      new TableColumn({
        name: 'ownerEntityId',
        type: 'varchar',
        length: '36',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('files', 'ownerEntityId');
    await queryRunner.dropColumn('files', 'ownerEntityType');
  }
}
