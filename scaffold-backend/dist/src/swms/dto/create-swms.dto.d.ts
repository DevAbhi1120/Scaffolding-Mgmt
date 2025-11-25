declare class TaskDto {
    name: string;
    highRisk?: boolean;
}
export declare class CreateSwmsDto {
    orderId?: string;
    submittedBy?: string;
    formData: any;
    tasks: TaskDto[];
    attachments?: string[];
}
export {};
