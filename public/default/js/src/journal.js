class Journal {
    constructor() {
        // 
    }

    createJournal() {
        let form = document.querySelector(".journal-form");
        let btn = document.querySelector(".save-journal-btn");
        const content = document.querySelector("meta[name='ckeditorLicenseKey']")?.content;
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
                if (content && typeof CKEDITOR !== 'undefined' && editorInstance) {  
                    let editorData = editorInstance.getData();  

                    if (data.has('description')) {
                        data.set('description', editorData);
                    } else {
                        data.append('description', editorData);
                    }
                }

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
            const date_filter = parseDateRange($('.journal-date-filter').val());
            const dataTable = $(table).DataTable({
                destroy: true,
                processing: true,
                pageLength: 10, 
                borders: true,
                ajax: {
                    type: 'GET',
                    url: `/journal/list?type=dt&start_date=${date_filter['startDate']}&end_date=${date_filter['endDate']}`,
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
                    {data: 'category_name'},
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

                    if (event.target.classList.contains('delete-journal-btn')) {
                        this.deleteJournal(target_id, event);
                    }
                });
            }
        });
    }

    editJournal() {
        let form = document.querySelector(".journal-form");
        let btn = document.querySelector(".edit-journal-btn");
        const content = document.querySelector("meta[name='ckeditorLicenseKey']")?.content;
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
                if (content && typeof CKEDITOR !== 'undefined' && editorInstance) {  
                    let editorData = editorInstance.getData();  

                    if (data.has('description')) {
                        data.set('description', editorData);
                    } else {
                        data.append('description', editorData);
                    }
                }
                
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

    deleteJournal(target_id, event) { 
        event.target.disabled = true; 
        $.ajax({
            type: 'DELETE',
            url: `/journal/trash?id=${target_id}`, 
            dataType: 'json',  
            success: function (res) { 
                event.target.disabled = false;  
                if (res && res.message) {
                    res.status ? toast(res.status, 8000, res.message) : null; 
                    if (res.status && res.status== 'success') {
                        (new Journal()).getJournals();
                    }
                } 
            },
            error: error => {
                event.target.disabled = false; 
                try {
                    error = JSON.parse(error.responseText);
                } catch (e) {
                    error = { message: "An error occurred." };
                }

                console.log(`Ajax Error: ${error.message || JSON.stringify(error)}`);
                toast('error', 8000, error.message || 'An error occurred. Please try again!');
            }
        }); 
    }

    createJournalCategories() { 
        let form = document.querySelector(".journal-category-form");
        let btn = document.querySelector(".add-journal-category-btn");
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
                        __append_html('Add', btn);
                        
                        if (res && res.message) {
                            toast(res.status, 8000, res.message);
                            if (res.status == 'success') {
                                recursiveClearForm(".journal-category-form");
                                __quick_close_modal('.add-category-modal');
                                (new Journal()).getJournalCategories();
                            }
                        } 
                    },
                    error: error => {
                        btn.disabled = false;
                        __append_html('Add', btn);
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

    getJournalCategories() {
        const table = document.querySelector('.journal-categories-table');
        if (documentContains(table)) {
            const dataTable = $(table).DataTable({
                destroy: true,
                processing: true,
                pageLength: 10,  
                ajax: {
                    type: 'GET',
                    url: '/journal/categories?type=dt',
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
                    {data: 'category_name'}, 
                    {data: 'description_formated'}, 
                    {data: 'created_at'}, 
                ],
                fnDrawCallback: () => {
                    (new Journal()).actionOnJournalCategoriesResource();
                    
                    $('.journals-categories-table tbody').off('click', 'tr').on('click', 'tr', function (event) {
                        if ($(event.target).is('button, a, input, select')) return;
                        let data = dataTable.row(this).data();
                        if (data) {
                            // 
                        }
                    });
                }  
            });
        }
        
    }
    
    actionOnJournalCategoriesResource() {
        const resourceBtns = document.querySelectorAll('.journal-category-resource');

        resourceBtns.forEach(btn => {
            if (documentContains(btn)) {
                btn = cloneNodeElement(btn);
                btn.addEventListener('click', event => {
                    event.preventDefault();
                    const target_id = event.target.getAttribute('data-id');
                    if (event.target.classList.contains('edit-journal-category-btn')) {
                        onParseActionModal(event, `/journal/category/edit?id=${target_id}`, 'get', 
                            [{callback: (new Journal()).editJournalCategory, params: [event, target_id]}, 
                                {callback: (new Auth()).login, params: []}], 
                            'data-modal'
                        );
                    } 
                });
            }
        });
    }

    editJournalCategory(targetBtnEvent, target_id) {
        let form = document.querySelector(".edit-journal-category-form");
        let btn = document.querySelector(".edit-journal-category-submit-btn");
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
                data.append('id', target_id);

                $.ajax({
                    type: form.getAttribute('method'),
                    url: form.getAttribute('action'),
                    data: data,
                    dataType: 'json', 
                    contentType: false,
                    processData: false,
                    success: function (res) { 
                        btn.disabled = false;
                        __append_html('Edit', btn);
                        
                        if (res && res.message) {
                            toast(res.status, 8000, res.message);
                            if (res.status == 'success') { 
                                __quick_close_modal('.edit-category-modal');
                                (new Journal()).getJournalCategories();
                            }
                        } 
                    },
                    error: error => {
                        btn.disabled = false;
                        __append_html('Edit', btn);
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
    setupCkEditor();
    journalInstance.createJournal();
    journalInstance.getJournals();
    journalInstance.editJournal();
    journalInstance.createJournalCategories();
    journalInstance.getJournalCategories();
    setupUploadDivSection(); 
    searchSelectInitializer();
});
