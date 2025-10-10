import { contextBridge, ipcRenderer } from 'electron';
import { IStudent, IHorse, ILesson, IDailyScheduleSlot } from './types';

const api = {
    // Student methods
    getStudents: (): Promise<IStudent[]> => ipcRenderer.invoke('get-students'),
    addStudent: (name: string, contact: string, isMember: boolean): Promise<IStudent> => ipcRenderer.invoke('add-student', name, contact, isMember),
    updateStudent: (student: IStudent): Promise<IStudent> => ipcRenderer.invoke('update-student', student),
    deleteStudent: (studentId: IStudent["id"]): Promise<String> => ipcRenderer.invoke('delete-student', studentId),


    // Horse methods
    getHorses: (): Promise<IHorse[]> => ipcRenderer.invoke('get-horses'),
    addHorse: (name: string, breed: string): Promise<IHorse> => ipcRenderer.invoke('add-horse', name, breed),

    // Lesson History methods
    getLessons: (): Promise<ILesson[]> => ipcRenderer.invoke('get-lessons'),
    addLesson: (lesson: Omit<ILesson, 'id' | 'student_name' | 'horse_name' | 'singleLesson'>): Promise<ILesson> => ipcRenderer.invoke('add-lesson', lesson),

    // Daily Schedule methods
    getDailySchedule: (date: string): Promise<IDailyScheduleSlot[]> => ipcRenderer.invoke('get-daily-schedule', date),
    addScheduleSlot: (slot: Omit<IDailyScheduleSlot, 'id'>,  is_single_lesson: boolean): Promise<IDailyScheduleSlot> => ipcRenderer.invoke('add-schedule-slot', slot,  is_single_lesson),
    deleteScheduleSlot: (scheduleId: number): Promise<void> => ipcRenderer.invoke('delete-schedule-slot', scheduleId),
    deleteScheduleParticipant: (scheduleId: number, studentId: number): Promise<void> => ipcRenderer.invoke('delete-schedule-participant', scheduleId, studentId),
    updateScheduleSlot: (slot: IDailyScheduleSlot) => Promise<IDailyScheduleSlot>,

    printDailySchedule: (date: string): Promise<void> => ipcRenderer.invoke('print-daily-schedule', date),

    getAvailableReports: () => ipcRenderer.invoke('get-available-reports'),
    printStudentReport: (studentId: number, milestone: number) => ipcRenderer.invoke('print-student-report', studentId, milestone),

    // School Info
    getSchoolInfo: () => ipcRenderer.invoke('get-school-info'),
    updateSchoolInfo: (info: string) => ipcRenderer.invoke('update-school-info', info),
};

contextBridge.exposeInMainWorld('api', api);