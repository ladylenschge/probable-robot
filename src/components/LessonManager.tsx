import React, { useState, useEffect } from 'react';
import { IStudent, IHorse, ILesson } from '../../electron/types';

export const LessonManager = () => {
    const [lessons, setLessons] = useState<ILesson[]>([]);
    const [students, setStudents] = useState<IStudent[]>([]);
    const [horses, setHorses] = useState<IHorse[]>([]);

    // Form state
    const [studentId, setStudentId] = useState('');
    const [horseId, setHorseId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        window.api.getLessons().then(setLessons);
        window.api.getStudents().then(setStudents);
        window.api.getHorses().then(setHorses);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!studentId || !horseId) return;
        const lessonData = { student_id: +studentId, horse_id: +horseId, date, notes };
        const newLesson = await window.api.addLesson(lessonData);
        setLessons([newLesson, ...lessons]);
    };

    return (
        <div className="manager-container">
            <div className="form-section">
                <h2>Add Lesson</h2>
                <form onSubmit={handleSubmit}>
                    <select value={studentId} onChange={e => setStudentId(e.target.value)} required>
                        <option value="">Select Student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={horseId} onChange={e => setHorseId(e.target.value)} required>
                        <option value="">Select Horse</option>
                        {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Lesson notes..."></textarea>
                    <button className="submit-btn" type="submit">Add Lesson</button>
                </form>
            </div>
            <div className="list-section">
                <h2>Lesson History</h2>
                <table>
                    <thead><tr><th>Date</th><th>Student</th><th>Horse</th><th>Notes</th></tr></thead>
                    <tbody>
                    {lessons.map(l => <tr key={l.id}><td>{l.date}</td><td>{l.student_name}</td><td>{l.horse_name}</td><td>{l.notes}</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};