import React, { useState, useEffect } from 'react';
import { IStudent, IHorse, IDailyScheduleSlot } from '../../electron/types';

export const DailyScheduleManager = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [schedule, setSchedule] = useState<IDailyScheduleSlot[]>([]);
    const [students, setStudents] = useState<IStudent[]>([]);
    const [horses, setHorses] = useState<IHorse[]>([]);

    // Form state
    const [time, setTime] = useState('09:00');
    const [groupName, setGroupName] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [selectedHorses, setSelectedHorses] = useState<number[]>([]);

    useEffect(() => {
        window.api.getStudents().then(setStudents);
        window.api.getHorses().then(setHorses);
    }, []);

    useEffect(() => {
        if (date) {
            window.api.getDailySchedule(date).then(setSchedule);
        }
    }, [date]);

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudents.length === 0 || selectedStudents.length !== selectedHorses.length) {
            alert('Mindestens eine Person und Pferd auswählen');
            return;
        }

        const newSlot: Omit<IDailyScheduleSlot, 'id'> = {
            date,
            time,
            participants: selectedStudents.map((studentId, index) => ({
                student_id: studentId,
                horse_id: selectedHorses[index],
                student_name: '', // Names are not needed for saving
                horse_name: '',
            })),
        };

        const addedSlot = await window.api.addScheduleSlot(newSlot);
        setSchedule([...schedule, addedSlot]);

        // Reset form
        setSelectedStudents([]);
        setSelectedHorses([]);
    };

    const handlePrint = () => {
        window.api.printDailySchedule(date);
    };

    return (
        <div>
            <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{width: 'auto'}} />
                <button className="submit-btn" onClick={handlePrint} disabled={schedule.length === 0}>Drucken Reitstunde (PDF)</button>
            </div>

            <div className="manager-container">
                <div className="form-section">
                    <h2>Stunde hinzufügen</h2>
                    <form onSubmit={handleAddSlot}>
                        <label>Zeit</label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} required />

                        <label>Reitschüler (mehrere auswählbar)</label>
                        <select multiple value={selectedStudents.map(String)} onChange={e => setSelectedStudents(Array.from(e.target.selectedOptions, option => +option.value))} style={{height: '120px'}}>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>

                        <label>Pferde (in gleicher Reihenfolge auswählen)</label>
                        <select multiple value={selectedHorses.map(String)} onChange={e => setSelectedHorses(Array.from(e.target.selectedOptions, option => +option.value))} style={{height: '120px'}}>
                            {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>

                        <button className="submit-btn" type="submit">Zur Stunde hinzufügen</button>
                    </form>
                </div>
                <div className="list-section">
                    <h2>Stunden für {date}</h2>
                    {schedule.sort((a,b) => a.time.localeCompare(b.time)).map(slot => (
                        <div key={slot.id} style={{marginBottom: '20px'}}>
                            <h3 style={{borderBottom: '1px solid #ccc', paddingBottom: '5px'}}>{slot.time}</h3>
                            {slot.participants.map(p => (
                                <p key={p.student_id} style={{margin: '5px 0'}}><strong>{p.student_name}</strong> - <strong>{p.horse_name}</strong></p>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};