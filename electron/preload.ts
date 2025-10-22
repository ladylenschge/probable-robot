import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    // Student methods
    getStudents: () => ipcRenderer.invoke('get-students'),
    addStudent: (name: string, contact: string, isMember: boolean, isYouth: boolean) =>
        ipcRenderer.invoke('add-student', name, contact, isMember, isYouth),
    updateStudent: (student: any) => ipcRenderer.invoke('update-student', student),
    deleteStudent: (studentId: number) => ipcRenderer.invoke('delete-student', studentId),

    // Horse methods
    getHorses: () => ipcRenderer.invoke('get-horses'),
    addHorse: (name: string, breed: string) => ipcRenderer.invoke('add-horse', name, breed),
    updateHorse: (horse: any) => ipcRenderer.invoke('update-horse', horse),
    deleteHorse: (horseId: number) => ipcRenderer.invoke('delete-horse', horseId),

    // Lesson methods
    getLessons: () => ipcRenderer.invoke('get-lessons'),
    addLesson: (lesson: any) => ipcRenderer.invoke('add-lesson', lesson),

    // Daily Schedule methods - MIT MONATSKARTEN PRO REITER
    getDailySchedule: (date: string) => ipcRenderer.invoke('get-daily-schedule', date),
    addScheduleSlot: (slot: any, isSingleLesson: boolean) =>
        ipcRenderer.invoke('add-schedule-slot', slot, isSingleLesson),
    deleteScheduleSlot: (id: number) => ipcRenderer.invoke('delete-schedule-slot', id),
    deleteScheduleParticipant: (scheduleId: number, studentId: number) =>
        ipcRenderer.invoke('delete-schedule-participant', scheduleId, studentId),
    updateScheduleSlot: (slot: any) =>
        ipcRenderer.invoke('update-schedule-slot', slot),
    printDailySchedule: (date: string) => ipcRenderer.invoke('print-daily-schedule', date),

    // Rider Groups methods
    getRiderGroups: () => ipcRenderer.invoke('get-rider-groups'),
    addRiderGroup: (name: string, description: string, weekday: number, time: string) =>
        ipcRenderer.invoke('add-rider-group', name, description, weekday, time),
    updateRiderGroup: (group: any) => ipcRenderer.invoke('update-rider-group', group),
    getGroupMembers: (groupId: number) => ipcRenderer.invoke('get-group-members', groupId),
    saveGroupMembers: (groupId: number, studentIds: number[]) =>
        ipcRenderer.invoke('save-group-members', groupId, studentIds),
    deleteRiderGroup: (groupId: number) => ipcRenderer.invoke('delete-rider-group', groupId),

    // Cancellations
    getCancellationsForDate: (groupId: number, date: string) =>
        ipcRenderer.invoke('get-cancellations-for-date', groupId, date),
    toggleCancellation: (groupId: number, studentId: number, date: string) =>
        ipcRenderer.invoke('toggle-cancellation', groupId, studentId, date),

    // Groups for date
    getGroupsForDate: (date: string) => ipcRenderer.invoke('get-groups-for-date', date),
    loadGroupForSchedule: (groupId: number, date: string) =>
        ipcRenderer.invoke('load-group-for-schedule', groupId, date),
    printMonthlyGroups: (year: number, month: number) =>
        ipcRenderer.invoke('print-monthly-groups', year, month),

    // 10 Cards
    getAvailableReports: () => ipcRenderer.invoke('get-available-reports'),
    printStudentReport: (studentId: number, milestone: number) =>
        ipcRenderer.invoke('print-student-report', studentId, milestone),

    // School Info
    getSchoolInfo: () => ipcRenderer.invoke('get-school-info'),
    updateSchoolInfo: (info: any) => ipcRenderer.invoke('update-school-info', info),
});