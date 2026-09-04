import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIssues1735910000000 implements MigrationInterface {
  name = 'CreateIssues1735910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "issues" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "fingerprint" varchar(64) NOT NULL,
        "title" varchar(500) NOT NULL,
        "level" varchar(20) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'unresolved',
        "first_seen" timestamptz NOT NULL,
        "last_seen" timestamptz NOT NULL,
        "event_count" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_issues_project_fingerprint" ON "issues" ("project_id", "fingerprint")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "issues"`);
  }
}
