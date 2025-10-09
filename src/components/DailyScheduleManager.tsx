import React, { useState, useEffect } from 'react';
import { IStudent, IHorse, IDailyScheduleSlot } from '../../electron/types';

export const DailyScheduleManager = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [schedule, setSchedule] = useState<IDailyScheduleSlot[]>([]);
    const [students, setStudents] = useState<IStudent[]>([]);
    const [horses, setHorses] = useState<IHorse[]>([]);

    // Form state
    const [time, setTime] = useState('09:00');
    //const [groupName, setGroupName] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [selectedHorses, setSelectedHorses] = useState<number[]>([]);

    useEffect(() => {
        window.api.getStudents().then(setStudents);
        window.api.getHorses().then(setHorses);
    }, []);

    const formatDate = (isoString: string) =>  {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    const fetchSchedule = (forDate: string) => {
        window.api.getDailySchedule(forDate).then(setSchedule);
    };

    useEffect(() => {
        if (date) {
            fetchSchedule(date);
        }
    }, [date]);

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudents.length === 0 || selectedStudents.length !== selectedHorses.length) {
            alert('Please select at least one student and ensure each student has a horse.');
            return;
        }

        const newSlot: Omit<IDailyScheduleSlot, 'id'> = {
            date, time,
            participants: selectedStudents.map((studentId, index) => ({
                student_id: studentId, horse_id: selectedHorses[index],
                student_name: '', horse_name: '',
            })),
        };

        await window.api.addScheduleSlot(newSlot);
        fetchSchedule(date);
        setSelectedStudents([]); setSelectedHorses([]);
    };

    const handleDeleteSlot = async (scheduleId: number) => {
        const userConfirmed = window.confirm('Die komplette Stunde löschen?');

        if (userConfirmed) {
            await window.api.deleteScheduleSlot(scheduleId);
            setSchedule(schedule.filter(slot => slot.id !== scheduleId));
        }
    };

    const handleDeleteParticipant = async (scheduleId: number, studentId: number) => {
        const userConfirmed = window.confirm('Den Reiter wirklich von der Stunde entfernen?');
        if (userConfirmed) {
            await window.api.deleteScheduleParticipant(scheduleId, studentId);

            const newSchedule = schedule.map(slot => {
                if (slot.id === scheduleId) {
                    const updatedParticipants = slot.participants.filter(p => p.student_id !== studentId);

                    if(updatedParticipants.length > 0) {
                        return { ...slot, participants: updatedParticipants };

                    } else {
                        handleDeleteSlot(scheduleId);
                    }
                }
                return slot;
            });

            setSchedule(newSchedule);
        }
    };

    const handlePrint = () => {
        window.api.printDailySchedule(date);
    };

    return (
        <div>
            <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{width: 'auto'}} />
                <button className="submit-btn" onClick={handlePrint} disabled={schedule.length === 0}>Drucken Reitstundenliste (PDF)</button>
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

                        <button className="submit-btn" type="submit">Hinzufügen</button>
                    </form>
                </div>
                <div className="list-section">
                    <h2>Stunden für {formatDate(date)}</h2>
                    {schedule.sort((a,b) => a.time.localeCompare(b.time)).map(slot => (
                        <div key={slot.id} style={{
                            marginBottom: '20px',
                            padding: '10px',
                            background: '#f9f9f9',
                            borderRadius: '4px'
                        }}>
                            <h3 style={{borderBottom: '1px solid #ccc', paddingBottom: '5px'}}>{slot.time}</h3>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="submit-btn"
                                    style={{background: '#dc3545', padding: '5px 10px', fontSize: '12px'}}
                                >
                                    Ganze Stunde löschen
                                </button>
                            </div>
                            {slot.participants.map(p => (
                                <div key={p.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '5px 0' }}>
                                    <p style={{margin: 0}}><strong>{p.student_name}</strong> --- <strong>{p.horse_name}</strong></p>
                                    <button
                                        onClick={() => handleDeleteParticipant(slot.id, p.student_id)}
                                        title={`Entfernen ${p.student_name} von dieser Stunde`}
                                        style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};