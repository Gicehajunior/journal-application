function toast(status, time, message) {
    try {
        if (message != undefined || message != null) {
            toastr.options.newestOnTop = true;
            toastr.options.timeOut = time;
            toastr.options.extendedTimeOut = 0;
            toastr.options.progressBar = true;
            toastr.options.rtl = false;
            toastr.options.closeButton = true;
            toastr.options.closeMethod = 'fadeOut';
            toastr.options.closeDuration = 300;
            toastr.options.closeEasing = 'swing';
            toastr.options.preventDuplicates = true;

            if (status == 'success') {
                toastr.success(message);
                playSuccessAudio();
            } else if (status == 'warning') {
                toastr.warning(message);
                playWarningAudio();
            } else if (status == 'info') {
                toastr.info(message);
            } else if (status == 'error') {
                toastr.error(message);
                playErrorAudio();
            }
        }
    } catch (error) {
        console.log('Toast Error: ' + error);
    }
}

// Function to play success audio
function playSuccessAudio() {
    var successAudio = document.getElementById('success-audio');
    if (documentContains(successAudio)) {
        successAudio.play();
    }
}

// Function to play error audio
function playErrorAudio() {
    var errorAudio = document.getElementById('error-audio');
    if (documentContains(errorAudio)) {
        errorAudio.play();
    }
}

// Function to play warning audio
function playWarningAudio() {
    var warningAudio = document.getElementById('warning-audio');
    if (documentContains(warningAudio)) {
        warningAudio.play();
    }
}

function cloneNodeElement(element) {
    var newElement = null;
    if (documentContains(element)) {
        newElement = element.cloneNode(true);
        element.replaceWith(newElement);
    }

    return newElement;
}

function goBack() {
    window.history.back();
}

/**
 * Appends HTML content to an element without replacing existing content.
 * @param {string} content - The HTML content to append.
 * @param {HTMLElement} element - The element to which the content will be appended.
 */
function __append_html(content, element, append=false) {
    if (append) {
        element.innerHTML += content; // Append new content
    } else {
        element.innerHTML = content; // Replace content
    }
}

function __show_modal(modal) {
    try {
        let $modalElement;

        if (modal.startsWith('.')) {
            $modalElement = $(`${modal}`);
        } else {
            $modalElement = $(`.${modal}`);
        }
    
        if ($modalElement.length === 0) {
            console.warn(`Modal not found: ${modal}`);
            return;
        }
    
        if ($modalElement.hasClass('show')) {
            $modalElement.modal('hide');
            $modalElement.on('hidden.bs.modal', function (e) {
                $modalElement.off('hidden.bs.modal');
                $modalElement.modal('show');
            });
        } else {
            $modalElement.modal('show');
        }
    } catch (error) {
        error = JSON.parse(error.responseText) || error;
        console.log(`Ajax Error: ${error.message || JSON.parse(error.responseText) || JSON.stringify(error)}`);
        toast('error', 8000, error.message || 'Show modal event error!');
    }
}

function documentContains(target) {
    if (target && document.body.contains(target)) {
        return true;
    }

    return false;
}

function urlParams(url = window.location.href) {
    const searchParams = new URL(url).searchParams;
    const params = {};

    for (const [key, value] of searchParams) {
        params[key] = value;
    }

    return params;
}

function paramsToQueryString(params) {
    return Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
}

function UrlQueryParams(url = window.location.href) {
    const queryParams = urlParams(url); 
    const queryString = paramsToQueryString(queryParams);
    
    return queryString ? `?${queryString}` : '';
}

function win_route (route) {
    if (window.location.pathname && route == window.location.pathname) {
        return true
    }

    return false;
}

function routepath () {
    return window.location.pathname;
}

function route(path, params = null) {
    if (path.length == 0) {
        return false;
    } else {
        var queryString = '';
        if (params !== null && typeof params === 'object') {
            queryString = '?' + Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
        }
        window.location.href = `${path}${queryString}`;
    }
}

function onParseActionModal(event, action, method='GET', callbackFuncs = undefined, modalAttributeSelector='target-modal', modalSelector=undefined) {
    $.ajax({
        type: `${method}`,
        url: `${action}`,
        dataType: 'html',
        success: function (res, status, xhr) {
            event.target.disabled = false;
            if (res.status && res.status == 'error') {
                toast(res.status, 500, res.message || 'An error occurred!');
                return;
            }

            let contentType = xhr.getResponseHeader("Content-Type"); 
            if (contentType && contentType.includes("text/html")) { 
                let target_modal_selector = (modalSelector !== undefined) ? modalSelector : event.target.getAttribute(modalAttributeSelector);
                if (target_modal_selector) { 
                    const modal_target = document.querySelector(target_modal_selector);
                    __append_html(res, modal_target);
                    __show_modal(target_modal_selector); 
                }

                setTimeout(() => {
                    dateRangeInitializer();
                    searchSelectInitializer();
                    if (callbackFuncs !== undefined) { 
                        if (Array.isArray(callbackFuncs)) {
                            callbackFuncs.forEach(item => { 
                                if (typeof item === 'function' && item.callback) {
                                    item(...(item.params?.length ? item.params : [])); // Call directly if it's a function
                                }
                                else if (typeof item === 'object' && item.callback) {
                                    item.callback(...(item.params?.length ? item.params : []));
                                }
                            });
                        }
                    }
                }, 1000);
            } else {
                toast('error', 5000, 'Server error, Please try again or contact the administrator!');
            }
        },
        error: (error) => {
            console.log(error);
            event.target.disabled = false;
            toast('error', 5000, error.message || 'Server error, Please try again or contact the administrator!');
        }
    })
}

function dateRangeInitializer(selectedDatesParams = undefined) {
    try {
        const dateRangeInputFields = document.querySelectorAll('.dateRange') 
        dateRangeInputFields.forEach(dateRangeInputField => {
            $(dateRangeInputField).datepicker({
                format: jsDateFormat,
                autoclose: false,
                todayHighlight: false,
                multidate: true,
                multidateSeparator: ' - '
            }).on('changeDate', function (e) {
                var selectedDates = $(this).datepicker('getDates');
                if (selectedDates.length > 2) {
                    selectedDates.pop();
                    $(this).datepicker('setDates', selectedDates);
                }
            });

            // Get today's date
            var today = new Date();

            if (selectedDatesParams == undefined) {
                // Get the start of the current month
                var startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

                // Get the end of the current month
                var endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            }

            if (selectedDatesParams !== undefined) { 
                var date_range = parseDateRange(selectedDatesParams); 
                var startOfMonth = date_range['startDate'];
                var endOfMonth = date_range['endDate'];
            }

            // Set the date range to cover the entire current month
            $(dateRangeInputField).datepicker('setDates', [startOfMonth, endOfMonth]); 
        });
    } catch (error) {
        // catch error
        console.log("NET Error.")
    }
}

function parseDateRange(dateRangeStr) {
    // Split the date range into start and end dates
    var dates = dateRangeStr.split(' - ');
    
    return {
        startDate: dates[0].trim(),
        endDate: dates[1].trim()
    };
}

function searchSelectInitializer() {  
    $('.searchSelect').each(function (index) {  
        var currentSelect = $(this);
        var dataUrl = currentSelect.attr('data-url');  
        
        currentSelect.select2({
            width: '100%',
            dropdownParent: currentSelect.parent()
        }); 

        if (dataUrl) {
            if (dataUrl.length > 0) {
                $.ajax({
                    url: dataUrl,
                    type: 'GET',
                    dataType: 'json',
                    success: function (response) {
                        $.each(response.data, function (index, options) {
                            $.each(options, function (index, option) {
                                var item_id_notation = currentSelect.attr('selector-id');
                                var item_name_notation = currentSelect.attr('selector-name');
                                var item_unique_notation = currentSelect.attr('selector-unique');
                                var text_option;
                                if (item_unique_notation.length > 0) {
                                    text_option = `${option[item_name_notation]} - ${option[item_unique_notation]}`;
                                } else {
                                    text_option = `${option[item_name_notation]}`;
                                }

                                var $option = $('<option>', {
                                    value: `${option[item_id_notation]}`,
                                    text: text_option
                                }); 

                                currentSelect.append($option);

                            });
                            notification(currentSelect, options)
                        });
                    },
                    error: function (error) {
                        console.log('Error fetching data: ', error);
                    }
                });
            }
        }
    });
    
}

function __quick_close_modal(modalClass) {
    var $modals = modalClass.startsWith('.') ? $(modalClass) : $(`.${modalClass}`);

    if ($modals.length === 0) {
        console.warn(`No modals found with class: ${modalClass}`);
        return;
    }

    $modals.each(function() {
        var $modal = $(this);
        
        $modal.modal('hide');

        $modal.on('hidden.bs.modal', function() {
            if ($("body").hasClass("modal-open")) {
                $("body").removeClass("modal-open");
            }
            $('body').removeAttr('style');
            $modal.off('hidden.bs.modal');
        });
    });
}

function setupUploadDivSection() {
    const uploadSectionArea = document.querySelector(".upload-section-area");
    const fileslist = document.querySelector(".files-list");
    const fileInput = document.querySelector(".attachments");

    if (!uploadSectionArea || !fileInput) return;

    uploadSectionArea.addEventListener("click", () => fileInput.click());

    uploadSectionArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadSectionArea.style.borderColor = "#007bff";
    });

    uploadSectionArea.addEventListener("dragleave", () => {
        uploadSectionArea.style.borderColor = "#ccc";
    });

    uploadSectionArea.addEventListener("drop", (event) => {
        event.preventDefault();
        uploadSectionArea.style.borderColor = "#ccc";

        const files = event.dataTransfer.files;
        if (files.length > 0) { 
            const dataTransfer = new DataTransfer();
            for (const file of files) {
                dataTransfer.items.add(file);
            }
            fileInput.files = dataTransfer.files; 
            displaySelectedFiles(fileInput);
        }
    });

    function displaySelectedFiles(input) {
        const fileList = input.files;
        const fileNames = Array.from(fileList).map(file => file.name).join(", ");
        __append_html(`<p><strong>Selected:</strong> ${fileNames}</p>`, fileslist, true);
    }
}

function recursiveClearForm(selector, fileListSelector = null) {
    const formElement = document.querySelector(selector);
    if (!formElement) return;

    function clearElement(element) {
        if (element.tagName === 'INPUT') {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false;
            } else if (element.type === 'file') {
                element.value = '';
            } else {
                element.value = '';
            }
        } else if (element.tagName === 'TEXTAREA') {
            element.value = '';
        } else if (element.tagName === 'SELECT') {
            element.selectedIndex = 0;
        } else {
            Array.from(element.children).forEach(clearElement);
        }
    }

    clearElement(formElement);
    
    if (fileListSelector) {
        const fileListContainers = document.querySelectorAll(fileListSelector);
        fileListContainers.forEach(fileListContainer => {
            if (fileListContainer) {
                fileListContainer.innerHTML = '';
            }
        });
    }
}
