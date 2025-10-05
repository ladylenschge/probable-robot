import { contextBridge, ipcRenderer } from 'electron';
import { IStudent, IHorse, ILesson, IDailyScheduleSlot } from './types';

const api = {
    // Student methods
    getStudents: (): Promise<IStudent[]> => ipcRenderer.invoke('get-students'),
    addStudent: (name: string, contact: string): Promise<IStudent> => ipcRenderer.invoke('add-student', name, contact),

    // Horse methods
    getHorses: (): Promise<IHorse[]> => ipcRenderer.invoke('get-horses'),
    addHorse: (name: string, breed: string): Promise<IHorse> => ipcRenderer.invoke('add-horse', name, breed),

    // Lesson History methods
    getLessons: (): Promise<ILesson[]> => ipcRenderer.invoke('get-lessons'),
    addLesson: (lesson: Omit<ILesson, 'id' | 'student_name' | 'horse_name'>): Promise<ILesson> => ipcRenderer.invoke('add-lesson', lesson),

    // Daily Schedule methods
    getDailySchedule: (date: string): Promise<IDailyScheduleSlot[]> => ipcRenderer.invoke('get-daily-schedule', date),
    addScheduleSlot: (slot: Omit<IDailyScheduleSlot, 'id'>): Promise<IDailyScheduleSlot> => ipcRenderer.invoke('add-schedule-slot', slot),
    printDailySchedule: (date: string): Promise<void> => ipcRenderer.invoke('print-daily-schedule', date),
    getAvailableReports: () => ipcRenderer.invoke('get-available-reports'),
    printStudentReport: (studentId: number, milestone: number) => ipcRenderer.invoke('print-student-report', studentId, milestone),
};

contextBridge.exposeInMainWorld('api', api);