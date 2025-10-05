export interface IStudent {
    id: number;
    name: string;
    contact_info: string;
}

export interface IHorse {
    id: number;
    name: string;
    breed: string;
}

export interface ILesson {
    id: number;
    student_id: number;
    horse_id: number;
    date: string;
    notes: string;
    // These fields are for display, joined from other tables
    student_name?: string;
    horse_name?: string;
}

export interface IDailyScheduleSlot {
    id: number;
    date: string;
    time: string;
    participants: {
        student_id: number;
        student_name: string;
        horse_id: number;
        horse_name: string;
    }[];
}

export enum LessonDays {
    Montag,
    Dienstag,
    Mittwoch,
    Donnerstag,
    Freitag,
    Samstag,
    Sonntag
}