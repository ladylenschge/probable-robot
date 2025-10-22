import React, { useState, useEffect } from 'react';
import { IStudent } from '../../electron/types';

const initialFormState: IStudent = { id: 0, name: '', contact_info: '', isMember: false, isYouth: false };

export const StudentManager = () => {
    const [students, setStudents] = useState<IStudent[]>([]);
    const [formState, setFormState] = useState<IStudent>(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<IStudent | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        window.api.getStudents().then(setStudents);
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormState({ ...formState, [name]: inputValue });
    };

    const handleEditClick = (student: IStudent) => {
        setIsEditing(true);
        setFormState(student);
    };

    const handleDeleteClick = (student: IStudent) => {
        setDeleteConfirm(student);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const res = await window.api.deleteStudent(deleteConfirm.id);
            if (res[0]) {
                setStudents(students.filter(s => s.id !== deleteConfirm.id));
                setMessage({ text: res[1], type: 'success' });

                if (isEditing && formState.id === deleteConfirm.id) {
                    setIsEditing(false);
                    setFormState(initialFormState);
                }
            } else {
                setMessage({ text: res[1], type: 'error' });
            }
        } catch (error: any) {
            setMessage({ text: error.message || 'Ein Fehler ist aufgetreten', type: 'error' });
        }

        setDeleteConfirm(null);
    };

    const cancelDelete = () => {
        setDeleteConfirm(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormState(initialFormState);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.name) return;

        if (isEditing) {
            const updatedStudent = await window.api.updateStudent(formState);
            setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
            setMessage({ text: 'Erfolgreich aktualisiert', type: 'success' });
        } else {
            const newStudent = await window.api.addStudent(formState.name, formState.contact_info, formState.isMember, formState.isYouth || false);
            setStudents([...students, newStudent]);
            setMessage({ text: 'Erfolgreich hinzugefügt', type: 'success' });
        }

        handleCancelEdit();
    };

    return (
        <div className="manager-container">
            {message && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: message.type === 'error' ? '#dc3545' : '#28a745',
                    color: 'white',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1001,
                    maxWidth: '400px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{message.text}</span>
                        <button
                            onClick={() => setMessage(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '20px',
                                cursor: 'pointer',
                                marginLeft: '10px'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        maxWidth: '400px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Löschen bestätigen</h3>
                        <p>Möchten Sie <strong>{deleteConfirm.name}</strong> wirklich löschen?</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={cancelDelete}
                                style={{
                                    padding: '8px 16px',
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: '8px 16px',
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Löschen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="form-section">
                <h2>{isEditing ? 'Bearbeiten' : 'Hinzufügen'}</h2>
                <form onSubmit={handleSubmit}>
                    <input name="name" value={formState.name} onChange={handleInputChange} placeholder="Name" required/>
                    <textarea name="contact_info" value={formState.contact_info} onChange={handleInputChange}
                              placeholder="Kontaktinfo"/>

                    <div style={{display: 'flex', alignItems: 'center', margin: '10px 0'}}>
                        <input
                            type="checkbox"
                            name="isMember"
                            id="isMember_checkbox"
                            checked={formState.isMember}
                            onChange={handleInputChange}
                            style={{width: 'auto', marginRight: '10px'}}
                        />
                        <label htmlFor="isMember_checkbox" style={{marginBottom: 0}}>Ist Mitglied?</label>
                    </div>

                    <div style={{display: 'flex', alignItems: 'center', margin: '10px 0'}}>
                        <input
                            type="checkbox"
                            name="isYouth"
                            id="isYouth_checkbox"
                            checked={formState.isYouth || false}
                            onChange={handleInputChange}
                            style={{width: 'auto', marginRight: '10px'}}
                        />
                        <label htmlFor="isYouth_checkbox" style={{marginBottom: 0}}>Ist Jugendlich/Kind?</label>
                    </div>

                    <div style={{display: 'flex', gap: '10px'}}>
                        <button className="submit-btn" type="submit">
                            {isEditing ? 'Änderungen speichern' : 'Mitglied hinzufügen'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={handleCancelEdit} style={{background: '#6c757d'}}
                                    className="submit-btn">
                                Abbrechen
                            </button>
                        )}
                    </div>
                </form>
            </div>
            <div className="list-section">
                <h2>Mitgliederliste</h2>
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Kontaktinfo</th>
                        <th>Mitglied</th>
                        <th>Jugendlich/Kind</th>
                        <th>Aktionen</th>
                    </tr>
                    </thead>
                    <tbody>
                    {students.map(s => (
                        <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>{s.contact_info}</td>
                            <td>{s.isMember ? 'Ja' : 'Nein'}</td>
                            <td>{s.isYouth ? ' Ja' : 'Nein'}</td>
                            <td>
                                <button onClick={() => handleEditClick(s)} style={{padding: '5px 10px'}}
                                        className="submit-btn">
                                    Bearbeiten
                                </button>
                                <button onClick={() => handleDeleteClick(s)} style={{padding: '5px 10px'}}
                                        className="del-btn">
                                    &times;
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};