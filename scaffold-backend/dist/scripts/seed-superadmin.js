"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ormconfig_1 = require("../ormconfig");
const user_entity_1 = require("../src/database/entities/user.entity");
const role_enum_1 = require("../src/database/entities/role.enum");
const bcrypt = require("bcrypt");
async function run() {
    await ormconfig_1.AppDataSource.initialize();
    const repo = ormconfig_1.AppDataSource.getRepository(user_entity_1.User);
    const existing = await repo.findOne({ where: { email: 'superadmin@example.com' } });
    if (!existing) {
        const pw = await bcrypt.hash('Password123!', 10);
        const user = repo.create({ name: 'Super Admin', email: 'superadmin@example.com', passwordHash: pw, role: role_enum_1.Role.SUPER_ADMIN });
        await repo.save(user);
        console.log('Super admin seeded.');
    }
    else {
        console.log('Super admin exists.');
    }
    await ormconfig_1.AppDataSource.destroy();
}
run().catch((err) => { console.error(err); process.exit(1); });
//# sourceMappingURL=seed-superadmin.js.map