// electron/database.ts

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

const dbPath = path.resolve(app.getPath('userData'), 'riding_school_v2.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// --- THE CORRECTED AND FINAL SCHEMA ---
db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        contact_info TEXT,
        isMember INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS horses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        breed TEXT
    );

    CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        horse_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        is_single_lesson INTEGER NOT NULL DEFAULT 0, 
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (horse_id) REFERENCES horses(id)
    );

    CREATE TABLE IF NOT EXISTS school_info (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        school_name TEXT,
        street_address TEXT,
        zip_code TEXT,
        phone_number TEXT,
        fax TEXT,
        price_10_card_members REAL DEFAULT 0,
        price_10_card_nonMembers REAL DEFAULT 0,
        bank_name TEXT,
        iban TEXT,
        blz TEXT
    );
    
    CREATE TABLE IF NOT EXISTS daily_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        group_name TEXT
    );

    CREATE TABLE IF NOT EXISTS schedule_participants (
        schedule_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        horse_id INTEGER NOT NULL,
        FOREIGN KEY (schedule_id) REFERENCES daily_schedules(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (horse_id) REFERENCES horses(id),
        PRIMARY KEY (schedule_id, student_id)
    );
`);



export const dbQuery = (query: string, params: any[] = []): any[] => {
    return db.prepare(query).all(...params);
};

export const dbRun = (query: string, params: any[] = []): { lastInsertRowid: any } => {
    const info = db.prepare(query).run(...params);
    return { lastInsertRowid: info.lastInsertRowid };
};