
const api = (router) => { 
    const { upload } = require('@config/storage');  
    const JournalController = require('@app/controllers/api/JournalController'); 

    // These are free api endpoints, therefore no need to have authentication middleware.

    // journals routes
    router.get('/api/journal/list', JournalController.index);
    router.post('/api/journal/create', upload.array('attachments', 100), JournalController.createJournal);
    router.post('/api/journal/edit', upload.array('attachments', 100), JournalController.editJournal); 
    router.delete('/api/journal/trash', JournalController.trashJournal);
    router.get('/api/journal/categories', JournalController.journalCategories);
    router.post('/api/journal/category/create', upload.none(), JournalController.createJournalCategories);
    router.post('/api/journal/category/edit', upload.none(), JournalController.editJournalCategories);

}

module.exports = api;
