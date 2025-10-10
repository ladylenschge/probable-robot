import React, { useState, useEffect, useMemo } from 'react';
import { IStudent, IHorse, IDailyScheduleSlot } from '../../electron/types';

// The shape of our assignment rows in the builder
type AssignmentRow = {
    student: IStudent;
    horse_id: number | '';
};

// The shape of our form's state object
const initialFormState = {
    id: null as number | null,
    time: '09:00',
    isSingleLesson: false,
    assignmentRows: [] as AssignmentRow[],
};

export const DailyScheduleManager = () => {
    // Main data stores from the database
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [schedule, setSchedule] = useState<IDailyScheduleSlot[]>([]);
    const [allStudents, setAllStudents] = useState<IStudent[]>([]);
    const [allHorses, setAllHorses] = useState<IHorse[]>([]);

    // Form and filter state
    const [formState, setFormState] = useState(initialFormState);
    const [studentSearch, setStudentSearch] = useState('');
    const [horseSearch, setHorseSearch] = useState('');
    const isEditing = formState.id !== null;

    // --- DATA FETCHING ---
    useEffect(() => {
        window.api.getStudents().then(setAllStudents);
        window.api.getHorses().then(setAllHorses);
    }, []);

    const fetchSchedule = (forDate: string) => {
        window.api.getDailySchedule(forDate).then(setSchedule);
    };
    useEffect(() => { if (date) fetchSchedule(date) }, [date]);

    // --- DERIVED STATE (for the UI) ---
    const assignedStudentIds = useMemo(() => new Set(formState.assignmentRows.map(row => row.student.id)), [formState.assignmentRows]);
    const assignedHorseIdsInForm = useMemo(() => new Set(formState.assignmentRows.map(row => row.horse_id)), [formState.assignmentRows]);

    const availableStudents = useMemo(() =>
            allStudents.filter(s =>
                !assignedStudentIds.has(s.id) &&
                s.name.toLowerCase().includes(studentSearch.toLowerCase())
            ),
        [allStudents, assignedStudentIds, studentSearch]
    );

    const availableHorsesForDropdown = useMemo(() =>
            allHorses.filter(h =>
                h.name.toLowerCase().includes(horseSearch.toLowerCase())
            ),
        [allHorses, horseSearch]
    );

    // --- HANDLERS ---
    const handleAddRiderToGroup = (student: IStudent) => {
        if (formState.isSingleLesson && formState.assignmentRows.length >= 1) {
            alert('A single lesson can only have one rider.');
            return;
        }
        setFormState(prev => ({...prev, assignmentRows: [...prev.assignmentRows, { student: student, horse_id: '' }]}));
    };

    const handleRemoveRiderFromGroup = (studentId: number) => {
        setFormState(prev => ({...prev, assignmentRows: prev.assignmentRows.filter(row => row.student.id !== studentId)}));
    };

    const handleHorseChange = (rowIndex: number, newHorseIdStr: string) => {
        const newHorseId = newHorseIdStr === '' ? '' : Number(newHorseIdStr);
        setFormState(currentFormState => {
            const newRows = [...currentFormState.assignmentRows];
            if (newHorseId !== '') {
                const otherRowIndex = newRows.findIndex(row => row.horse_id === newHorseId);
                if (otherRowIndex > -1 && otherRowIndex !== rowIndex) {
                    newRows[otherRowIndex] = { ...newRows[otherRowIndex], horse_id: '' };
                }
            }
            newRows[rowIndex] = { ...newRows[rowIndex], horse_id: newHorseId };
            return { ...currentFormState, assignmentRows: newRows };
        });
    };

    const handleEditClick = (slot: IDailyScheduleSlot) => {
        setFormState({
            id: slot.id,
            time: slot.time,
            isSingleLesson: slot.participants.length === 1,
            assignmentRows: slot.participants.map(p => ({
                student: allStudents.find(s => s.id === p.student_id)!,
                horse_id: p.horse_id,
            })),
        });
        window.scrollTo(0, 0);
    };

    const handleCancelEdit = () => {
        setFormState(initialFormState);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { id, time, isSingleLesson, assignmentRows } = formState;
        const completePairs = assignmentRows.filter(row => row.horse_id !== '');
        if (completePairs.length !== assignmentRows.length || completePairs.length === 0) {
            alert('Bitte ein Pferd zu jedem Reiter zuweisen');
            return;
        }
        const assignedHorseIds = new Set(completePairs.map(p => p.horse_id));
        if (assignedHorseIds.size !== completePairs.length) {
            alert('Ein Pferd kann nur einem Reiter pro Gruppe zugewiesen werden');
            return;
        }

        if(completePairs.length > 1 && isSingleLesson){
            alert('Einzelstunde ausgewählt - nicht mehr als ein Reiter möglich')
            return;
        }
        const slotData = {
            date, time,
            participants: completePairs.map(p => ({
                student_id: p.student.id, horse_id: p.horse_id as number,
                student_name: '', horse_name: '',
            })),
        };

        if (isEditing) {
            await window.api.updateScheduleSlot({ id: id!, ...slotData });

            fetchSchedule(date);
        } else {
            await window.api.addScheduleSlot(slotData, isSingleLesson);
            fetchSchedule(date);
        }
        setFormState(initialFormState);
    };

    const handleDeleteSlot = async (scheduleId: number) => {
        const userConfirmed = window.confirm('Wirklich die ganze Gruppe löschen?');
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

    const formatDate = (isoString: string) =>  {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }


    return (
        <div>
            <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{width: 'auto'}} />
                <button className="submit-btn" onClick={handlePrint} disabled={schedule.length === 0}>Drucken Übersicht Reitzeiten (PDF)</button>
            </div>

            <div className="manager-container" style={{gridTemplateColumns: '2fr 1fr', alignItems: 'start', marginBottom: '40px'}}>
                <div className="form-section">
                    <h2>{isEditing ? `Bearbeiten der Stunde von ${formState.time}` : 'Hinzufügen Stunde'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                            <div style={{flex: 1}}>
                                <label>Time</label>
                                <input type="time" value={formState.time} onChange={e => setFormState({...formState, time: e.target.value})} required />
                            </div>
                        </div>

                        <div style={{ margin: '15px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input type="checkbox" id="isSingleLesson" checked={formState.isSingleLesson} onChange={e => setFormState({...formState, isSingleLesson: e.target.checked})} />
                                <label htmlFor="isSingleLesson" style={{ marginBottom: 0, marginLeft: '10px' }}>Einzelstunde?</label>
                            </div>
                        </div>

                        <hr />

                        <h4>Reiter in der Gruppe ({formState.assignmentRows.length})</h4>
                        {formState.assignmentRows.length === 0 && <p style={{color: '#6c757d'}}>Reiter aus der Liste (rechts) hinzufügen.</p>}
                        {formState.assignmentRows.map((row, index) => (
                            <div key={row.student.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{fontWeight: 'bold', padding: '8px', background: '#e9ecef', borderRadius: '4px'}}>{row.student.name}</span>
                                <select value={row.horse_id} onChange={e => handleHorseChange(index, e.target.value)} required>
                                    <option value="">-- Pferd zuweisen --</option>
                                    {row.horse_id && <option value={row.horse_id}>{allHorses.find(h => h.id === row.horse_id)?.name}</option>}
                                    {availableHorsesForDropdown.filter(h => !assignedHorseIdsInForm.has(h.id)).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                                <button type="button" onClick={() => handleRemoveRiderFromGroup(row.student.id)} style={{background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer'}}>&times;</button>
                            </div>
                        ))}

                        <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                            <button className="submit-btn" type="submit" disabled={formState.assignmentRows.length === 0}>
                                {isEditing ? 'Änderungen speichern' : 'Zur Stunde hinzufügen'}
                            </button>
                            {isEditing && (
                                <button type="button" onClick={handleCancelEdit} className="submit-btn" style={{background: '#6c757d'}}>
                                    Abbrechen
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="list-section">
                    <h4>Verfügbare Reiter ({availableStudents.length})</h4>
                    <input
                        type="text"
                        placeholder="Suche Reiter..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        style={{width: '100%', boxSizing: 'border-box', marginBottom: '5px'}}
                    />
                    <div style={{maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px'}}>
                        {availableStudents.map(student => (
                            <div key={student.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0'}}>
                                <span>{student.name}</span>
                                <button type="button" onClick={() => handleAddRiderToGroup(student)} style={{padding: '2px 8px'}}>+</button>
                            </div>
                        ))}
                    </div>

                    <h4 style={{marginTop: '20px'}}>Verfügbare Pferde ({allHorses.filter(h => !assignedHorseIdsInForm.has(h.id)).length})</h4>
                    <input
                        type="text"
                        placeholder="Suche Pferde..."
                        value={horseSearch}
                        onChange={e => setHorseSearch(e.target.value)}
                        style={{width: '100%', boxSizing: 'border-box', marginBottom: '5px'}}
                    />
                    <div style={{maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px'}}>
                        {availableHorsesForDropdown.map(horse => (
                            <div key={horse.id} style={{padding: '5px 0', color: assignedHorseIdsInForm.has(horse.id) ? '#adb5bd' : 'inherit'}}>
                                {horse.name} {assignedHorseIdsInForm.has(horse.id) ? '(Zugewiesen)' : ''}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="list-section">
                <h2>Übersicht für {formatDate(date)}</h2>
                {schedule.length === 0 && <p>Noch keine Stunden erstellt für heute.</p>}
                {schedule.sort((a,b) => a.time.localeCompare(b.time)).map(slot => (
                    <div key={slot.id} style={{marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '10px'}}>
                            <h3 style={{margin: 0}}>{slot.time}</h3>
                            <div>
                                <button onClick={() => handleEditClick(slot)} className="submit-btn" style={{padding: '5px 10px', marginRight: '5px'}}>Bearbeiten</button>
                                <button onClick={() => handleDeleteSlot(slot.id)} className="submit-btn" style={{padding: '5px 10px', background: '#dc3545' }}>Gruppe löschen</button>
                            </div>
                        </div>
                        {slot.participants.map(p => (
                            <div key={p.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '5px 0', paddingLeft: '10px' }}>
                                <p style={{margin: 0}}><strong>{p.student_name}</strong> --- <strong>{p.horse_name}</strong></p>
                                <button
                                    onClick={() => handleDeleteParticipant(slot.id, p.student_id)}
                                    title={`Entferne ${p.student_name} von der Stunde`}
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
    );
};