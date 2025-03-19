class Journal {
    constructor() {
        // 
    }

    create() {
        let form = document.querySelector(".journal-form");
        let btn = document.querySelector(".save-journal-btn");
        if (documentContains(btn)) {
            btn = cloneNodeElement(btn);
            btn.addEventListener('click', event => {
                event.preventDefault();
                btn.disabled = true;
                __append_html('Please Wait...', btn);

                if (!documentContains(form)) {
                    toast('error', 5000, 'Oops, an error occurred!');
                    return;
                }
                
                const data = new FormData(form); 

                $.ajax({
                    type: form.getAttribute('method'),
                    url: form.getAttribute('action'),
                    data: data,
                    dataType: 'json', 
                    contentType: false,
                    processData: false,
                    success: function (res) { 
                        btn.disabled = false;
                        __append_html('Save Journal', btn);
                        
                        if (res && res.message) {
                            toast(res.status, 8000, res.message);
                            recursiveClearForm(".journal-form", '.files-list');
                        }

                        if (res && res.redirectUrl) {
                            route(res.redirectUrl);
                        }
                    },
                    error: error => {
                        btn.disabled = false;
                        __append_html('Save Journal', btn);
                        try {
                            error = JSON.parse(error.responseText);
                        } catch (e) {
                            error = { message: "An error occurred." };
                        }

                        console.log(`Ajax Error: ${error.message || JSON.stringify(error)}`);
                        toast('error', 8000, error.message || 'An error occurred. Please try again!');
                    }
                });
            });
        }
    }

    getJournals() {
        const table = document.querySelector('.journals-table');
        if (documentContains(table)) {
            $(table).DataTable({
                destroy: true,
                processing: true,
                pageLength: 10,   
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const journalInstance = new Journal();
    journalInstance.create();
    journalInstance.getJournals();
    setupUploadDivSection(); 
    searchSelectInitializer();
});
