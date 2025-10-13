import React, { useState, useEffect, useMemo } from 'react';
import { IStudent } from '../../electron/types';

interface IRiderGroup {
    id: number;
    name: string;
    description?: string;
    weekday: number;
    time: string;
}

interface IGroupMember {
    group_id: number;
    student_id: number;
    student_name?: string;
}

export const RiderGroupManager = () => {
    const [groups, setGroups] = useState<IRiderGroup[]>([]);
    const [allStudents, setAllStudents] = useState<IStudent[]>([]);

    const [selectedGroup, setSelectedGroup] = useState<IRiderGroup | null>(null);
    const [groupMembers, setGroupMembers] = useState<IGroupMember[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<IStudent[]>([]);

    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupWeekday, setNewGroupWeekday] = useState(1); // Montag
    const [newGroupTime, setNewGroupTime] = useState('10:00');
    const [showNewGroupForm, setShowNewGroupForm] = useState(false);

    const [studentSearch, setStudentSearch] = useState('');
    const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);
    const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

    const weekDayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    useEffect(() => {
        loadGroups();
        window.api.getStudents().then(setAllStudents);
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const loadGroups = async () => {
        const data = await window.api.getRiderGroups();
        setGroups(data);
    };

    const handleSelectGroup = async (group: IRiderGroup) => {
        setSelectedGroup(group);
        const members = await window.api.getGroupMembers(group.id);
        setGroupMembers(members);

        const students = members
            .map((m: IGroupMember) => allStudents.find(s => s.id === m.student_id))
            .filter((s): s is IStudent => s !== undefined);

        setSelectedStudents(students);
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            setMessage({text: 'Bitte einen Namen eingeben', type: 'error'});
            return;
        }

       console.log('Creating group with:', {
            name: newGroupName,
            description: newGroupDescription,
            weekday: newGroupWeekday,
            time: newGroupTime
        });

        try{
            const result = await window.api.addRiderGroup(newGroupName, newGroupDescription, newGroupWeekday, newGroupTime);
            console.log('Group created:', result);
            setMessage({text: 'Gruppe erfolgreich erstellt', type: 'success'});
        } catch(error) {
            console.error('Error creating group:', error);
            setMessage({text: `Fehler: ${error}`, type: 'error'});
        }
        setNewGroupName('');
        setNewGroupDescription('');
        setNewGroupWeekday(1);
        setNewGroupTime('10:00');
        setShowNewGroupForm(false);
        loadGroups();
    };

    const handleSaveGroup = async () => {
        if (!selectedGroup) return;

        if (selectedStudents.length === 0) {
            setMessage({text: 'Bitte mindestens einen Reiter hinzufügen', type: 'error'});
            return;
        }

        const studentIds = selectedStudents.map(s => s.id);
        await window.api.saveGroupMembers(selectedGroup.id, studentIds);
        setMessage({text: 'Gruppe erfolgreich gespeichert', type: 'success'});
        handleSelectGroup(selectedGroup);
    };

    const handleDeleteGroup = (group: IRiderGroup) => {
        setConfirmDialog({
            message: `Gruppe "${group.name}" wirklich löschen?`,
            onConfirm: async () => {
                await window.api.deleteRiderGroup(group.id);
                setMessage({text: 'Gruppe gelöscht', type: 'success'});
                setConfirmDialog(null);
                setSelectedGroup(null);
                setSelectedStudents([]);
                loadGroups();
            }
        });
    };

    const selectedStudentIds = useMemo(() =>
            new Set(selectedStudents.map(s => s.id)),
        [selectedStudents]
    );

    const availableStudents = useMemo(() =>
            allStudents.filter(s =>
                !selectedStudentIds.has(s.id) &&
                s.name.toLowerCase().includes(studentSearch.toLowerCase())
            ),
        [allStudents, selectedStudentIds, studentSearch]
    );

    const handleAddStudent = (student: IStudent) => {
        setSelectedStudents(prev => [...prev, student]);
    };

    const handleRemoveStudent = (studentId: number) => {
        setSelectedStudents(prev => prev.filter(s => s.id !== studentId));
    };

    return (
        <div>
            {/* Message Notification */}
            {message && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px',
                    background: message.type === 'error' ? '#dc3545' : '#28a745',
                    color: 'white', padding: '15px 20px', borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1001, maxWidth: '400px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)} style={{
                            background: 'transparent', border: 'none', color: 'white',
                            fontSize: '20px', cursor: 'pointer', marginLeft: '10px'
                        }}>×</button>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
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

            <div className="manager-container" style={{gridTemplateColumns: '1fr 2fr', gap: '20px'}}>
                {/* Linke Seite: Gruppenliste */}
                <div className="list-section">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                        <h2 style={{margin: 0}}>Reitergruppen</h2>
                        <button
                            className="submit-btn"
                            onClick={() => setShowNewGroupForm(!showNewGroupForm)}
                            style={{padding: '5px 15px'}}
                        >
                            {showNewGroupForm ? 'Abbrechen' : '+ Neue Gruppe'}
                        </button>
                    </div>

                    {showNewGroupForm && (
                        <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px'}}>
                            <input
                                type="text"
                                placeholder="Gruppenname"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                style={{width: '100%', marginBottom: '10px'}}
                            />
                            <textarea
                                placeholder="Beschreibung (optional)"
                                value={newGroupDescription}
                                onChange={e => setNewGroupDescription(e.target.value)}
                                style={{width: '100%', marginBottom: '10px', minHeight: '60px'}}
                            />
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Wochentag:</label>
                            <select
                                value={newGroupWeekday}
                                onChange={e => setNewGroupWeekday(Number(e.target.value))}
                                style={{width: '100%', marginBottom: '10px'}}
                            >
                                {weekDayNames.map((day, index) => (
                                    <option key={index} value={index}>{day}</option>
                                ))}
                            </select>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Uhrzeit:</label>
                            <input
                                type="time"
                                value={newGroupTime}
                                onChange={e => setNewGroupTime(e.target.value)}
                                style={{width: '100%', marginBottom: '10px'}}
                            />
                            <button className="submit-btn" onClick={handleCreateGroup} style={{width: '100%'}}>
                                Gruppe erstellen
                            </button>
                        </div>
                    )}

                    {groups.length === 0 && <p style={{color: '#6c757d'}}>Noch keine Gruppen erstellt</p>}
                    {groups.map(group => (
                        <div
                            key={group.id}
                            onClick={() => handleSelectGroup(group)}
                            style={{
                                padding: '12px', marginBottom: '8px',
                                background: selectedGroup?.id === group.id ? '#007bff' : '#fff',
                                color: selectedGroup?.id === group.id ? '#fff' : '#000',
                                border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                        >
                            <div style={{flex: 1}}>
                                <strong>{group.name}</strong>
                                <div style={{fontSize: '0.9em', opacity: 0.8}}>
                                    📅 {weekDayNames[group.weekday]}, {group.time} Uhr
                                </div>
                                {group.description && <div style={{fontSize: '0.85em', opacity: 0.7}}>{group.description}</div>}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteGroup(group);
                                }}
                                style={{
                                    background: '#dc3545', color: 'white', border: 'none',
                                    borderRadius: '50%', width: '25px', height: '25px',
                                    cursor: 'pointer', fontSize: '18px'
                                }}
                            >×</button>
                        </div>
                    ))}
                </div>

                {/* Rechte Seite: Gruppendetails */}
                <div className="form-section">
                    {!selectedGroup ? (
                        <div style={{textAlign: 'center', padding: '40px', color: '#6c757d'}}>
                            <h3>Keine Gruppe ausgewählt</h3>
                            <p>Wähle links eine Gruppe aus oder erstelle eine neue</p>
                        </div>
                    ) : (
                        <>
                            <h2>{selectedGroup.name}</h2>
                            <div style={{color: '#0066cc', fontWeight: 'bold', marginBottom: '10px'}}>
                                📅 {weekDayNames[selectedGroup.weekday]}, {selectedGroup.time} Uhr
                            </div>
                            {selectedGroup.description && <p style={{color: '#6c757d'}}>{selectedGroup.description}</p>}

                            <hr/>

                            <h4>Reiter in der Gruppe ({selectedStudents.length})</h4>
                            <p style={{fontSize: '0.9em', color: '#6c757d', marginBottom: '15px'}}>
                                Die Pferde werden später im Tagesplan zugewiesen
                            </p>

                            {selectedStudents.length === 0 ? (
                                <p style={{color: '#6c757d', padding: '20px', background: '#f8f9fa', borderRadius: '4px', textAlign: 'center'}}>
                                    Noch keine Reiter hinzugefügt
                                </p>
                            ) : (
                                <div style={{marginBottom: '20px'}}>
                                    {selectedStudents.map(student => (
                                        <div key={student.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px',
                                            marginBottom: '8px',
                                            background: '#e9ecef',
                                            borderRadius: '4px'
                                        }}>
                                            <span style={{fontWeight: 'bold'}}>👤 {student.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStudent(student.id)}
                                                style={{
                                                    background: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '30px',
                                                    height: '30px',
                                                    cursor: 'pointer',
                                                    fontSize: '20px'
                                                }}
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <hr/>

                            <h4>Verfügbare Reiter ({availableStudents.length})</h4>
                            <input
                                type="text"
                                placeholder="Suche Reiter..."
                                value={studentSearch}
                                onChange={e => setStudentSearch(e.target.value)}
                                style={{width: '100%', marginBottom: '10px'}}
                            />
                            <div style={{
                                maxHeight: '250px',
                                overflowY: 'auto',
                                border: '1px solid #ddd',
                                padding: '10px',
                                marginBottom: '20px',
                                borderRadius: '4px'
                            }}>
                                {availableStudents.length === 0 ? (
                                    <p style={{color: '#6c757d', textAlign: 'center', margin: '10px 0'}}>
                                        Keine weiteren Reiter verfügbar
                                    </p>
                                ) : (
                                    availableStudents.map(student => (
                                        <div key={student.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 0',
                                            borderBottom: '1px solid #eee'
                                        }}>
                                            <span>👤 {student.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleAddStudent(student)}
                                                style={{
                                                    padding: '4px 12px',
                                                    background: '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >+</button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button
                                className="submit-btn"
                                onClick={handleSaveGroup}
                                disabled={selectedStudents.length === 0}
                                style={{width: '100%', padding: '12px', fontSize: '16px'}}
                            >
                                💾 Gruppe speichern ({selectedStudents.length} Reiter)
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};