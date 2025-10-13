// src/App.tsx
import React, { useState } from 'react';
import './App.css';
import { StudentManager } from './components/StudentManager';
import { HorseManager } from './components/HorseManager';
import { LessonManager } from './components/LessonManager';
import { DailyScheduleManager } from './components/DailyScheduleManager';
import {ReportManager} from "./components/ReportManager";
import {SchoolInfoManager} from "./components/SchoolInfoManager";
import {RiderGroupManager} from "./components/RiderGroupManager"; // 1. Import the new component

type Tab = 'lessons' | 'students' | 'horses' | 'schedule' | 'reports' | 'settings' | 'ridergroup'; // 2. Add 'schedule' to the Tab type

function App() {
    const [activeTab, setActiveTab] = useState<Tab>('schedule'); // Default to the new tab

    const renderContent = () => {
        switch (activeTab) {
            case 'settings': return <SchoolInfoManager />;
            case 'reports': return <ReportManager />; // 3. Add case
            case 'schedule': return <DailyScheduleManager />; // 3. Add the case for the new component
            case 'students': return <StudentManager />;
            case 'horses': return <HorseManager />;
            case 'ridergroup': return <RiderGroupManager />;
            default:
                return <DailyScheduleManager />;
        }
    };

    return (
        <div className="app-container">
            <h1>Reitstunden Manager</h1>
            <nav>
                <button onClick={() => setActiveTab('schedule')} className={activeTab === 'schedule' ? 'active' : ''}>tägliche Reitstunden</button>
                <button onClick={() => setActiveTab('students')} className={activeTab === 'students' ? 'active' : ''}>Mitglieder</button>
                <button onClick={() => setActiveTab('horses')} className={activeTab === 'horses' ? 'active' : ''}>Pferde</button>
                <button onClick={() => setActiveTab('reports')} className={activeTab === 'reports' ? 'active' : ''}>10er Karten</button>
                <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}>Einstellungen</button>
                <button onClick={() => setActiveTab('ridergroup')} className={activeTab === 'ridergroup' ? 'active' : ''}>Reitergruppen</button>
            </nav>
            <main>
                {renderContent()}
            </main>
        </div>
    );
}

export default App;