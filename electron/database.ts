import sqlite3 from 'sqlite3';
import { app } from 'electron';
import path from 'path';

const dbPath = path.resolve(app.getPath('userData'), 'riding_school.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB Error:', err.message);
    else {
        console.log(`Connected to the SQLite database at ${dbPath}`);
        db.serialize(() => {
            // Foreign key support
            db.run('PRAGMA foreign_keys = ON;');
            // Students Table
            db.run(`CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                contact_info TEXT
            )`);
            // Horses Table
            db.run(`CREATE TABLE IF NOT EXISTS horses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                breed TEXT
            )`);
            // Lessons Table
            db.run(`CREATE TABLE IF NOT EXISTS lessons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                horse_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                notes TEXT,
                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (horse_id) REFERENCES horses(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS daily_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                group_name TEXT
            )`);

            // Schedule Participants Table (links students/horses to a time slot)
            db.run(`CREATE TABLE IF NOT EXISTS schedule_participants (
                schedule_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                horse_id INTEGER NOT NULL,
                FOREIGN KEY (schedule_id) REFERENCES daily_schedules(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (horse_id) REFERENCES horses(id),
                PRIMARY KEY (schedule_id, student_id)
            )`);

        });
    }
});

export const dbQuery = (query: string, params: any[] = []): Promise<any[]> => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
});

export const dbRun = (query: string, params: any[] = []): Promise<{ lastID: number }> => new Promise((resolve, reject) => {
    db.run(query, params, function (err) { err ? reject(err) : resolve({ lastID: this.lastID }); });
});