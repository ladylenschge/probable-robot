import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { dbQuery, dbRun } from './database';
import {IStudent, IHorse, ILesson, IDailyScheduleSlot} from './types';

// ================================================================= //
// === NEW & IMPROVED PDF GENERATION FUNCTION ====================== //
// ================================================================= //

async function generateAndShowCertificate(studentId: number) {
    // 1. Fetch student and their 10 most recent lessons for the certificate
    const studentArr: IStudent[] = await dbQuery('SELECT name FROM students WHERE id = ?', [studentId]);
    if (!studentArr.length) return;
    const studentName = studentArr[0].name;

    const lessonDetails: ILesson[] = await dbQuery(
        `SELECT l.date, h.name as horse_name
         FROM lessons l
         JOIN horses h ON l.horse_id = h.id
         WHERE l.student_id = ?
         ORDER BY l.date DESC LIMIT 10`,
        [studentId]
    );

    // 2. Define File Path and Create PDF Document
    const desktopPath = app.getPath('desktop');
    const filePath = path.join(desktopPath, `Certificate-${studentName.replace(/\s/g, '_')}-${Date.now()}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    doc.pipe(fs.createWriteStream(filePath));

    // 3. --- Start Custom Layout ---

    // Add Logo (handle potential errors)
   /* try {
        // Path needs to go from the compiled file (`build-electron`) to the root, then to assets
        const logoPath = path.join(__dirname, '../../assets/logo.png');
        doc.image(logoPath, {
            fit: [100, 100], // Fit the logo into a 100x100 box
            align: 'center',
            valign: 'top'
        }).moveDown(0.5);
    } catch (error) {
        console.error("Could not load logo:", error);
    } */

    // School Name
    doc.font('Helvetica-Bold').fontSize(20).text('Your Riding School Name', { align: 'center' });
    doc.moveDown(2);

    // Main Title
    doc.font('Helvetica').fontSize(16).text('Certificate of Achievement', { align: 'center' });
    doc.moveDown(0.5);

    // Decorative Line
    doc.strokeColor("#0056b3")
        .lineWidth(2)
        .moveTo(100, doc.y)
        .lineTo(500, doc.y)
        .stroke();
    doc.moveDown(2);

    // Main Content
    doc.fontSize(14).text('This is to certify that', { align: 'center' });
    doc.moveDown(1);

    // Student Name (Styled)
    doc.font('Helvetica-Bold').fillColor('#0056b3').fontSize(28).text(studentName, { align: 'center' });
    doc.moveDown(1);

    // Completion Text
    doc.fillColor('black').font('Helvetica').fontSize(14).text('has successfully completed the following 10 riding lessons:', { align: 'center' });
    doc.moveDown(2);

    // Lesson Details Table (A simple manual table)
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Date', 150, doc.y);
    doc.text('Horse', 350, doc.y);
    doc.moveDown();
    // Table line
    doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(140, doc.y).lineTo(460, doc.y).stroke();
    doc.font('Helvetica').fontSize(11);

    lessonDetails.forEach(lesson => {
        doc.moveDown(0.5);
        doc.text(lesson.date, 150, doc.y);
        doc.text(lesson.horse_name || 'N/A', 350, doc.y);
    });
    doc.moveDown(3);


    // Signature Area
    doc.text('_________________________', 70, doc.y, { lineBreak: false });
    doc.text('_________________________', 330, doc.y);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Instructor Signature', 95, doc.y, { lineBreak: false });
    doc.text('Date Issued', 380, doc.y);

    // --- End Custom Layout ---

    // Finalize the PDF and save it
    doc.end();

    // 4. Show confirmation and open file (same as before)
    await dialog.showMessageBox({
        title: 'Certificate Generated!',
        message: `A PDF certificate for ${studentName} has been saved to your Desktop.`,
    });
    shell.openPath(filePath);
}

// === NEW PDF Function for Daily Schedule ===
async function generateDailySchedulePDF(date: string, scheduleSlots: IDailyScheduleSlot[]) {
    const desktopPath = app.getPath('desktop');
    const filePath = path.join(desktopPath, `Daily-Schedule-${date}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.font('Helvetica-Bold').fontSize(22).text(`Daily Schedule: ${date}`, { align: 'center' });
    doc.moveDown(2);

    if (scheduleSlots.length === 0) {
        doc.font('Helvetica').fontSize(14).text('No lessons scheduled for this day.', { align: 'center' });
    } else {
        // Sort slots by time before printing
        scheduleSlots.sort((a, b) => a.time.localeCompare(b.time));

        for (const slot of scheduleSlots) {
            // Slot Header
            doc.font('Helvetica-Bold').fontSize(16).fillColor('#0056b3').text(`${slot.time} - ${slot.group_name || 'Group Lesson'}`);
            doc.moveDown(0.5);

            // Decorative Line
            doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(doc.x, doc.y).lineTo(500, doc.y).stroke();
            doc.moveDown(1);

            // Participants Table
            doc.font('Helvetica-Bold').fontSize(12).fillColor('black');
            doc.text('Student', 70, doc.y);
            doc.text('Horse', 300, doc.y);
            doc.moveDown(0.75);

            doc.font('Helvetica').fontSize(11);
            for (const p of slot.participants) {
                doc.text(p.student_name, 70, doc.y);
                doc.text(p.horse_name, 300, doc.y);
                doc.moveDown(0.5);
            }
            doc.moveDown(1.5); // Add space between slots
        }
    }

    doc.end();
    await dialog.showMessageBox({ title: 'Schedule Generated', message: `The daily schedule for ${date} has been saved to your Desktop.` });
    shell.openPath(filePath);
}


function createWindow() {
    const win = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Use compiled JS file
        },
    });

    const isPackaged = app.isPackaged;
    const url = isPackaged
        ? `file://${path.join(__dirname, '../index.html')}`
        : 'http://localhost:3000';

    win.loadURL(url);
    if (!isPackaged) win.webContents.openDevTools();
}


// --- NEW REUSABLE FUNCTION for fetching schedule data ---
async function fetchFullSchedule(date: string): Promise<IDailyScheduleSlot[]> {
    const slots = await dbQuery('SELECT * FROM daily_schedules WHERE date = ?', [date]);
    const schedule: IDailyScheduleSlot[] = [];

    for (const slot of slots) {
        const participants = await dbQuery(`
            SELECT p.student_id, s.name as student_name, p.horse_id, h.name as horse_name
            FROM schedule_participants p
            JOIN students s ON p.student_id = s.id
            JOIN horses h ON p.horse_id = h.id
            WHERE p.schedule_id = ?`, [slot.id]);

        schedule.push({ ...slot, participants });
    }
    return schedule;
}

// IPC Handlers
// Students
ipcMain.handle('get-students', async (): Promise<IStudent[]> => dbQuery('SELECT * FROM students'));
ipcMain.handle('add-student', async (e, name: string, contact: string): Promise<IStudent> => {
    const result = await dbRun('INSERT INTO students (name, contact_info) VALUES (?, ?)', [name, contact]);
    return { id: result.lastID, name, contact_info: contact };
});

// Horses
ipcMain.handle('get-horses', async (): Promise<IHorse[]> => dbQuery('SELECT * FROM horses'));
ipcMain.handle('add-horse', async (e, name: string, breed: string): Promise<IHorse> => {
    const result = await dbRun('INSERT INTO horses (name, breed) VALUES (?, ?)', [name, breed]);
    return { id: result.lastID, name, breed };
});

// Lessons
ipcMain.handle('get-lessons', async (): Promise<ILesson[]> => {
    const query = `
        SELECT l.id, l.date, l.notes, l.student_id, l.horse_id, s.name as student_name, h.name as horse_name
        FROM lessons l
        JOIN students s ON l.student_id = s.id
        JOIN horses h ON l.horse_id = h.id
        ORDER BY l.date DESC
    `;
    return dbQuery(query);
});

ipcMain.handle('add-lesson', async (e, lesson: Omit<ILesson, 'id' | 'student_name' | 'horse_name'>): Promise<ILesson> => {
    const { student_id, horse_id, date, notes } = lesson;
    const result = await dbRun('INSERT INTO lessons (student_id, horse_id, date, notes) VALUES (?, ?, ?, ?)', [student_id, horse_id, date, notes]);

    // Check lesson count and generate PDF if needed
    const countRes = await dbQuery('SELECT COUNT(*) as count FROM lessons WHERE student_id = ?', [student_id]);
    if (countRes[0]?.count === 10) {
        await generateAndShowCertificate(student_id);
    }

    const newLesson: ILesson[] = await dbQuery('SELECT l.id, l.date, l.notes, l.student_id, l.horse_id, s.name as student_name, h.name as horse_name FROM lessons l JOIN students s ON l.student_id = s.id JOIN horses h ON l.horse_id = h.id WHERE l.id = ?', [result.lastID]);
    return newLesson[0];
});

ipcMain.handle('get-daily-schedule', async (e, date: string): Promise<IDailyScheduleSlot[]> => {
    return fetchFullSchedule(date);
});

// This handler ALSO calls the reusable function. This fixes the bug.
ipcMain.handle('print-daily-schedule', async (e, date: string) => {
    // Re-fetch the data using our new function to ensure it's up-to-date.
    const scheduleData = await fetchFullSchedule(date);
    await generateDailySchedulePDF(date, scheduleData);
});


// This handler stays the same as before.
ipcMain.handle('add-schedule-slot', async (e, slot: Omit<IDailyScheduleSlot, 'id'>): Promise<IDailyScheduleSlot> => {
    // ... (no changes needed inside this handler)
    // Start a transaction
    await dbRun('BEGIN TRANSACTION');
    try {
        const scheduleResult = await dbRun('INSERT INTO daily_schedules (date, time, group_name) VALUES (?, ?, ?)', [slot.date, slot.time, slot.group_name]);
        const scheduleId = scheduleResult.lastID;

        for (const p of slot.participants) {
            await dbRun('INSERT INTO schedule_participants (schedule_id, student_id, horse_id) VALUES (?, ?, ?)', [scheduleId, p.student_id, p.horse_id]);
        }
        await dbRun('COMMIT');

        // We can call our reusable function here too to get the fully populated object to return!
        const fullNewSlot = await fetchFullSchedule(slot.date);
        return fullNewSlot.find(s => s.id === scheduleId)!;

    } catch (err) {
        await dbRun('ROLLBACK');
        console.error('Transaction Error:', err);
        throw err; // Rethrow error to frontend
    }
});

// App Lifecycle
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });