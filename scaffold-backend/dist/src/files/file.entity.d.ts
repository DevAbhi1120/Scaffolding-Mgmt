export declare class FileEntity {
    id: string;
    keys: string[];
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    uploadedBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
