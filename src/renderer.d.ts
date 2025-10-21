import {
    IStudent,
    IHorse,
    ILesson,
    IStudentReportInfo,
    IDailyScheduleSlot,
    ISchoolInfo,
    IRiderGroupMember,
    IRiderGroup
} from '../electron/types';

export interface IElectronAPI {
    // Student methods
    getStudents: () => Promise<IStudent[]>;
    addStudent: (name: string, contact: string, isMember: boolean) => Promise<IStudent>;
    updateStudent: (student: IStudent) => Promise<IStudent>;
    deleteStudent: (studentId: IStudent["id"]) => Promise<[boolean,string]>;

    // Horse methods
    getHorses: () => Promise<IHorse[]>;
    addHorse: (name: string, breed: string) => Promise<IHorse>;
    updateHorse: (horse: IHorse) => Promise<IHorse>;
    deleteHorse: (horseId: number) => Promise<void>;

    // Lesson methods
    getLessons: () => Promise<ILesson[]>;
    addLesson: (lesson: Omit<ILesson, 'id' | 'student_name' | 'horse_name' | 'singleLesson'>) => Promise<ILesson>;

    // Daily Schedule methods - MIT MONATSKARTEN PRO REITER
    getDailySchedule: (date: string) => Promise<IDailyScheduleSlot[]>;
    addScheduleSlot: (slot: Omit<IDailyScheduleSlot, 'id'>, is_single_lesson: boolean) => Promise<IDailyScheduleSlot>;
    deleteScheduleSlot: (id: number) => Promise<void>;
    deleteScheduleParticipant: (scheduleId: number, studentId: number) => Promise<void>;
    updateScheduleSlot: (slot: IDailyScheduleSlot) => Promise<IDailyScheduleSlot>;

    // Rider Groups methods
    getRiderGroups: () => Promise<IRiderGroup[]>;
    addRiderGroup: (name: string, description: string, weekday: number, time: string) => Promise<IRiderGroup>;
    updateRiderGroup: (group: IRiderGroup) => Promise<IRiderGroup>;
    getGroupMembers: (groupId: number) => Promise<IRiderGroupMember[]>;
    saveGroupMembers: (groupId: number, studentIds: number[]) => Promise<boolean>;
    deleteRiderGroup: (groupId: number) => Promise<boolean>;

    // Absagen verwalten
    getCancellationsForDate: (groupId: number, date: string) => Promise<number[]>;
    toggleCancellation: (groupId: number, studentId: number, date: string) => Promise<boolean>;

    // Gruppe für Datum laden
    getGroupsForDate: (date: string) => Promise<IRiderGroup[]>;
    loadGroupForSchedule: (groupId: number, date: string) => Promise<{students: IRiderGroupMember[], cancellations: number[]}>;

    printMonthlyGroups: (year: number, month: number) => Promise<{success: boolean, path?: string, error?: string}>;

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