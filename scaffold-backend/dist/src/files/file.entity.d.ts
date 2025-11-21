export declare class FileEntity {
    id: string;
    key: string;
    filename: string;
    originalName?: string | null;
    mimeType?: string | null;
    size?: number | null;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    uploadedBy?: string | null;
    createdAt: Date;
}
