// @link https://stackoverflow.com/questions/6735414/php-data-uri-to-file
// @link https://www.tutorialspoint.com/convert-image-to-data-uri-with-javascript
import {ChangeEvent} from "react";
import {toast} from "react-toastify";
import postPosts from "api/rest/postPosts";
import DigApi from "DigApi";


// quite possibly one of the sexiest files we have

export interface iUploadCompImage {
    comp_id: number,
    team_id?: number,
    scorebox?: number
}

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

export function uploadImageChange(post_excerpt: string, event: ChangeEvent<HTMLInputElement>,
prePost?: (postData : any) => any,
uploadCallback: ((ID: number, dataUriBase64: string) => void) | undefined = undefined) {

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
                void toDataURL(URL.createObjectURL(file), file.type, (dataUriEncoded => {
                    let postData = {
                        guid: '',
                        post_author: CarbonORM.instance.state.id,
                        post_content: dataUriEncoded,
                        post_content_filtered: '',
                        post_excerpt: post_excerpt,
                        post_title: 'Original file name: (' + file.name + ') type: (' + file.type + ') and size: (' + file.size + ') bytes',
                        post_status: 'inherit',
                        comment_status: 'open',
                        ping_status: 'open',
                        to_ping: '',
                        pinged: '',
                        post_name: file.name,
                        post_parent: 0,
                        post_type: 'attachment',
                        post_mime_type: file.type, // we convert to jpeg using canvas.toDataURL
                        success: "Image uploaded successfully!",
                        uploadCallback: uploadCallback
                    };

                    if (undefined !== prePost && 'function' === typeof prePost) {

                        postData = prePost(postData)

                    }

                    postPosts(postData);

                }));

            }

        });

    }

}


// dataUriEncoded is the base64 encoded string which is posted in column post_content
export default function uploadImage(post_excerpt: string, prePost?: (postData : any) => any,
                uploadCallback: ((ID: number, dataUriBase64: string) => void) | undefined = undefined) {
    return () => {
        const input: HTMLInputElement = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e: Event): any => {
            uploadImageChange(post_excerpt, e as unknown as ChangeEvent<HTMLInputElement>, prePost, uploadCallback)
        }
        input.click()
    }
}

export function uploadCompImage(post_excerpt: string, comp_data: iUploadCompImage,
                uploadCallback: ((ID: number, dataUriBase64: string) => void) | undefined = undefined) {

    return uploadImage(post_excerpt, (postData) => {
        if (comp_data !== undefined) {
            // comp id is required, so it will always be here
            postData['comp_id'] = comp_data.comp_id;

            if (comp_data.team_id !== undefined && comp_data.scorebox !== undefined) {
                postData['team_id'] = comp_data.team_id;
                postData['scorebox'] = comp_data.scorebox;
            }
        }

        return postData;
    }, uploadCallback)


}



