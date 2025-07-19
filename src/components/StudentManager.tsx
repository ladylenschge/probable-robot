import React, { useState, useEffect } from 'react';
import { IStudent } from '../../electron/types';

export const StudentManager = () => { // Ensure 'export' is here
    const [students, setStudents] = useState<IStudent[]>([]);
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');

    useEffect(() => {
        window.api.getStudents().then(setStudents);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newStudent = await window.api.addStudent(name, contact);
        setStudents([...students, newStudent]);
        setName('');
        setContact('');
    };

    return (
        <div className="manager-container">
            <div className="form-section">
                <h2>Add Student</h2>
                <form onSubmit={handleSubmit}>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
                    <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Contact Info" />
                    <button className="submit-btn" type="submit">Add Student</button>
                </form>
            </div>
            <div className="list-section">
                <h2>Student List</h2>
                <table>
                    <thead><tr><th>ID</th><th>Name</th><th>Contact</th></tr></thead>
                    <tbody>
                    {students.map(s => <tr key={s.id}><td>{s.id}</td><td>{s.name}</td><td>{s.contact_info}</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};