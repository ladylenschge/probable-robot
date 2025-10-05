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
    MO,
    DI,
    MI,
    DO,
    FR,
    SA,
    SO
}

export interface IStudentReportInfo {
    student_id: number;
    student_name: string;
    total_lessons: number;
    // Milestones the student has already completed
    available_milestones: number[];
    // How many lessons they have completed towards the NEXT milestone
    progress_towards_next: number;
}

export interface ISchoolInfo {
    school_name: string;
    street_address: string;
    zip_code: string;
    bank_name: string;
    iban: string;
    blz: string;
}