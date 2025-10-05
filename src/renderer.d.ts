import {IStudent, IHorse, ILesson, IStudentReportInfo, IDailyScheduleSlot} from '../electron/types';

export interface IElectronAPI {
    // Student methods
    getStudents: () => Promise<IStudent[]>;
    addStudent: (name: string, contact: string) => Promise<IStudent>;
    // Horse methods
    getHorses: () => Promise<IHorse[]>;
    addHorse: (name: string, breed: string) => Promise<IHorse>;
    // Lesson methods
    getLessons: () => Promise<ILesson[]>;
    addLesson: (lesson: Omit<ILesson, 'id' | 'student_name' | 'horse_name'>) => Promise<ILesson>;
    // Daily Schedule methods
    getDailySchedule: (date: string) => Promise<IDailyScheduleSlot[]>;
    addScheduleSlot: (slot: Omit<IDailyScheduleSlot, 'id'>) => Promise<IDailyScheduleSlot>;
    printDailySchedule: (date: string) => Promise<void>;
    // 10 Cards
    getAvailableReports: () => Promise<IStudentReportInfo[]>;
    printStudentReport: (studentId: number, milestone: number) => Promise<void>
    // School Info
    getSchoolInfo: () => Promise<ISchoolInfo | null>;
    updateSchoolInfo: (info: ISchoolInfo) => Promise<void>;

}

declare module 'react';
declare global {
    interface Window {
        api: IElectronAPI;
    }
}