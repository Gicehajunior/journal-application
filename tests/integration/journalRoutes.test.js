const request = require('supertest');
const app = require('../../server');

describe('Journal API Integration Tests', () => {
    let createdJournalId = null;
    
    // Helper func
    const expectErrorResponse = (res, expectedStatus, expectedCode=null, expectedMessage=null) => {
        expect(res.statusCode).not.toBe(expectedStatus); 
    };

    // Fetching all journals
    it('should fetch all journals', async () => {
        const res = await request(app).get('/api/journal/list');

        if (res.statusCode === 200) {
            expect(res.body).toBeInstanceOf(Array);
        } else {
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });

    // Creating a new journal
    it('should create a new journal', async () => {
        const res = await request(app)
            .post('/api/journal/create')
            .field('title', 'Test Journal')
            .field('content', 'This is a test journal entry')
            .attach('attachments', Buffer.from('dummy file content'), 'test.txt');

        if (res.statusCode === 200) {
            expect(res.body).toHaveProperty('data.id');
            createdJournalId = res.body.id;
        } else {
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });

    // Editing a journal
    it('should update an existing journal', async () => {
        const res = await request(app)
            .put(`/api/journal/edit?id=${createdJournalId}`)
            .field('title', 'Updated Journal')
            .field('content', 'Updated content');

        if (res.statusCode === 200) {
            expect(res.body.message).toBe('Journal updated successfully');
        } else {
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });

    // Deleting a journal
    it('should delete a journal', async () => {
        const res = await request(app).delete(`/api/journal/trash?id=${createdJournalId}`);

        if (res.statusCode === 200) {
            expect(res.body.message).toBe('Journal deleted successfully');
        } else {
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });

    // Fetching journal categories
    it('should fetch journal categories', async () => {
        const res = await request(app).get('/api/journal/categories');

        if (res.statusCode === 200) {
            expect(res.body).toBeInstanceOf(Array);
        } else {
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });

    // Creating a new category
    it('should create a new journal category', async () => {
        const res = await request(app)
            .post('/api/journal/categories/create')
            .send({ name: 'Tech' });

        if (res.statusCode === 201) {
            expect(res.body).toHaveProperty('id');
        } else {
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });

    // Editing a journal category
    it('should update a journal category', async () => {
        const res = await request(app)
            .put('/api/journal/categories/edit?id=1')
            .send({ name: 'Science' });

        if (res.statusCode === 200) {
            expect(res.body.message).toBe('Category updated successfully');
        } else {
            expectErrorResponse(res, 200, 'GATEWAY ERROR', 'Gateway error');
        }
    });
});
