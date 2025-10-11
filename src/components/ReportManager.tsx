// src/components/ReportManager.tsx

import React, { useState, useEffect } from 'react';
import { IStudentReportInfo } from '../../electron/types';

export const ReportManager = () => {
    const [reportInfo, setReportInfo] = useState<IStudentReportInfo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = () => {
        setLoading(true);
        window.api.getAvailableReports().then(data => {
            setReportInfo(data);
            setLoading(false);
        });
    };

    useEffect(fetchReports, []);

    const handlePrint = async (studentId: number, milestone: number) => {
        await window.api.printStudentReport(studentId, milestone);
        // After printing, re-fetch the data to update the button's status
        fetchReports();
    };

    if (loading) {
        return <div>Loading reports...</div>;
    }

    return (
        <div className="report-container">
            <h2>10er Karten</h2>
            <p>Mitglieder Stundenfortschritt und drucken von 10er Karten.</p>
            {reportInfo.length === 0 ? (
                <p>Noch keine Karten vorhanden.</p>
            ) : (
                <table className="report-table" style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                    <tr style={{textAlign: 'left', borderBottom: '2px solid #333'}}>
                        <th style={{padding: '8px'}}>Name</th>
                        <th style={{padding: '8px'}}>Bis zur nächsten Karte</th>
                        <th style={{padding: '8px'}}>Karten</th>
                    </tr>
                    </thead>
                    <tbody>
                    {reportInfo.map(student => (
                        <tr key={student.student_id} style={{borderBottom: '1-px solid #ddd'}}>
                            <td style={{padding: '8px'}}>
                                <strong>{student.student_name}</strong><br/>
                                <small>Insgesamte Stunden: {student.total_lessons}</small>
                            </td>

                            <td style={{padding: '8px', verticalAlign: 'top'}}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2em' }}>
                                    {student.progress_towards_next} / 10
                                </div>
                            </td>

                            <td style={{padding: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center'}}>
                                {student.available_milestones.length > 0 ? (
                                    student.available_milestones.map(({ milestone, is_printed }) => (
                                        <button
                                            key={milestone}
                                            className="submit-btn"
                                            onClick={() => handlePrint(student.student_id, milestone)}
                                            style={{ background: is_printed ? '#6c757d' : '#007bff' }}
                                            title={is_printed ? 'Wurde bereits gedruckt. Nochmal drukcen?' : 'Drucken'}
                                        >
                                            {is_printed ? `Nachdrucken` : `Drucken`} Stunden {milestone - 9}-{milestone}
                                        </button>
                                    ))
                                ) : (
                                    <span style={{color: '#28a745', fontWeight: 'bold'}}>Alles erledigt!</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};