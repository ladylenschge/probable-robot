export interface IStudent {
    id: number;
    name: string;
    contact_info: string;
    isMember: boolean;
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
    is_single_lesson: boolean;
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

export interface IStudentReportInfo {
    student_id: number;
    student_name: string;
    total_lessons: number;
    available_milestones: {
        milestone: number;
        is_printed: boolean;
    }[];
    progress_towards_next: number;
}

export interface ISchoolInfo {
    school_name: string;
    street_address: string;
    zip_code: string;
    phone_number: string;
    fax: string;
    bank_name: string;
    iban: string;
    blz: string;
    price_10_card_members: number | '';
    price_10_card_nonMembers:  number | '';
}
export interface IRiderGroup {
    id: number;
    name: string;
    description?: string;
    weekday: number;  // 0-6
    time: string;     // "HH:MM"
    created_at: string;
}

export interface IRiderGroupMember {
    group_id: number;
    student_id: number;
    student_name?: string;
}

export interface IGroupCancellation {
    id: number;
    group_id: number;
    student_id: number;
    date: string;
    created_at: string;
}