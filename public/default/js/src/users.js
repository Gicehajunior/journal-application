class User {
    constructor() {
        // 
    }

    getUsers() {
        const table = document.querySelector('.users-table');
        if (documentContains(table)) {
            $(table).DataTable({
                destroy: true,
                processing: true,
                pageLength: 10,  
                ajax: {
                    type: 'GET',
                    url: '/list',
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
                    {data: 'fullname'},
                    {data: 'username'},
                    {data: 'email'},
                    {data: 'contact'},
                    {data: 'created_at'},
                    {data: 'updated_at'},
                ],
                fnDrawCallback: () => {
                    (new User()).actionOnUsersResource();
                }
            });
        }
    }

    actionOnUsersResource() {
        const resourceBtns = document.querySelectorAll('.users-resource');

        resourceBtns.forEach(btn => {
            if (documentContains(btn)) {
                btn = cloneNodeElement(btn);
                btn.addEventListener('click', event => {
                    event.preventDefault();
                    const target_id = event.target.getAttribute('data-id');
                    if (event.target.classList.contains('edit-user-btn')) {
                        onParseActionModal(event, `/users/edit?id=${target_id}`, 'get', 
                            [{callback: (new User()).editUser, params: [event, target_id]}, 
                                {callback: (new User()).login, params: []}], 
                            'data-modal'
                        );
                    }
                });
            }
        });
    }

    editUser(actionBtnEvent, target_id) {
        let btn = document.querySelector(".edit-user-auth-btn");
        let form = document.querySelector(".edit-user-form");
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
                data.append('id', target_id);

                $.ajax({
                    type: form.getAttribute('method'),
                    url: `${form.getAttribute('action')}`,
                    data: data,
                    dataType: 'json', 
                    contentType: false,
                    processData: false,
                    success: function (res) { 
                        btn.disabled = false;
                        __append_html('Edit', btn);
                        
                        if (res && res.message) {
                            (new User()).getUsers();
                            toast(res.status, 8000, res.message);
                            __quick_close_modal(actionBtnEvent.target.getAttribute('data-modal'));
                        } 
                    },
                    error: error => {
                        btn.disabled = false;
                        __append_html('Edit', btn);
                        error = JSON.parse(error.responseText) || error;
                        console.log(`Ajax Error: ${error.message || JSON.parse(error.responseText) || JSON.stringify(error)}`);
                        toast('error', 8000, error.message || 'An error occurred. Please try again!');
                    }
                });
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const userInstance = new User();
    userInstance.getUsers(); 
});
