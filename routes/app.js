/**
 * MyExpress Framework - Centralized Routing Module
 * ------------------------------------------------
 * This file serves as the core routing hub for MyExpress, 
 * ensuring that all application routes are well-structured 
 * and maintainable.
 *
 * - Auth routes are modularized and loaded from the `auth` module.
 * - Additional routes should be added below for better organization.
 * - Middleware (such as authentication) is applied to protect routes.
 *
 * Designed and Developed by Giceha Junior
 * GitHub: https://github.com/Gicehajunior
 */
const express = require('express');

const {upload} = require('@config/storage');
const authRoutes = require('@routes/auth'); 
const UsersController = require('@app/controllers/other/UsersController');
const DashboardController = require('@app/controllers/other/DashboardController');
const JournalController = require('@app/controllers/other/JournalController');
const authMiddleware = require('@app/mwares/authMiddleware');

const router = express.Router();   

// Auth Routes
authRoutes(router);

// Add New Routes here...
// dashboard routes
router.get('/dashboard', authMiddleware, DashboardController.index);

// users routes
router.get('/users', authMiddleware, UsersController.index); 
router.get('/list', authMiddleware, UsersController.getUsers); 
router.route('/users/edit')
    .get(authMiddleware, UsersController.editUser)
    .post(authMiddleware, upload.none(), UsersController.editUser); 

// journals routes
router.route('/journal/list')
    .get(authMiddleware, JournalController.index)
    .post(authMiddleware, JournalController.index);
router.route('/journal/create')
    .get(authMiddleware, JournalController.createJournal) 
    .post(authMiddleware, upload.array('attachments', 100), JournalController.createJournal);
router.route('/journal/edit')
    .get(authMiddleware, JournalController.editJournal)
    .post(authMiddleware, upload.array('attachments', 100), JournalController.editJournal);
router.get('/journal/preview', authMiddleware, JournalController.journalPreview);
router.get('/journal/categories', authMiddleware, JournalController.journalCategories);
router.post('/journal/category/create', authMiddleware, upload.none(), JournalController.createJournalCategories);
router.route('/journal/category/edit')
    .get(authMiddleware, JournalController.editJournalCategories)
    .post(authMiddleware, upload.none(), JournalController.editJournalCategories);

module.exports = router;
