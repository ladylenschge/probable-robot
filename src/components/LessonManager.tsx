// src/components/LessonManager.tsx

import React, { useState, useEffect } from 'react';
import { IStudent, IHorse, ILesson } from '../../electron/types';

export const LessonManager = () => {
    // Main data stores from the database
    const [allLessons, setAllLessons] = useState<ILesson[]>([]);
    const [students, setStudents] = useState<IStudent[]>([]);
    const [horses, setHorses] = useState<IHorse[]>([]);

    // 1. --- NEW STATE ---
    // State to hold the ID of the selected student for filtering. '' means 'All Students'.
    const [filterStudentId, setFilterStudentId] = useState<string>('');
    // State to hold the lessons that are actually displayed in the table.
    const [filteredLessons, setFilteredLessons] = useState<ILesson[]>([]);

    // Form state
    const [studentId, setStudentId] = useState('');
    const [horseId, setHorseId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    // Initial data fetch
    useEffect(() => {
        window.api.getLessons().then(setAllLessons);
        window.api.getStudents().then(setStudents);
        window.api.getHorses().then(setHorses);
    }, []);

    // 2. --- NEW EFFECT FOR FILTERING ---
    // This effect runs whenever the main lesson list or the filter selection changes.
    useEffect(() => {
        if (filterStudentId === '') {
            // If 'All Students' is selected, show the complete list.
            setFilteredLessons(allLessons);
        } else {
            // Otherwise, filter the list to show only lessons for the selected student.
            const filtered = allLessons.filter(lesson => lesson.student_id === Number(filterStudentId));
            setFilteredLessons(filtered);
        }
    }, [filterStudentId, allLessons]); // Dependencies: run when filter or data changes


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!studentId || !horseId) return;
        const lessonData = { student_id: +studentId, horse_id: +horseId, date, notes };
        const newLesson = await window.api.addLesson(lessonData);
        // Add the new lesson to the main list. The filter effect will handle the display.
        setAllLessons([newLesson, ...allLessons]);
    };

    return (
        <div className="manager-container">
            <div className="form-section">
                <h2>Add Individual Lesson</h2>
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
                    <button className="submit-btn" type="submit">Add to History</button>
                </form>
            </div>
            <div className="list-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Lesson History</h2>

                    {/* 3. --- NEW FILTER UI --- */}
                    <div className="filter-container">
                        <label htmlFor="student-filter" style={{ marginRight: '10px' }}>Filter by Student:</label>
                        <select
                            id="student-filter"
                            value={filterStudentId}
                            onChange={e => setFilterStudentId(e.target.value)}
                        >
                            <option value="">All Students</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <table>
                    <thead><tr><th>Date</th><th>Student</th><th>Horse</th><th>Notes</th></tr></thead>
                    <tbody>
                    {/* 4. --- UPDATED RENDER --- */}
                    {/* The table now renders the 'filteredLessons' state instead of the main list */}
                    {filteredLessons.map(l => (
                        <tr key={l.id}>
                            <td>{l.date}</td>
                            <td>{l.student_name}</td>
                            <td>{l.horse_name}</td>
                            <td>{l.notes}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};