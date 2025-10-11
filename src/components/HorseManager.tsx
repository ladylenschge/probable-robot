import React, { useState, useEffect } from 'react';
import { IHorse } from '../../electron/types';

// Define an initial state for a new/empty horse form
const initialFormState: IHorse = { id: 0, name: '', breed: '' };

export const HorseManager = () => {
    const [horses, setHorses] = useState<IHorse[]>([]);
    const [formState, setFormState] = useState<IHorse>(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        window.api.getHorses().then(setHorses);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormState({ ...formState, name: e.target.value });
    };

    const handleEditClick = (horse: IHorse) => {
        setIsEditing(true);
        setFormState(horse);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormState(initialFormState);
    };

    const handleDeleteClick = (horseId: number) => {
        setDeleteConfirm(horseId);
    };

    const confirmDelete = async () => {
        if (deleteConfirm === null) return;

        try {
            await window.api.deleteHorse(deleteConfirm);
            setHorses(horses.filter(h => h.id !== deleteConfirm));
            setDeleteConfirm(null);
            setError(null);

            // Reset form if we were editing the deleted horse
            if (isEditing && formState.id === deleteConfirm) {
                setIsEditing(false);
                setFormState(initialFormState);
            }
        } catch (error: any) {
            setError(error.message || 'Ein Fehler ist aufgetreten');
            setDeleteConfirm(null);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.name) return;

        if (isEditing) {
            const updatedHorse = await window.api.updateHorse(formState);
            setHorses(horses.map(h => h.id === updatedHorse.id ? updatedHorse : h));
        } else {
            const newHorse = await window.api.addHorse(formState.name, formState.breed);
            setHorses([...horses, newHorse]);
        }

        setIsEditing(false);
        setFormState(initialFormState);
    };

    return (
        <div className="manager-container">
            {/* Error Message */}
            {error && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: '#dc3545',
                    color: 'white',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1001,
                    maxWidth: '400px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
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

            {/* Delete Confirmation Modal */}
            {deleteConfirm !== null && (
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
                        <p>Möchten Sie dieses Pferd wirklich löschen?</p>
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
                <h2>{isEditing ? 'Bearbeiten Pferd' : 'Pferd hinzufügen'}</h2>
                <form onSubmit={handleSubmit}>
                    <label>Name</label>
                    <input
                        name="name"
                        value={formState.name}
                        onChange={handleInputChange}
                        placeholder="Name"
                        required
                        autoComplete="off"
                    />

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button className="submit-btn" type="submit">
                            {isEditing ? 'Änderungen speichern' : 'Hinzufügen'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                style={{ background: '#6c757d' }}
                                className="submit-btn"
                            >
                                Abbrechen
                            </button>
                        )}
                    </div>
                </form>
            </div>
            <div className="list-section">
                <h2>Alle Pferde</h2>
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th style={{width: '120px'}}>Aktionen</th>
                    </tr>
                    </thead>
                    <tbody>
                    {horses.map(h => (
                        <tr key={h.id}>
                            <td>{h.name}</td>
                            <td>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={() => handleEditClick(h)}
                                        style={{padding: '5px 10px'}}
                                        className="submit-btn"
                                    >
                                        Bearbeiten
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(h.id)}
                                        style={{
                                            padding: '5px 10px',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none'
                                        }}
                                        className="del-btn"
                                    >
                                        &times;

                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};