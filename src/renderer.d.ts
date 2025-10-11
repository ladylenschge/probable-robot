import {IStudent, IHorse, ILesson, IStudentReportInfo, IDailyScheduleSlot, ISchoolInfo} from '../electron/types';

export interface IElectronAPI {
    // Student methods
    getStudents: () => Promise<IStudent[]>;
    addStudent: (name: string, contact: string, isMember: boolean) => Promise<IStudent>;
    updateStudent: (student: IStudent) => Promise<IStudent>;
    deleteStudent: (studentId: IStudent["id"]) => Promise<[boolean,string]>;
    // Horse methods
    getHorses: () => Promise<IHorse[]>;
    addHorse: (name: string, breed: string) => Promise<IHorse>;
    // Lesson methods
    getLessons: () => Promise<ILesson[]>;
    addLesson: (lesson: Omit<ILesson, 'id' | 'student_name' | 'horse_name' | 'singleLesson'>) => Promise<ILesson>;
    // Daily Schedule methods
    getDailySchedule: (date: string) => Promise<IDailyScheduleSlot[]>;
    addScheduleSlot: (slot: Omit<IDailyScheduleSlot, 'id'>,  is_single_lesson: boolean) => Promise<IDailyScheduleSlot>;
    deleteScheduleSlot: (id: number) => Promise<void>;
    deleteScheduleParticipant: (scheduleId: number, studentId: number) => Promise<void>;
    updateScheduleSlot: (slot: IDailyScheduleSlot) => Promise<IDailyScheduleSlot>;

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