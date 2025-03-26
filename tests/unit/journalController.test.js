const JournalController = require('@app/controllers/api/JournalController');
const Journal = require('@app/models/Journal');
const JournalUtil = require('@utils/JournalUtil'); 
const UserUtil = require('@utils/UserUtil'); 
const httpMocks = require('node-mocks-http');
const Exception = require('@config/exception');
const sinon = require('sinon');

jest.setTimeout(10000);

describe("JournalController - Unit Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.resetAllMocks();
    });

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse(); 
    }); 

    afterEach(() => {
        sinon.restore(); 
    });

    it("should return 400 if params are missing", async () => {
        req.query = {};
        await JournalController.index(req, res);

        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toEqual({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Missing required fields",
                reason: {
                    start_date: "start_date is required",
                    end_date: "end_date is required",
                    email: "email is required",
                },
            },
        });
    });

    it("should return 400 if an account with the email param unexists", async () => {     
        req.query = { start_date: "2025-01-01", end_date: "2025-03-31", email: "test@example.com" };
        await JournalController.index(req, res);

        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toEqual({ 
            success: false, 
            error: {
                code: "USER_NOT_FOUND_ERROR",
                message: "User not found", 
                reason: "Email invalid or does not exist"
            }
        });
    }); 

    it("should return 200 and a list of journals if request is valid", async () => {     
        req.query = { start_date: "2025-01-01", end_date: "2025-03-31", email: "gicehajunior76@gmail.com" };
        await JournalController.index(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toHaveProperty('data');
    });    

    it("should return 500 if an internal error occurs", async () => { 
        jest.spyOn(JournalUtil, "getAllJournals").mockRejectedValue(new Error("Gateway error"));
    
        req.query = { start_date: "2024-01-01", end_date: "2024-01-31", email: "gicehajunior76@gmail.com"};
        await JournalController.index(req, res); 
        
        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({ 
            success: false, 
            error: {
                code: "GATEWAY_ERROR",
                message: "Gateway error", 
                reason: "Internal server error"
            }
        });
    });

    it("Should return 200 and create a new journal resource", async () => {
        sinon.stub(UserUtil, "getUserByEmail").resolves({ id: 123, email: 'nesthub.daphascomp@gmail.com' });
        sinon.stub(JournalUtil, "createJournalFunc").resolves({ id: 1, title: "Title" });
    
        req.body = { 
            email: "gicehajunior76@gmail.com", 
            title: "Title", 
            date: "2025-01-01", 
            category_id: "1", 
            description: "Test",
            attachments: []
        };
    
        await JournalController.createJournal(req, res);
    
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({
            success: true,
            message: "Journal created successfully!",
            data: { id: 1, title: "Title" }
        });
    });
    
    it("Should return 400 if required fields are missing", async () => {
        req.body = { email: "", title: "", date: "", category_id: "", description: "" };
    
        await JournalController.createJournal(req, res);
    
        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toMatchObject({
            "error": {
                "code": "VALIDATION_ERROR", 
                "message": "Missing required fields.", 
                "reason": [
                    "email", 
                    "title", 
                    "date", 
                    "category_id", 
                    "description"
                ]
            }, 
            "success": false
        });
    });
    
    it("Should return 400 for an invalid email format", async () => {
        req.body = { 
            email: "gicehajunior76gmail,com", 
            title: "Title", 
            date: "2025-01-01", 
            category_id: "1", 
            description: "Test" 
        };
    
        await JournalController.createJournal(req, res);
    
        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toMatchObject({
            success: false,
            error: {
                code: "INVALID_EMAIL",
                message: "Invalid email format."
            }
        });
    });
    
    it("Should return 400 if user does not exist", async () => {
        sinon.stub(UserUtil, "getUserByEmail").resolves(null);
    
        req.body = { 
            email: "nesthub.daphascomp@gmail.com", 
            title: "Title", 
            date: "2025-01-01", 
            category_id: "1", 
            description: "Test" 
        };
    
        await JournalController.createJournal(req, res);
    
        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toMatchObject({
            success: false,
            error: {
                code: "USER_NOT_FOUND_ERROR",
                message: "User not found",
                reason: "Email invalid or unexists"
            }
        });
    });
    
    it("Should return 500 if journal creation fails", async () => {
        sinon.stub(UserUtil, "getUserByEmail").resolves({ id: 123, email: 'nesthub.daphascomp@gmail.com' });
        sinon.stub(JournalUtil, "createJournalFunc").rejects(new Exception(
            500, 
            'JOURNAL_CREATION_FAILED', 
            'Failed to create journal. Please try again.',
            'Internal server error'
        ));
    
        req.body = { 
            email: "gicehajunior76@gmail.com", 
            title: "Title", 
            date: "2025-01-01", 
            category_id: "1", 
            description: "Test" 
        };
    
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn();
        await JournalController.createJournal(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: "JOURNAL_CREATION_FAILED",
                message: "Failed to create journal. Please try again.",
                reason: "Internal server error"
            }
        });
    });
    
    it("Should return 500 if an unexpected internal error occurs", async () => {
        sinon.stub(UserUtil, "getUserByEmail").throws(new Error("Database connection error"));
    
        req.body = { 
            email: "gicehajunior76@gmail.com", 
            title: "Title", 
            date: "2025-01-01", 
            category_id: "1", 
            description: "Test" 
        };

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn();
        await JournalController.createJournal(req, res);
    
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: "GATEWAY_ERROR",
                message: "Database connection error",
                reason: "Internal server error"
            }
        });
    });

    it("Should return 200 and delete the journal successfully", async () => {
        sinon.stub(UserUtil, "getUserByEmail").resolves({ id: 123 });
        sinon.stub(JournalUtil, "getJournalDetailsById").resolves({ id: 1, title: "Test Journal" });
        sinon.stub(JournalUtil, "deleteJournal").resolves(true);

        req.query = { id: 1, email: 'gicehajunior76@gmail.com' };  

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn();
        
        await JournalController.trashJournal(req, res);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Journal deleted successfully!"
        });
    });

    it("Should return 400 if journal ID is missing", async () => {
        req.query = {};

        await JournalController.trashJournal(req, res);

        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toMatchObject({
            success: false,
            error: {
                code: "MISSING_JOURNAL_ID",
                message: "Journal ID is required."
            }
        });
    });

    it("Should return 404 if journal is not found", async () => {
        sinon.stub(JournalUtil, "getJournalDetailsById").resolves(null);

        req.query = { id: 99, email: 'gicehajunior76@gmail.com' };
        await JournalController.trashJournal(req, res);

        expect(res.statusCode).toBe(404);
        expect(res._getJSONData()).toMatchObject({
            success: false,
            error: {
                code: "JOURNAL_NOT_FOUND",
                message: "Journal not found."
            }
        });
    });

    it("Should return 500 if journal deletion fails", async () => {
        sinon.stub(JournalUtil, "getJournalDetailsById").resolves({ id: 1, title: "Test Journal" });
        sinon.stub(JournalUtil, "deleteJournal").resolves(false);

        req.query = { id: 1, email: 'gicehajunior76@gmail.com' };
        await JournalController.trashJournal(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toMatchObject({
            success: false,
            error: {
                code: "JOURNAL_DELETE_FAILED",
                message: "Failed to delete journal. Please try again."
            }
        });
    });

    it("Should return 500 for unexpected internal errors", async () => {
        sinon.stub(JournalUtil, "getJournalDetailsById").throws(new Error("Database connection error"));

        req.query = { id: 1, email: 'gicehajunior76@gmail.com' };
        await JournalController.trashJournal(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toMatchObject({
            success: false,
            error: {
                code: "GATEWAY_ERROR",
                message: "Database connection error"
            }
        });
    });
    
});
