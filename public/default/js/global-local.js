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

function createCanvas(containerElem, canvasSelectorAttributes = {}, selector = 'id') {  
    containerElem = containerElem instanceof HTMLElement ? containerElem : document.querySelector(containerElem);
    if (!containerElem) return null;
    
    while (containerElem.firstChild) {
        containerElem.removeChild(containerElem.firstChild);
    }
    
    const canvas = document.createElement("canvas");
    
    for (const [key, value] of Object.entries(canvasSelectorAttributes)) {
        canvas.setAttribute(key, value); 
    }

    containerElem.appendChild(canvas);

    if (!(selector in canvasSelectorAttributes)) return null;

    let attributeValue = canvasSelectorAttributes[selector];
    let canvasElement = document.querySelector(`[${selector}="${attributeValue}"]`); 
    
    return canvasElement ? canvasElement.getContext("2d") : canvasElement;  
}
