// src/App.tsx
import React, { useState } from 'react';
import './App.css';
import { StudentManager } from './components/StudentManager';
import { HorseManager } from './components/HorseManager';
import { LessonManager } from './components/LessonManager';
import { DailyScheduleManager } from './components/DailyScheduleManager';
import {ReportManager} from "./components/ReportManager"; // 1. Import the new component

type Tab = 'lessons' | 'students' | 'horses' | 'schedule' | 'reports'; // 2. Add 'schedule' to the Tab type

function App() {
    const [activeTab, setActiveTab] = useState<Tab>('schedule'); // Default to the new tab

    const renderContent = () => {
        switch (activeTab) {
            case 'reports': return <ReportManager />; // 3. Add case
            case 'schedule': return <DailyScheduleManager />; // 3. Add the case for the new component
            case 'students': return <StudentManager />;
            case 'horses': return <HorseManager />;
            case 'lessons':
            default:
                return <LessonManager />;
        }
    };

    return (
        <div className="app-container">
            <h1>Reitstunden Manager</h1>
            <nav>
                <button onClick={() => setActiveTab('schedule')} className={activeTab === 'schedule' ? 'active' : ''}>tägliche Reitstunden</button>
                <button onClick={() => setActiveTab('lessons')} className={activeTab === 'lessons' ? 'active' : ''}>Stunden History</button>
                <button onClick={() => setActiveTab('students')} className={activeTab === 'students' ? 'active' : ''}>Mitglieder</button>
                <button onClick={() => setActiveTab('horses')} className={activeTab === 'horses' ? 'active' : ''}>Pferde</button>
                <button onClick={() => setActiveTab('reports')} className={activeTab === 'reports' ? 'active' : ''}>10er Karten</button>
            </nav>
            <main>
                {renderContent()}
            </main>
        </div>
    );
}

export default App;