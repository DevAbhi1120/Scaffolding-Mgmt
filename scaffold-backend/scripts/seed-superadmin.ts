import { AppDataSource } from '../ormconfig';
import { User } from '../src/database/entities/user.entity';
import { Role } from '../src/database/entities/role.enum';
import * as bcrypt from 'bcrypt';

async function run() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);
  const existing = await repo.findOne({ where: { email: 'superadmin@example.com' } });
  if (!existing) {
    const pw = await bcrypt.hash('Password123!', 10);
    const user = repo.create({ name: 'Super Admin', email: 'superadmin@example.com', passwordHash: pw, role: Role.SUPER_ADMIN });
    await repo.save(user);
    console.log('Super admin seeded.');
  } else {
    console.log('Super admin exists.');
  }
  await AppDataSource.destroy();
}
run().catch((err)=>{ console.error(err); process.exit(1); });
