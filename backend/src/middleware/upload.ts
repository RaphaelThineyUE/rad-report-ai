import multer from 'multer';
import { env } from '../utils/env.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      callback(new Error('Only PDF uploads are allowed.'));
      return;
    }

    callback(null, true);
  },
});
