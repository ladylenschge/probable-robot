// database.ts - KOMPLETT ÜBERARBEITET MIT MIGRATIONS

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'riding_school.db');
export const db = new Database(dbPath);

console.log('🔄 database.ts is loading...');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// ============= MIGRATIONS SYSTEM =============

interface Migration {
    version: number;
    name: string;
    up: () => void;
}

// Migrations-Tabelle erstellen
db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

function getCurrentVersion(): number {
    const result = db.prepare('SELECT MAX(version) as version FROM schema_migrations').get() as any;
    return result?.version || 0;
}

function applyMigration(migration: Migration) {
    console.log(`Applying migration ${migration.version}: ${migration.name}`);

    db.transaction(() => {
        migration.up();
        db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(
            migration.version,
            migration.name
        );
    })();

    console.log(`Migration ${migration.version} applied successfully`);
}

// ============= ALLE MIGRATIONS =============

const migrations: Migration[] = [
    // Migration 1: Initial Schema
    {
        version: 1,
        name: 'initial_schema',
        up: () => {
            db.exec(`
                -- Students
                CREATE TABLE IF NOT EXISTS students (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    contact_info TEXT,
                    isMember INTEGER DEFAULT 0
                );

                -- Horses
                CREATE TABLE IF NOT EXISTS horses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    breed TEXT
                );

                -- Lessons
                CREATE TABLE IF NOT EXISTS lessons (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    horse_id INTEGER NOT NULL,
                    date TEXT NOT NULL,
                    notes TEXT,
                    is_single_lesson INTEGER DEFAULT 0,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (horse_id) REFERENCES horses(id) ON DELETE RESTRICT
                );

                -- Daily Schedules
                CREATE TABLE IF NOT EXISTS daily_schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS schedule_participants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    schedule_id INTEGER NOT NULL,
                    student_id INTEGER NOT NULL,
                    horse_id INTEGER NOT NULL,
                    FOREIGN KEY (schedule_id) REFERENCES daily_schedules(id) ON DELETE CASCADE,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (horse_id) REFERENCES horses(id) ON DELETE RESTRICT
                );

                -- Printed Reports Log
                CREATE TABLE IF NOT EXISTS printed_reports_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    milestone INTEGER NOT NULL,
                    date_printed DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_id, milestone),
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
                );

                -- School Info
                CREATE TABLE IF NOT EXISTS school_info (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    school_name TEXT,
                    street_address TEXT,
                    zip_code TEXT,
                    phone_number TEXT,
                    bank_name TEXT,
                    iban TEXT,
                    blz TEXT,
                    price_10_card_members REAL DEFAULT 100,
                    price_10_card_nonMembers REAL DEFAULT 120
                );
            `);
        }
    },

    // Migration 2: Reitergruppen Basis
    {
        version: 2,
        name: 'add_rider_groups',
        up: () => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS rider_groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS rider_group_members (
                    group_id INTEGER NOT NULL,
                    student_id INTEGER NOT NULL,
                    PRIMARY KEY (group_id, student_id),
                    FOREIGN KEY (group_id) REFERENCES rider_groups(id) ON DELETE CASCADE,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
                );
            `);
        }
    },

    // Migration 3: Wochentag und Uhrzeit für Gruppen
    {
        version: 3,
        name: 'add_weekday_time_to_groups',
        up: () => {
            // Prüfe ob Spalten bereits existieren
            const tableInfo = db.prepare("PRAGMA table_info(rider_groups)").all();
            const hasWeekday = tableInfo.some((col: any) => col.name === 'weekday');
            const hasTime = tableInfo.some((col: any) => col.name === 'time');

            if (!hasWeekday || !hasTime) {
                // Erstelle temporäre neue Tabelle
                db.exec(`
                    CREATE TABLE rider_groups_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT,
                        weekday INTEGER NOT NULL DEFAULT 1,
                        time TEXT NOT NULL DEFAULT '10:00',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `);

                // Kopiere bestehende Daten
                db.exec(`
                    INSERT INTO rider_groups_new (id, name, description, weekday, time, created_at)
                    SELECT id, name, description, 1, '10:00', created_at
                    FROM rider_groups;
                `);

                // Lösche alte Tabelle und benenne neue um
                db.exec(`
                    DROP TABLE rider_groups;
                    ALTER TABLE rider_groups_new RENAME TO rider_groups;
                `);
            }
        }
    },

    // Migration 4: Absagen/Cancellations
    {
        version: 4,
        name: 'add_group_cancellations',
        up: () => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS group_cancellations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_id INTEGER NOT NULL,
                    student_id INTEGER NOT NULL,
                    date TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(group_id, student_id, date),
                    FOREIGN KEY (group_id) REFERENCES rider_groups(id) ON DELETE CASCADE,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
                );
            `);
        }
    }
];

// ============= MIGRATIONS AUSFÜHREN =============

export function runMigrations() {
    const currentVersion = getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);

    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
        console.log('Database is up to date');
        return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
        try {
            applyMigration(migration);
        } catch (error) {
            console.error(`Failed to apply migration ${migration.version}:`, error);
            throw error;
        }
    }

    console.log('All migrations completed successfully');
}

// Führe Migrations aus
runMigrations();
// DEBUG: Prüfe aktuelle Tabellenstruktur
console.log('=== DEBUG: Checking rider_groups table ===');
try {
    const tableInfo = db.prepare("PRAGMA table_info(rider_groups)").all();
    console.log('rider_groups columns:', tableInfo);

    const migrations = db.prepare('SELECT * FROM schema_migrations ORDER BY version').all();
    console.log('Applied migrations:', migrations);
} catch (error) {
    console.log('Error checking table:', error);
}
console.log('=== END DEBUG ===');
// ============= HELPER FUNCTIONS =============
export const dbQuery = (query: string, params: any[] = []): any[] => {
    return db.prepare(query).all(...params);
};

export const dbRun = (query: string, params: any[] = []): { lastInsertRowid: any } => {
    const info = db.prepare(query).run(...params);
    return { lastInsertRowid: info.lastInsertRowid };
};