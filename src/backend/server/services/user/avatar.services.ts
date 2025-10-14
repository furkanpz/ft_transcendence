import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { MultipartFile } from '@fastify/multipart';

const UPLOAD_DIR = path.join(__dirname, '../../../../../uploads/avatars');
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const AVATAR_SIZE = 300;

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created upload directory: ${UPLOAD_DIR}`);
}

export interface AvatarUploadResult {
    success: boolean;
    filename?: string;
    url?: string;
    message?: string;
}

function validateFile(file: MultipartFile): { valid: boolean; error?: string } {
    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return { 
            valid: false, 
            error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}` 
        };
    }

    return { valid: true };
}

function generateFilename(userId: number, originalFilename: string): string {
    const timestamp = Date.now();
    const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
    return `user_${userId}_${timestamp}${ext}`;
}

export async function deleteOldAvatar(oldAvatarUrl: string | undefined): Promise<void> {
    if (!oldAvatarUrl || oldAvatarUrl.startsWith('http')) {
        return;
    }

    try {
        const filename = path.basename(oldAvatarUrl);
        const filePath = path.join(UPLOAD_DIR, filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted old avatar: ${filename}`);
        }
    } catch (error) {
        console.error('Error deleting old avatar:', error);
    }
}

export async function uploadAvatar(
    file: MultipartFile, 
    userId: number
): Promise<AvatarUploadResult> {
    try {
        const validation = validateFile(file);
        if (!validation.valid) {
            return { success: false, message: validation.error };
        }
        const filename = generateFilename(userId, file.filename);
        const filepath = path.join(UPLOAD_DIR, filename);
        const buffer = await file.toBuffer();
        await sharp(buffer)
            .resize(AVATAR_SIZE, AVATAR_SIZE, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 90 })
            .toFile(filepath);
        const url = `/uploads/avatars/${filename}`;
        
        return {
            success: true,
            filename,
            url
        };
    } catch (error: any) {
        console.error('Avatar upload error:', error);
        return {
            success: false,
            message: error.message || 'Failed to upload avatar'
        };
    }
}


export function getAvatarUrl(avatarFilename: string | undefined): string {
    if (!avatarFilename || avatarFilename.startsWith('http')) {
        return avatarFilename || 'https://placehold.co/300x300/cccccc/000000?text=Avatar';
    }
    return `/uploads/avatars/${avatarFilename}`;
}
