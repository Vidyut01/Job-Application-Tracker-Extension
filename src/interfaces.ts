export type JobStatus = 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Casual';

export interface Job {
    title: string
    company: string
    location: string
    link: string
    status: JobStatus
    description: string
    employmentType: EmploymentType
    extraDetails: string
};
