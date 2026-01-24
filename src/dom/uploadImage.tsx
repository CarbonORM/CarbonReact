// @link https://stackoverflow.com/questions/6735414/php-data-uri-to-file
// @link https://www.tutorialspoint.com/convert-image-to-data-uri-with-javascript
import {ChangeEvent, lazy} from "react";
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

export async function uploadImageChange(event: ChangeEvent<HTMLInputElement>,
                                        uploadCallback: (dataUriBase64: string) => void) {

    if (event.target.files === null || undefined === event.target?.files?.[0]) {

        toast.error('Please upload a valid image file type (jpg, jpeg, png, gif, heic).');

        return;

    }

    Object.keys(event.target.files).forEach((index) => {

        (async () => {
            let file = event.target.files?.[index];

            // loop through all files and create data url then post to postPost
            if (false === file.type.match('image.*')) {

                toast.error('Please upload a valid image file type (jpg, jpeg, png, gif, heic). (E_IMAGE_*<>' + file.type + ')');

                return;

            }

            // get file extension
            const fileExtension = file.name.split('.').pop();

            // check file extension is valid data uri
            if (fileExtension !== 'jpg'
                && fileExtension !== 'jpeg'
                && fileExtension !== 'heic'
                && fileExtension !== 'png'
                && fileExtension !== 'gif') {

                toast.error('Please upload a valid image file type (jpg, jpeg, png, gif, heic). (E_IMAGE_EXT)');

                return;

            }

            const isHeic = fileExtension === 'heic';

            if (isHeic) {

                // todo - this should be code split and lazy loaded, but doesn't work
                // look up code splitting, it could be an issue with rewired
                file = (await lazy(() => require("heic2any")))({
                    blob: file,
                    toType: "image/webp",
                    quality: 1.0, // 0.5 cuts the quality and size by half
                });

            }

            // @link https://github.com/palantir/tslint/issues/4653
            // @link https://github.com/Microsoft/TypeScript/issues/13376#issuecomment-273289748
            void toDataURL(URL.createObjectURL(file), 'image/webp', uploadCallback);

        })();

    });


}


// dataUriEncoded is the base64 encoded string which is posted in column post_content
export default function uploadImage(uploadCallback: (dataUriBase64: string) => void) {
    return () => {

        const input: HTMLInputElement = document.createElement('input')

        input.type = 'file'

        input.accept = 'image/*, .heic'

        input.style.display = 'none'

        // the element must be appended to the document to work on safari
        // @link https://stackoverflow.com/questions/47664777/javascript-file-input-onchange-not-working-ios-safari-only
        document.body.appendChild(input);

        // safari also requires addEventListener rather than .onChange
        input.addEventListener('change', (e) => {

            console.log('upload image event', e)

            void uploadImageChange(e as unknown as ChangeEvent<HTMLInputElement>, uploadCallback)

        })

        input.click()
    }
}







