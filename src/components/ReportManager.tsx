// src/components/ReportManager.tsx

import React, { useState, useEffect } from 'react';
import { IStudentReportInfo } from '../../electron/types';

export const ReportManager = () => {
    const [reportInfo, setReportInfo] = useState<IStudentReportInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.api.getAvailableReports().then(data => {
            setReportInfo(data);
            setLoading(false);
        });
    }, []);

    const handlePrint = (studentId: number, milestone: number) => {
        window.api.printStudentReport(studentId, milestone);
    };

    if (loading) {
        return <div>Loading reports...</div>;
    }

    return (
        <div className="report-container">
            <h2>10er Karten</h2>
            <p>Mitglieder Stundenfortschritt und drucken von 10er Karten.</p>
            {reportInfo.length === 0 ? (
                <p>Noch keine 10erKarten vorhanden.</p>
            ) : (
                <table className="report-table" style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                    <tr style={{textAlign: 'left', borderBottom: '2px solid #333'}}>
                        <th style={{padding: '8px'}}>Name</th>
                        <th style={{padding: '8px'}}>bis zur nächsten Karte</th>
                        <th style={{padding: '8px'}}>Karten</th>
                    </tr>
                    </thead>
                    <tbody>
                    {reportInfo.map(student => (
                        <tr key={student.student_id} style={{borderBottom: '1px solid #ddd'}}>
                            <td style={{padding: '8px'}}>
                                <strong>{student.student_name}</strong><br/>
                                <small>Insgesamte Stunden: {student.total_lessons}</small>
                            </td>

                            {/* --- NEW PROGRESS DISPLAY --- */}
                            <td style={{padding: '8px', verticalAlign: 'top'}}>
                                <div style={{
                                    fontWeight: 'bold',
                                    fontSize: '1.2em',
                                    color: student.progress_towards_next === 0 && student.total_lessons >= 10 ? '#28a745' : '#333'
                                }}>
                                    {student.progress_towards_next} / 10
                                </div>
                            </td>

                            <td style={{padding: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                {student.available_milestones.length > 0 ? (
                                    student.available_milestones.map(milestone => (
                                        <button
                                            key={milestone}
                                            className="submit-btn"
                                            onClick={() => handlePrint(student.student_id, milestone)}
                                        >
                                            Karte drucken {milestone - 9}-{milestone}
                                        </button>
                                    ))
                                ) : (
                                    <span style={{color: '#6c757d'}}>Keine vorhanden</span>
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