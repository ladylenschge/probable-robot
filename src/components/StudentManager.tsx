// src/components/StudentManager.tsx

import React, { useState, useEffect } from 'react';
import { IStudent } from '../../electron/types';

// Define an initial state for a new/empty student form
const initialFormState: IStudent = { id: 0, name: '', contact_info: '', isMember: false };

export const StudentManager = () => {
    const [students, setStudents] = useState<IStudent[]>([]);

    const [formState, setFormState] = useState<IStudent>(initialFormState);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        window.api.getStudents().then(setStudents);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormState({ ...formState, [name]: inputValue });
    };

    const handleEditClick = (student: IStudent) => {
        setIsEditing(true);
        setFormState(student);
    };


    const handleDeleteClick = async (student: IStudent) => {
        await window.api.deleteStudent(student.id);
        setStudents(students.filter(s => s.id !== student.id));
    };


    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormState(initialFormState); // Reset the form to its empty state
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.name) return; // Basic validation

        if (isEditing) {
            // If we are editing, call the update function
            const updatedStudent = await window.api.updateStudent(formState);
            // Find the student in the list and replace it with the updated version
            setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
        } else {
            // Otherwise, call the add function for a new student
            const newStudent = await window.api.addStudent(formState.name, formState.contact_info, formState.isMember);
            setStudents([...students, newStudent]);
        }

        // Reset the form after submission
        handleCancelEdit();
    };

    return (
        <div className="manager-container">
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
                        <th>Aktionen</th>
                    </tr>
                    </thead>
                    <tbody>
                    {students.map(s => (
                        <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>{s.contact_info}</td>
                            <td>{s.isMember ? 'Ja' : 'Nein'}</td>
                            <td>
                                <button onClick={() => handleEditClick(s)} style={{padding: '5px 10px'}}
                                        className="submit-btn">
                                    Bearbeiten
                                </button>
                                <button onClick={() => handleDeleteClick(s)} style={{padding: '5px 5px'}}
                                        className="del-btn">
                                    X
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