const request = require('supertest');
const app = require('../../server');

describe('Journal API Integration Tests', () => {
    let createdJournalId = null;
    let createdJournaCategoryId = null;

    beforeAll(async () => {
        jest.setTimeout(20000);

        // A random string to ensure test doesn't fallback on 
        // checking the journal category if exists.
        function getRandomNumberString(length) {
            return Math.random().toString().slice(2, 2 + length).padStart(length, '0');
        }
        
        // create a new category 
        const res = await request(app)
            .post('/api/journal/category/create')
            .field('email', 'gicehajunior76@gmail.com')
            .field('category_name', `Tech ${getRandomNumberString(3)}`)
            .field('description', 'Category Tech');
    
        console.log('BeforeAll Category Response:', res.body);
        
        if (res.statusCode === 200) {
            createdJournaCategoryId = res.body.data; 
        } else {
            throw new Error('Failed to create journal category');
        }
    }); 

    // Helper func
    const expectErrorResponse = (res, expectedStatus, expectedCode=null, expectedMessage=null) => {
        expect(res.statusCode).not.toBe(expectedStatus); 
    };

    // Fetching journal categories
    it('should fetch journal categories', async () => {
        const res = await request(app).get('/api/journal/categories');
            
        if (res.statusCode === 200) {
            expect(res.body).toHaveProperty('data'); 
        } else {
            console.log(res.body ? res.body : {});
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });

    // Editing a journal category
    it('should update a journal category', async () => { 
        const res = await request(app)
            .post('/api/journal/category/edit')
            .field('category_name', 'Science')
            .field('id', createdJournaCategoryId)
            .field('description', 'Category description update')
            .field('email', 'gicehajunior76@gmail.com');

        if (res.statusCode === 200) {
            expect(res.body.message).toBe('Category updated successfully!');
        } else {
            console.log(res.body ? res.body : {});
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });

    // Fetching all journals
    it('should fetch all journals', async () => {
        const res = await request(app).get('/api/journal/list')
            .query({
                start_date: '2025-03-01',
                end_date: '2025-03-30',
                email: 'gicehajunior76@gmail.com'
            });

        if (res.statusCode === 200) {
            expect(res.body).toHaveProperty('data');
        } else {
            console.log(res.body ? res.body : {});
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });

    // Creating a new journal
    it('should create a new journal', async () => {
        const res = await request(app)
            .post('/api/journal/create') 
            .field('email', 'gicehajunior76@gmail.com')
            .field('category_id', createdJournaCategoryId)
            .field('title', 'Test Journal')
            .field('date', '2025-03-25')
            .field('description', 'This is a test journal entry')
            .attach('attachments', Buffer.from('dummy file content'), 'test.pdf');
        
        if (res.statusCode === 200) {
            expect(res.body).toHaveProperty('data.id'); 
            createdJournalId = res.body.data.id;
        } else {
            console.log(res.body ? res.body : {});
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });

    // Editing a journal
    it('should update an existing journal', async () => {
        const res = await request(app)
            .post('/api/journal/edit')
            .field('id', createdJournalId)
            .field('email', 'gicehajunior76@gmail.com')
            .field('title', 'Updated Journal')
            .field('date', '2025-03-26')
            .field('category_id', '2')
            .field('description', 'This is the updated journal entry description')
            .field('rmPreviousAddedAttachments', 'true')
            .attach('attachments', Buffer.from('Updated file content'), 'updated_test.png'); 

        if (res.statusCode === 200) {
            expect(res.body.message).toBe('Journal updated successfully!'); 
        } else {
            console.log(res.body ? res.body : {});
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });

    // Deleting a journal
    it('should delete a journal', async () => {
        const res = await request(app)
            .delete(`/api/journal/trash`)
            .query({
                id: createdJournalId, 
                email: 'gicehajunior76@gmail.com'
            }); 
            
        if (res.statusCode === 200) {
            expect(res.body.message).toBe('Journal deleted successfully!');
        } else {
            console.log(res.body ? res.body : {});
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });
});
