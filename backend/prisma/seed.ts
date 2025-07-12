import { DatabaseSeeder } from './seeders';

async function main() {
  const seeder = new DatabaseSeeder();
  await seeder.run();
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  }); 