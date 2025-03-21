let editorInstance;

function setupCkEditor() {
    const content = document.querySelector("meta[name='ckeditorLicenseKey']")?.content;
    if (content && typeof CKEDITOR !== 'undefined') {
        const {
            ClassicEditor,
            Essentials,
            Bold,
            Italic,
            Font,
            Paragraph
        } = CKEDITOR;
        
        ClassicEditor
            .create( document.querySelector( '.cke_editor' ), {
                licenseKey: content,
                plugins: [ Essentials, Bold, Italic, Font, Paragraph ],
                toolbar: [
                    'undo', 'redo', '|', 'bold', 'italic', '|',
                    'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor'
                ]
            }).then(editor => { 
                editorInstance = editor; 
            });
    }
}