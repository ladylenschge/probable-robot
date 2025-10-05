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
            <h2>Student Progress Reports</h2>
            <p>Track student progress and print reports for completed 10-lesson milestones.</p>
            {reportInfo.length === 0 ? (
                <p>No students have completed any lessons yet.</p>
            ) : (
                <table className="report-table" style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                    <tr style={{textAlign: 'left', borderBottom: '2px solid #333'}}>
                        <th style={{padding: '8px'}}>Student Name</th>
                        <th style={{padding: '8px'}}>Progress to Next Report</th>
                        <th style={{padding: '8px'}}>Completed Reports</th>
                    </tr>
                    </thead>
                    <tbody>
                    {reportInfo.map(student => (
                        <tr key={student.student_id} style={{borderBottom: '1px solid #ddd'}}>
                            <td style={{padding: '8px'}}>
                                <strong>{student.student_name}</strong><br/>
                                <small>Total Lessons: {student.total_lessons}</small>
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
                                            Print Lessons {milestone - 9}-{milestone}
                                        </button>
                                    ))
                                ) : (
                                    <span style={{color: '#6c757d'}}>None yet</span>
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