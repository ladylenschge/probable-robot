import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { dbQuery, dbRun } from './database';
import {IStudent, IHorse, ILesson, IDailyScheduleSlot, LessonDays, IStudentReportInfo, ISchoolInfo} from './types';
import { autoUpdater } from 'electron-updater';


function initializeAutoUpdater() {
    // This will immediately check for updates and then every hour thereafter.
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', (_info) => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Update Available',
            message: 'Eine neue Version ist verfügbar und wird im Hintergrund heruntergeladen'
        });
    });

    autoUpdater.on('update-downloaded', (_info) => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Update Ready to Install',
            message: 'The update has been downloaded. Restart the application to apply the changes.',
            buttons: ['Restart Now', 'Later']
        }).then((buttonIndex) => {
            // The user clicked "Restart Now"
            if (buttonIndex.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    autoUpdater.on('error', (err) => {
        console.error('Error in auto-updater. ' + err);
    });
}

function formatDate(isoString: string)  {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function formatDateWithWeekday(dateString: string): string {
    // Appending 'T00:00:00' prevents timezone issues where '2023-12-25' might be interpreted
    // as the evening of the 24th in some timezones.
    const date = new Date(dateString + 'T00:00:00');
    const dayIndex = date.getDay(); // Returns a number 0-6
    const weekdayName = LessonDays[dayIndex]; // This converts the number (e.g., 1) to the string "Monday"

    return `${weekdayName}, ${formatDate(dateString)}`;
}

async function generateAndShowCertificate(studentId: number, totalLessonCount: number) {
    // 1. Fetch student name
    const studentArr: IStudent[] = await dbQuery('SELECT name FROM students WHERE id = ?', [studentId]);
    if (!studentArr.length) return;
    const studentName = studentArr[0].name;

    // 2. Calculate the OFFSET using the provided totalLessonCount.
    // This is the key part that uses the new argument.
    const offset = totalLessonCount - 10;

    // 3. Fetch the specific 10 lessons for this milestone using the offset.
    const lessonDetails: ILesson[] = await dbQuery(
        `SELECT l.date, h.name as horse_name
         FROM lessons l
         JOIN horses h ON l.horse_id = h.id
         WHERE l.student_id = ?
         ORDER BY l.date ASC
         LIMIT 10 OFFSET ?`,
        [studentId, offset]
    );

    // 4. Define File Path and Create PDF Document
    const desktopPath = app.getPath('desktop');
    const filePath = path.join(desktopPath, `Certificate-10-Lessons-${studentName.replace(/\s/g, '_')}-${Date.now()}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    doc.pipe(fs.createWriteStream(filePath));


    // Header and main content...
    doc.font('Helvetica-Bold').fontSize(20).text('Your Riding School Name', { align: 'center' }).moveDown(2);
    doc.font('Helvetica').fontSize(16).text('Certificate of Completion', { align: 'center' }).moveDown(2);
    doc.fontSize(14).text('This is to certify that', { align: 'center' }).moveDown(1);
    doc.font('Helvetica-Bold').fillColor('#0056b3').fontSize(28).text(studentName, { align: 'center' }).moveDown(1);
    doc.fillColor('black').font('Helvetica').fontSize(14).text('has successfully completed a package of 10 riding lessons.', { align: 'center' }).moveDown(2);

    // Lesson Details Table...
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Date', 150, doc.y);
    doc.text('Horse', 350, doc.y);
    doc.moveDown();
    doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(140, doc.y).lineTo(460, doc.y).stroke();
    doc.font('Helvetica').fontSize(11);

    lessonDetails.forEach(lesson => {
        doc.moveDown(0.5);
        doc.text(lesson.date, 150, doc.y);
        doc.text(lesson.horse_name || 'N/A', 350, doc.y);
    });
    doc.moveDown(3);

    // Signature Area...
    doc.text('_________________________', 70, doc.y, { lineBreak: false });
    doc.text('_________________________', 330, doc.y);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Instructor Signature', 95, doc.y, { lineBreak: false });
    doc.text('Date Issued', 380, doc.y);

    doc.end();

    // 6. Show confirmation and open file
    await dialog.showMessageBox({
        title: 'Certificate Generated!',
        message: `A 10-Lesson Certificate for ${studentName} has been saved to your Desktop.`,
    });
    shell.openPath(filePath);
}
async function generateDailySchedulePDF(date: string, groupedSlots: Record<string, IDailyScheduleSlot[]>) {

    const assetsPath = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../assets');

    // --- Define paths to our custom fonts using the robust assetsPath ---
    const regularFontPath = path.join(assetsPath, 'fonts/Roboto-Regular.ttf');
    const boldFontPath = path.join(assetsPath, 'fonts/Roboto-Bold.ttf');
    const desktopPath = app.getPath('desktop');
    const filePath = path.join(desktopPath, `Uebersicht-Reitzeiten-${date}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 80 });

    doc.pipe(fs.createWriteStream(filePath));

    try {
        doc.registerFont('regular', regularFontPath);
        doc.registerFont('bold', boldFontPath);
    } catch(err) {
        console.error("Error registering fonts. Using Helvetica as a fallback.", err);
        // Fallback to a standard font if the custom one isn't found
        doc.registerFont('Roboto-Regular', 'Helvetica');
        doc.registerFont('Roboto-Bold', 'Helvetica-Bold');
    }
    // Header
    doc.font('bold').fontSize(22).text(`Übersicht Reitzeiten: ${formatDateWithWeekday(date)}`, { align: 'center' });
    doc.moveDown(2);

    const sortedTimes = Object.keys(groupedSlots).sort((a, b) => a.localeCompare(b));

    if (sortedTimes.length === 0) {
        doc.font('regular').fontSize(14).text('No lessons scheduled for this day.', { align: 'center' });
    } else {
        // --- NEW LOOPING LOGIC ---

        // Outer loop: Iterate through each time slot (e.g., "09:00", then "10:30")
        for (const time of sortedTimes) {
            // Print the main time header ONCE.
            doc.font('bold').fontSize(18).fillColor('#0056b3').text(time);
            doc.moveDown(0.75);

            // Get all the lesson groups happening at this time.
            const lessonsAtThisTime = groupedSlots[time];

            // Inner loop: Iterate through each group within that time slot.
            for (const slot of lessonsAtThisTime) {

                // Print the participants for this specific group.
                doc.font('regular').fontSize(11).fillColor('#000000');
                for (const p of slot.participants) {
                    doc.text(`- ${p.student_name} riding ${p.horse_name}`, { indent: 40 });
                }
                doc.moveDown(0.75); // Space between groups within the same time slot.
            }
            doc.moveDown(1.5); // Larger space between different time slots.
        }
    }

    doc.end();
    await dialog.showMessageBox({ title: 'Reitzeiten erstellt', message: `Die Reitzeiten für ${date} wurden auf dem Desktop gespeichert` });
    shell.openPath(filePath);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    const isPackaged = app.isPackaged;
    const url = isPackaged
        ? `file://${path.join(__dirname, '../index.html')}`
        : 'http://localhost:3000';

    win.loadURL(url);
    if (!isPackaged) win.webContents.openDevTools();
}

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

ipcMain.handle('get-students', async (): Promise<IStudent[]> => dbQuery('SELECT * FROM students'));
ipcMain.handle('add-student', async (e, name: string, contact: string, isMember: boolean): Promise<IStudent> => {
    const result = await dbRun('INSERT INTO students (name, contact_info, isMember) VALUES (?, ?, ?)', [name, contact, isMember ? 1 : 0]);
    return { id: result.lastID, name, contact_info: contact, isMember};
});

ipcMain.handle('update-student', async (e, student: IStudent): Promise<IStudent> => {
    const { id, name, contact_info,isMember } = student;
    await dbRun(
        'UPDATE students SET name = ?, contact_info = ?, isMember = ? WHERE id = ?',
        [name, contact_info, isMember ? 1 : 0, id,]
    );
    // Return the updated student object to the frontend
    return student;
});

ipcMain.handle('delete-student', async (e, studentId: IStudent["id"]): Promise<string> => {
    await dbRun(
        'DELETE FROM students WHERE id = ?',
        [studentId]
    );
    return 'delete successful'
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
   //     await generateAndShowCertificate(student_id);
    }

    const newLesson: ILesson[] = await dbQuery('SELECT l.id, l.date, l.notes, l.student_id, l.horse_id, s.name as student_name, h.name as horse_name FROM lessons l JOIN students s ON l.student_id = s.id JOIN horses h ON l.horse_id = h.id WHERE l.id = ?', [result.lastID]);
    return newLesson[0];
});

ipcMain.handle('get-daily-schedule', async (e, date: string): Promise<IDailyScheduleSlot[]> => {
    return fetchFullSchedule(date);
});

ipcMain.handle('print-daily-schedule', async (e, date: string) => {
    const scheduleData = await fetchFullSchedule(date);

    // 2. --- NEW: Group the schedule data by time ---
    const groupedByTime = scheduleData.reduce((acc, slot) => {
        // Find or create the array for this time slot.
        const timeGroup = acc[slot.time] || [];
        // Add the current lesson slot to that array.
        timeGroup.push(slot);
        // Put the updated array back into our accumulator object.
        acc[slot.time] = timeGroup;
        return acc;
    }, {} as Record<string, IDailyScheduleSlot[]>); // This is our new data structure.

    // 3. Call the PDF generator with the new, grouped data structure.
    await generateDailySchedulePDF(date, groupedByTime);
});


ipcMain.handle('add-schedule-slot', async (e, slot: Omit<IDailyScheduleSlot, 'id'>): Promise<IDailyScheduleSlot> => {
    await dbRun('BEGIN TRANSACTION');
    try {
        const scheduleResult = await dbRun('INSERT INTO daily_schedules (date, time) VALUES (?, ?)', [slot.date, slot.time]);
        const scheduleId = scheduleResult.lastID;

        for (const p of slot.participants) {
            await dbRun('INSERT INTO schedule_participants (schedule_id, student_id, horse_id) VALUES (?, ?, ?)', [scheduleId, p.student_id, p.horse_id]);
            const countResultBefore = await dbQuery('SELECT COUNT(*) as count FROM lessons WHERE student_id = ?', [p.student_id]);
            const countBefore = countResultBefore[0]?.count || 0;

            await dbRun(
                'INSERT INTO lessons (student_id, horse_id, date, notes) VALUES (?, ?, ?, ?)',
                [p.student_id, p.horse_id, slot.date]
            );

            const countAfter = countBefore + 1;
            const milestonesBefore = Math.floor(countBefore / 10);
            const milestonesAfter = Math.floor(countAfter / 10);

            if (milestonesAfter > milestonesBefore) {
                console.log(`MILESTONE CROSSED (from group lesson): Student ${p.student_id} reached ${countAfter} lessons.`);
            }
        }

        await dbRun('COMMIT');

        const fullNewSlot = await fetchFullSchedule(slot.date);
        return fullNewSlot.find(s => s.id === scheduleId)!;

    } catch (err) {
        await dbRun('ROLLBACK');
        console.error('Transaction Error in add-schedule-slot:', err);
        throw err; // Rethrow the error to the frontend so it can be handled.
    }
});

ipcMain.handle('delete-schedule-slot', async (e, scheduleId: number) => {
    console.log(`Attempting to delete schedule slot with ID: ${scheduleId}`);

    await dbRun('DELETE FROM daily_schedules WHERE id = ?', [scheduleId]);
});
ipcMain.handle('delete-schedule-participant', async (e, scheduleId: number, studentId: number) => {
    console.log(`Attempting to delete student ${studentId} from schedule slot ${scheduleId}`);

    await dbRun(
        'DELETE FROM schedule_participants WHERE schedule_id = ? AND student_id = ?',
        [scheduleId, studentId]
    );
});

async function generateStudentReportPDF(studentId: number, milestone: number) {
    const studentArr: IStudent[] = await dbQuery('SELECT name, isMember FROM students WHERE id = ?', [studentId]);
    const schoolInfoResults= await dbQuery(`SELECT * FROM school_info where id = 1`);
    const schoolInfo = schoolInfoResults.length > 0 ? schoolInfoResults[0] : null;

    const schoolName = schoolInfo?.school_name || 'Reitanlage Garnzell';
    const streetAddress = schoolInfo?.street_address || '';
    const zipCode = schoolInfo?.zip_code || '';
    const phoneNumber = schoolInfo?.phone_number || '';
    const fax = schoolInfo?.fax || '';
    let price = schoolInfo?.price_10_card_nonMembers || 100;
    const bankName = schoolInfo?.bank_name || '';
    const iban = schoolInfo?.iban || '';
    const blz = schoolInfo?.blz || '';


    if (!studentArr.length) return;
    const studentName = studentArr[0].name;
    let isMember = studentArr[0].isMember;

    if(isMember) {
        price = schoolInfo.price_10_card_members;
    }

    const offset = milestone - 10; // Get the correct block of 10
    const lessonDetails: ILesson[] = await dbQuery(
        `SELECT l.date, h.name as horse_name, l.notes
         FROM lessons l
         JOIN horses h ON l.horse_id = h.id
         WHERE l.student_id = ?
         ORDER BY l.date ASC
         LIMIT 10 OFFSET ?`,
        [studentId, offset]
    );


    // 2. Setup PDF
    const desktopPath = app.getPath('desktop');
    const filePath = path.join(desktopPath, `10erKarte-${offset + 1}-${milestone}-${studentName}.pdf`);
    const doc = new PDFDocument({ size: 'A5', margin: 20 });
    doc.pipe(fs.createWriteStream(filePath));

    // 3. Build PDF Content
    doc.font('Helvetica-Bold').fontSize(20).text(`${schoolName}`, { align: 'center' });
    doc.fontSize(7).text(`${streetAddress} ${zipCode} - Tel.: ${phoneNumber} Faxnr.: ${fax}`, { align: 'center' });
    doc.moveDown(0.5)
    doc.fontSize(7).text(`Bankverb.: ${bankName} - BLZ: ${blz} - IBAN: ${iban}`, { align: 'center' });
    doc.moveDown(0.5)
    // doc.moveTo(100, 200).lineTo(500, 200).stroke();
    doc.fontSize(12).text(`Reitkarte`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).text(`Für: ${studentName}`, 20, doc.y, { align: 'left', lineBreak: false });
    doc.fontSize(9).text(`Preis: ${price}€ inkl. MwSt`, 150 ,doc.y, { align: 'right' });

    doc.moveDown(1.5);

    // Table Generation
    const tableTop = doc.y;
    const tableHeaders = ['Datum', 'Pferd'];
    const columnStarts = [30, 150];
    const columnWidths = [90, 150];
    const lineWidth = doc.page.width - 20;

    // Table Header
    doc.font('Helvetica-Bold').fontSize(11);
    tableHeaders.forEach((header, i) => doc.text(header, columnStarts[i], tableTop, { width: columnWidths[i] }));
    doc.moveTo(30, tableTop + 20).lineTo(lineWidth, tableTop + 20).strokeColor('#aaaaaa').stroke();

    // Table Rows
    let currentRowY = tableTop + 25;
    doc.font('Helvetica').fontSize(10);
    for (const lesson of lessonDetails) {
        const rowHeight = Math.max(20, (doc.heightOfString(lesson.notes || '', { width: columnWidths[2] })) + 10);

        doc.text(formatDateWithWeekday(lesson.date), columnStarts[0], currentRowY, { width: columnWidths[0] });
        doc.text(lesson.horse_name || 'N/A', columnStarts[1], currentRowY, { width: columnWidths[1] });

        currentRowY += rowHeight;
        doc.moveTo(30, currentRowY - 5).lineTo(lineWidth, currentRowY - 5).strokeColor('#eeeeee').stroke();

        if (currentRowY > 750) { doc.addPage(); currentRowY = tableTop; }
    }

    doc.moveDown(2);
    doc.fontSize(7).text('Der oben genannte Betrag wird abgebucht ja/nein',  20, doc.y, { align: 'left'});
    doc.moveDown(0.5);
    doc.fontSize(7).text('Zur Information:: Der o.g Betrag setzt sich zusammen aus dem Honorar für Trainer und Unfall/Haftpflichtversicherung (Verein) einerseits, sowie Gebür für das gemietete Pferd (Fam. Schmid) andererseits.', 20, doc.y, { align: 'left' });

    doc.end();
    await dialog.showMessageBox({ title: 'Karte erstellt', message: `Karte für ${studentName} wurde auf dem Desktop gespeichert` });
    shell.openPath(filePath);
}



ipcMain.handle('get-available-reports', async (): Promise<IStudentReportInfo[]> => {
    const query = `
        SELECT l.student_id, s.name as student_name, COUNT(l.id) as total_lessons
        FROM lessons l
                 JOIN students s ON l.student_id = s.id
        GROUP BY l.student_id
        ORDER BY s.name
    `;
    const results = await dbQuery(query);

    return results.map(student => {
        // Calculate completed milestones (e.g., 10, 20, 30...)
        const milestones: number[] = [];
        for (let i = 10; i <= student.total_lessons; i += 10) {
            milestones.push(i);
        }

        // --- NEW LOGIC ---
        // Calculate progress towards the next milestone using the modulo operator.
        // e.g., 27 lessons % 10 = 7 lessons of progress.
        const progress = student.total_lessons % 10;

        return {
            student_id: student.student_id,
            student_name: student.student_name,
            total_lessons: student.total_lessons,
            available_milestones: milestones,
            progress_towards_next: progress // Add the new value to the result
        };
    });
});

ipcMain.handle('print-student-report', async (e, studentId: number, milestone: number) => {
    await generateStudentReportPDF(studentId, milestone);
});


ipcMain.handle('get-school-info', async (): Promise<ISchoolInfo | null> => {
    const results = await dbQuery('SELECT * FROM school_info WHERE id = 1');
    return results.length > 0 ? results[0] : null;
});

ipcMain.handle('update-school-info', async (e, info: ISchoolInfo) => {
    const { school_name, street_address, zip_code, phone_number, fax, bank_name, iban, blz,price_10_card_members, price_10_card_nonMembers } = info;
    const query = `
        INSERT INTO school_info (id, school_name, street_address, zip_code, phone_number, fax, bank_name, iban, blz, price_10_card_members, price_10_card_nonMembers)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            school_name = excluded.school_name,
            street_address = excluded.street_address,
            zip_code = excluded.zip_code,
            phone_number = excluded.phone_number,
            fax = excluded.fax,
            bank_name = excluded.bank_name,
            iban = excluded.iban,
            blz = excluded.blz,
            price_10_card_members = excluded.price_10_card_members,
            price_10_card_nonMembers = excluded.price_10_card_nonMembers;
    `;
    await dbRun(query, [school_name, street_address, zip_code, phone_number, fax, bank_name, iban, blz, price_10_card_members, price_10_card_nonMembers]);
});

// App Lifecycle
app.whenReady().then(() => {
    createWindow();

    if (app.isPackaged) {
        initializeAutoUpdater();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });