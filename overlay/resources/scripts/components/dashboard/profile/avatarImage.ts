import { vt } from '@/locales/translate';

export const resizeImage = (file: File, size = 320): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(vt("Impossible de lire cette image.")));
        reader.onload = () => {
            const image = new Image();
            image.onerror = () => reject(new Error(vt("Format d’image non pris en charge.")));
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const sourceSize = Math.min(image.width, image.height);
                canvas.width = size;
                canvas.height = size;
                const context = canvas.getContext('2d');
                if (!context) return reject(new Error(vt("Impossible de préparer cette image.")));
                context.drawImage(
                    image,
                    (image.width - sourceSize) / 2,
                    (image.height - sourceSize) / 2,
                    sourceSize,
                    sourceSize,
                    0,
                    0,
                    size,
                    size
                );
                resolve(canvas.toDataURL('image/jpeg', 0.86));
            };
            image.src = String(reader.result);
        };
        reader.readAsDataURL(file);
    });
