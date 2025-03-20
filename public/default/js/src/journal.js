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
            const dataTable = $(table).DataTable({
                destroy: true,
                processing: true,
                pageLength: 10, 
                borders: true,
                ajax: {
                    type: 'GET',
                    url: '/journal/list?type=dt',
                    dataSrc: (res) => { 
                        return res.data || [];
                    },
                    else: (error) => {
                        error = JSON.parse(error.responseText) || error;
                        console.log(`Ajax Error: ${error.message || JSON.parse(error.responseText) || JSON.stringify(error)}`);
                        toast('error', 8000, error.message || 'An error occurred. Please try again!');
                    }
                },
                columns: [
                    {data: 'action'},
                    {data: 'title'},
                    {data: 'category'},
                    {data: 'description_closed'}, 
                    {data: 'created_at'}, 
                ],
                fnDrawCallback: () => {
                    (new Journal()).actionOnJournalsResource();
                    
                    $('.journals-table tbody').off('click', 'tr').on('click', 'tr', function (event) {
                        if ($(event.target).is('button, a, input, select')) return;
                        let data = dataTable.row(this).data();
                        if (data) {
                            onParseActionModal(event, `/journal/preview?id=${data.id}`, 'get', 
                                [{callback: (new Journal()).journalPreview, params: [event, data.id]}, 
                                    {callback: (new Auth()).login, params: []}], 
                                'data-modal', '.preview-journal-modal'
                            );
                        }
                    });
                }  
            });
        }
    }

    actionOnJournalsResource() {
        const resourceBtns = document.querySelectorAll('.journal-resource');

        resourceBtns.forEach(btn => {
            if (documentContains(btn)) {
                btn = cloneNodeElement(btn);
                btn.addEventListener('click', event => {
                    event.preventDefault();
                    const target_id = event.target.getAttribute('data-id');
                    if (event.target.classList.contains('edit-journal-btn')) {
                        route(`/journal/edit?journal=${target_id}`);
                    }

                    if (event.target.classList.contains('preview-journal-btn')) {
                        onParseActionModal(event, `/journal/preview?id=${target_id}`, 'get', 
                            [{callback: (new Journal()).journalPreview, params: [event, target_id]}, 
                                {callback: (new Auth()).login, params: []}], 
                            'data-modal'
                        );
                    }
                });
            }
        });
    }

    editJournal() {
        let form = document.querySelector(".journal-form");
        let btn = document.querySelector(".edit-journal-btn");
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
                
                let data = new FormData(form); 
                data.append('journal', urlParams()['journal']);

                $.ajax({
                    type: form.getAttribute('method'),
                    url: form.getAttribute('action'),
                    data: data,
                    dataType: 'json', 
                    contentType: false,
                    processData: false,
                    success: function (res) { 
                        btn.disabled = false;
                        __append_html('Edit Journal', btn);
                        
                        if (res && res.message) {
                            toast(res.status, 8000, res.message); 
                        }

                        if (res && !res.redirectUrl && 
                            res.rmPreviousAddedAttachments && 
                            res.rmPreviousAddedAttachments == 1) {
                            window.location.reload();
                        }

                        if (res && res.redirectUrl) {
                            route(res.redirectUrl);
                        }
                    },
                    error: error => {
                        btn.disabled = false;
                        __append_html('Edit Journal', btn);
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
}

document.addEventListener('DOMContentLoaded', () => {
    const journalInstance = new Journal();
    journalInstance.create();
    journalInstance.getJournals();
    journalInstance.editJournal();
    setupUploadDivSection(); 
    searchSelectInitializer();
});
