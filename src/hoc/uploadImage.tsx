// @link https://stackoverflow.com/questions/6735414/php-data-uri-to-file
// @link https://www.tutorialspoint.com/convert-image-to-data-uri-with-javascript
import {ChangeEvent} from "react";
import {toast} from "react-toastify";


export async function toDataURL(src: string, fileType: string, callback: (dataUriEncoded: string) => void): Promise<void> {

    const image = new Image();

    image.crossOrigin = 'Anonymous';

    image.onload = function () {

        const canvas = document.createElement('canvas');

        const context = canvas.getContext('2d');

        canvas.height = image.naturalHeight;

        canvas.width = image.naturalWidth;

        if (context === null) {

            toast.error('Unable to upload image. Please try another image or bowser. If issues persist, please contact support.');

            return;

        }

        context?.drawImage(image, 0, 0);

        const dataURL = canvas.toDataURL(fileType); // 'image/jpeg'

        callback(dataURL);

    };

    image.src = src;

}

export function uploadImageChange(event: ChangeEvent<HTMLInputElement>,
uploadCallback: ((imageDataUri: string) => void)) {

    if (event.target.files !== null && event.target.files[0]) {

        Object.keys(event.target.files).forEach((index) => {

            const file = event.target.files?.[index];

            // loop through all files and create data url then post to postPost
            if (file.type.match('image.*')) {

                // get file extension
                const fileExtension = file.name.split('.').pop();

                // check file extension is valid data uri
                if (fileExtension !== 'jpg' && fileExtension !== 'jpeg' && fileExtension !== 'png' && fileExtension !== 'gif') {

                    toast.error('Please upload a valid image file type (jpg, jpeg, png, gif).');

                    return;

                }


                // @link https://github.com/palantir/tslint/issues/4653
                // @link https://github.com/Microsoft/TypeScript/issues/13376#issuecomment-273289748
                void toDataURL(URL.createObjectURL(file), file.type, uploadCallback);

            }

        });

    }

}


// dataUriEncoded is the base64 encoded string which is posted in column post_content
export default function uploadImage(uploadCallback: (dataUriBase64: string) => void) {
    return () => {
        const input: HTMLInputElement = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e: Event): any => {
            uploadImageChange(e as unknown as ChangeEvent<HTMLInputElement>, uploadCallback)
        }
        input.click()
    }
}







