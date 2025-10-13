import React, { useState, useEffect, useMemo } from 'react';
import { IStudent, IHorse, IDailyScheduleSlot } from '../../electron/types';

type AssignmentRow = {
    student: IStudent;
    horse_id: number | '';
    isCancelled?: boolean;
};

const initialFormState = {
    id: null as number | null,
    time: '09:00',
    isSingleLesson: false,
    assignmentRows: [] as AssignmentRow[],
};

type ConfirmDialog = {
    type: 'deleteSlot' | 'deleteParticipant';
    message: string;
    onConfirm: () => void;
} | null;

interface IRiderGroup {
    id: number;
    name: string;
    description?: string;
    weekday: number;
    time: string;
}

interface IRiderGroupMember {
    group_id: number;
    student_id: number;
    student_name?: string;
}

export const DailyScheduleManager = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [schedule, setSchedule] = useState<IDailyScheduleSlot[]>([]);
    const [allStudents, setAllStudents] = useState<IStudent[]>([]);
    const [allHorses, setAllHorses] = useState<IHorse[]>([]);
    const [riderGroups, setRiderGroups] = useState<IRiderGroup[]>([]);
    const [groupsForDate, setGroupsForDate] = useState<IRiderGroup[]>([]);

    const [formState, setFormState] = useState(initialFormState);
    const [studentSearch, setStudentSearch] = useState('');
    const [horseSearch, setHorseSearch] = useState('');
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showGroupSelector, setShowGroupSelector] = useState(false);
    const [selectedGroupForLoad, setSelectedGroupForLoad] = useState<number | null>(null);
    const isEditing = formState.id !== null;

    const weekDayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => setErrorMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    useEffect(() => {
        window.api.getStudents().then(setAllStudents);
        window.api.getHorses().then(setAllHorses);
        window.api.getRiderGroups().then(setRiderGroups);
    }, []);

    const fetchSchedule = (forDate: string) => {
        window.api.getDailySchedule(forDate).then(setSchedule);
    };

    useEffect(() => {
        if (date) {
            fetchSchedule(date);
            loadGroupsForDate(date);
        }
    }, [date]);

    const loadGroupsForDate = async (forDate: string) => {
        const groups = await window.api.getGroupsForDate(forDate);
        setGroupsForDate(groups);
    };

    const assignedStudentIds = useMemo(() =>
            new Set(formState.assignmentRows.map(row => row.student.id)),
        [formState.assignmentRows]
    );

    const assignedHorseIdsInForm = useMemo(() =>
            new Set(formState.assignmentRows.map(row => row.horse_id)),
        [formState.assignmentRows]
    );

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

    const handleLoadGroup = async (groupId: number) => {
        const result = await window.api.loadGroupForSchedule(groupId, date);

        const newRows: AssignmentRow[] = result.students
            .map(m => allStudents.find(s => s.id === m.student_id))
            .filter((student): student is IStudent => student !== undefined)
            .map(student => ({
                student,
                horse_id: '' as '' | number,
                isCancelled: result.cancellations.includes(student.id)
            }));

        const group = groupsForDate.find(g => g.id === groupId) || riderGroups.find(g => g.id === groupId);
        if (group) {
            setFormState(prev => ({
                ...prev,
                time: group.time,
                assignmentRows: [...prev.assignmentRows, ...newRows]
            }));
            setSelectedGroupForLoad(groupId);
        }

        setShowGroupSelector(false);
        setErrorMessage(null);
    };

    const handleToggleCancellation = async (studentId: number, rowIndex: number) => {
        if (!selectedGroupForLoad) {
            setErrorMessage('Absagen können nur für geladene Gruppen gesetzt werden');
            return;
        }

        try {
            const isCancelled = await window.api.toggleCancellation(selectedGroupForLoad, studentId, date);

            setFormState(prev => {
                const newRows = [...prev.assignmentRows];
                newRows[rowIndex] = { ...newRows[rowIndex], isCancelled };
                return { ...prev, assignmentRows: newRows };
            });
        } catch (error) {
            console.error('Error toggling cancellation:', error);
            setErrorMessage('Fehler beim Speichern der Absage');
        }
    };

    const handleAddRiderToGroup = (student: IStudent) => {
        setFormState(prev => ({
            ...prev,
            assignmentRows: [...prev.assignmentRows, { student: student, horse_id: '', isCancelled: false }]
        }));
    };

    const handleRemoveRiderFromGroup = (studentId: number) => {
        setFormState(prev => ({
            ...prev,
            assignmentRows: prev.assignmentRows.filter(row => row.student.id !== studentId)
        }));
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
                isCancelled: false
            })),
        });
        window.scrollTo(0, 0);
    };

    const handleCancelEdit = () => {
        setFormState(initialFormState);
        setSelectedGroupForLoad(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { id, time, isSingleLesson, assignmentRows } = formState;

        // Nur nicht-abgesagte Reiter
        const activeRows = assignmentRows.filter(row => !row.isCancelled);
        const completePairs = activeRows.filter(row => row.horse_id !== '');

        if (completePairs.length !== activeRows.length || completePairs.length === 0) {
            setErrorMessage('Bitte ein Pferd zu jedem aktiven Reiter zuweisen');
            return;
        }

        const assignedHorseIds = new Set(completePairs.map(p => p.horse_id));
        if (assignedHorseIds.size !== completePairs.length) {
            setErrorMessage('Ein Pferd kann nur einem Reiter pro Gruppe zugewiesen werden');
            return;
        }

        const slotData = {
            date, time,
            participants: completePairs.map(p => ({
                student_id: p.student.id,
                horse_id: p.horse_id as number,
                student_name: '',
                horse_name: '',
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
        setSelectedGroupForLoad(null);
    };

    const handleDeleteSlot = async (scheduleId: number) => {
        setConfirmDialog({
            type: 'deleteSlot',
            message: 'Wirklich die ganze Gruppe löschen?',
            onConfirm: async () => {
                await window.api.deleteScheduleSlot(scheduleId);
                setSchedule(schedule.filter(slot => slot.id !== scheduleId));
                setConfirmDialog(null);
            }
        });
    };

    const handleDeleteParticipant = async (scheduleId: number, studentId: number) => {
        const slot = schedule.find(s => s.id === scheduleId);
        const isLastParticipant = slot?.participants.length === 1;

        setConfirmDialog({
            type: 'deleteParticipant',
            message: isLastParticipant
                ? 'Dies ist der letzte Reiter. Die ganze Gruppe wird gelöscht. Fortfahren?'
                : 'Den Reiter wirklich von der Stunde entfernen?',
            onConfirm: async () => {
                await window.api.deleteScheduleParticipant(scheduleId, studentId);

                if (isLastParticipant) {
                    await window.api.deleteScheduleSlot(scheduleId);
                    setSchedule(schedule.filter(slot => slot.id !== scheduleId));
                } else {
                    const newSchedule = schedule.map(slot => {
                        if (slot.id === scheduleId) {
                            const updatedParticipants = slot.participants.filter(p => p.student_id !== studentId);
                            return { ...slot, participants: updatedParticipants };
                        }
                        return slot;
                    });
                    setSchedule(newSchedule);
                }

                setConfirmDialog(null);
            }
        });
    };

    const handlePrint = () => {
        window.api.printDailySchedule(date);
    };

    const handlePrintMonthly = () => {
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        window.api.printMonthlyGroups(year, month);
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
            {errorMessage && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px',
                    background: '#dc3545', color: 'white', padding: '15px 20px',
                    borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1001, maxWidth: '400px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{errorMessage}</span>
                        <button onClick={() => setErrorMessage(null)} style={{
                            background: 'transparent', border: 'none', color: 'white',
                            fontSize: '20px', cursor: 'pointer', marginLeft: '10px'
                        }}>×</button>
                    </div>
                </div>
            )}

            {confirmDialog && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', padding: '20px', borderRadius: '8px',
                        maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Bestätigen</h3>
                        <p>{confirmDialog.message}</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setConfirmDialog(null)} style={{
                                padding: '8px 16px', background: '#6c757d', color: 'white',
                                border: 'none', borderRadius: '4px', cursor: 'pointer'
                            }}>Abbrechen</button>
                            <button onClick={confirmDialog.onConfirm} style={{
                                padding: '8px 16px', background: '#dc3545', color: 'white',
                                border: 'none', borderRadius: '4px', cursor: 'pointer'
                            }}>Löschen</button>
                        </div>
                    </div>
                </div>
            )}

            {showGroupSelector && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', padding: '20px', borderRadius: '8px',
                        maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Reitergruppe laden</h3>
                        {riderGroups.length === 0 ? (
                            <p style={{color: '#6c757d'}}>Keine Gruppen vorhanden.</p>
                        ) : (
                            <div>
                                {riderGroups.map(group => (
                                    <div
                                        key={group.id}
                                        onClick={() => {
                                            setSelectedGroupForLoad(group.id);
                                            handleLoadGroup(group.id);
                                        }}
                                        style={{
                                            padding: '12px', marginBottom: '8px',
                                            background: '#f8f9fa', border: '1px solid #ddd',
                                            borderRadius: '4px', cursor: 'pointer'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#e9ecef'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#f8f9fa'}
                                    >
                                        <strong>{group.name}</strong>
                                        <div style={{fontSize: '0.9em', color: '#6c757d'}}>
                                            {weekDayNames[group.weekday]}, {group.time} Uhr
                                        </div>
                                        {group.description && <div style={{fontSize: '0.85em', color: '#999', marginTop: '4px'}}>{group.description}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowGroupSelector(false)} style={{
                            marginTop: '15px', padding: '8px 16px', background: '#6c757d',
                            color: 'white', border: 'none', borderRadius: '4px',
                            cursor: 'pointer', width: '100%'
                        }}>Abbrechen</button>
                    </div>
                </div>
            )}

            <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{width: 'auto'}} />
                <button className="submit-btn" onClick={handlePrint} disabled={schedule.length === 0}>
                    Tagesübersicht drucken
                </button>
                <button className="submit-btn" onClick={handlePrintMonthly} style={{background: '#28a745'}}>
                    Monatsübersicht drucken
                </button>
            </div>

            {/* Gruppen für diesen Tag */}
            {groupsForDate.length > 0 && (
                <div style={{
                    background: '#e7f3ff', padding: '15px', borderRadius: '8px',
                    marginBottom: '20px', border: '2px solid #007bff'
                }}>
                    <h4 style={{margin: '0 0 10px 0'}}>📅 Gruppen für {weekDayNames[new Date(date).getDay()]}</h4>
                    <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                        {groupsForDate.map(group => (
                            <button
                                key={group.id}
                                onClick={() => {
                                    setSelectedGroupForLoad(group.id);
                                    handleLoadGroup(group.id);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: selectedGroupForLoad === group.id ? '#007bff' : 'white',
                                    color: selectedGroupForLoad === group.id ? 'white' : '#007bff',
                                    border: '2px solid #007bff',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {group.name} - {group.time} Uhr
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="manager-container" style={{gridTemplateColumns: '2fr 1fr', alignItems: 'start', marginBottom: '40px'}}>
                <div className="form-section">
                    <h2>{isEditing ? `Bearbeiten der Stunde von ${formState.time}` : 'Hinzufügen Stunde'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline'}}>
                            <input type="time" value={formState.time} style={{width: "auto"}}
                                   onChange={e => setFormState({...formState, time: e.target.value})} required/>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'baseline'}}>
                                <label htmlFor="isSingleLesson">Einzelstunde?</label>
                                <input type="checkbox" id="isSingleLesson" checked={formState.isSingleLesson}
                                       onChange={e => setFormState({...formState, isSingleLesson: e.target.checked})}/>
                            </div>
                        </div>

                        <button type="button" onClick={() => setShowGroupSelector(true)} style={{
                            width: '100%', padding: '10px', marginTop: '10px',
                            background: '#17a2b8', color: 'white', border: 'none',
                            borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                        }}>📋 Reitergruppe laden</button>

                        <hr/>

                        <h4>Reiter in der Gruppe ({formState.assignmentRows.filter(r => !r.isCancelled).length}/{formState.assignmentRows.length})</h4>
                        {formState.assignmentRows.length === 0 && <p style={{color: '#6c757d'}}>Reiter aus der Liste (rechts) hinzufügen oder Gruppe laden.</p>}
                        {formState.assignmentRows.map((row, index) => (
                            <div key={row.student.id} style={{
                                display: 'grid',
                                gridTemplateColumns: selectedGroupForLoad ? 'auto 1fr 1fr auto' : '1fr 1fr auto',
                                gap: '10px', alignItems: 'center', marginBottom: '10px',
                                opacity: row.isCancelled ? 0.5 : 1
                            }}>
                                {selectedGroupForLoad && (
                                    <label htmlFor="isCancelled">Abgesagt?
                                    <input
                                        id="isCancelled"
                                        type="checkbox"
                                        checked={!row.isCancelled}
                                        onChange={() => handleToggleCancellation(row.student.id, index)}
                                        title={row.isCancelled ? 'Abgesagt - klicken zum Aktivieren' : 'Aktiv - klicken zum Absagen'}
                                        style={{width: '20px', height: '20px'}}
                                    />
                                    </label>
                                )}
                                <span style={{
                                    fontWeight: 'bold', padding: '8px',
                                    background: row.isCancelled ? '#ffebee' : '#e9ecef',
                                    borderRadius: '4px',
                                    textDecoration: row.isCancelled ? 'line-through' : 'none'
                                }}>
                                    {row.isCancelled && '🚫 '}
                                    {row.student.name}
                                </span>
                                <select
                                    value={row.horse_id}
                                    onChange={e => handleHorseChange(index, e.target.value)}
                                    required={!row.isCancelled}
                                    disabled={row.isCancelled}
                                >
                                    <option value="">-- Pferd zuweisen --</option>
                                    {row.horse_id && <option value={row.horse_id}>{allHorses.find(h => h.id === row.horse_id)?.name}</option>}
                                    {availableHorsesForDropdown.filter(h => !assignedHorseIdsInForm.has(h.id)).map(h =>
                                        <option key={h.id} value={h.id}>{h.name}</option>
                                    )}
                                </select>
                                <button type="button" onClick={() => handleRemoveRiderFromGroup(row.student.id)} style={{
                                    background: '#dc3545', color: 'white', border: 'none',
                                    borderRadius: '50%', width: '30px', height: '30px',
                                    cursor: 'pointer', fontSize: '25px'
                                }}>×</button>
                            </div>
                        ))}

                        <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                            <button className="submit-btn" type="submit" disabled={formState.assignmentRows.filter(r => !r.isCancelled).length === 0}>
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