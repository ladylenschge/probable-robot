import React, { useState, useEffect } from 'react';
import { IHorse } from '../../electron/types';

export const HorseManager = () => {
    const [horses, setHorses] = useState<IHorse[]>([]);
    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');

    useEffect(() => { window.api.getHorses().then(setHorses); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newHorse = await window.api.addHorse(name, breed);
        setHorses([...horses, newHorse]);
        setName(''); setBreed('');
    };

    return (
        <div className="manager-container">
            <div className="form-section">
                <h2>Pferd hinzufügen</h2>
                <form onSubmit={handleSubmit}>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
                    <input value={breed} onChange={e => setBreed(e.target.value)} placeholder="Breed" />
                    <button className="submit-btn" type="submit">Add Horse</button>
                </form>
            </div>
            <div className="list-section">
                <h2>Alle Pferde</h2>
                <table>
                    <thead><tr><th>ID</th><th>Name</th><th>Breed</th></tr></thead>
                    <tbody>
                    {horses.map(h => <tr key={h.id}><td>{h.id}</td><td>{h.name}</td><td>{h.breed}</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};