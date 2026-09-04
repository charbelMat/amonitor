import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUptimeAndAlerts1735920000000 implements MigrationInterface {
  name = 'CreateUptimeAndAlerts1735920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "uptime_monitors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "url" varchar(2000) NOT NULL,
        "interval_seconds" integer NOT NULL,
        "expected_status" integer NOT NULL DEFAULT 200,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "alert_rules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "trigger" varchar(30) NOT NULL,
        "channel" varchar(20) NOT NULL,
        "target" varchar(500) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_alert_rules_project_trigger" ON "alert_rules" ("project_id", "trigger")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "alert_rules"`);
    await queryRunner.query(`DROP TABLE "uptime_monitors"`);
  }
}
