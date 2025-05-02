import { FakeTask } from './fake-task.model';

export const FAKE_TASKS: FakeTask[] = [
    {
        fakeId: 'fake1',
        fakeTitle: 'Design new fdsafdsafasdfadfadsfasdfasdfasdfafddashboard',
        fakeDescription: 'Create wireframes fsadfsadfafsdfasdfasfasfasdfasdfsfasdfsdafasdfasfdor the new admin dashboard',
        fakeCategory: 'User Story',
        fakePriority: 'high',
        fakeStatus: 'todo',
        fakeDuedate: new Date('2023-12-15'),
        fakeAssignees: ['fakeUser1', 'fakeUser2'],
        fakeSubtasks: [
            { fakeTitle: 'Create initial sketches', fakeCompleted: false },
            { fakeTitle: 'Get feedback from team', fakeCompleted: false }, { fakeTitle: 'Create initial sketches', fakeCompleted: true },
            { fakeTitle: 'Get feedback from team', fakeCompleted: true }, { fakeTitle: 'Get feedback from team', fakeCompleted: true }
        ]
    },
    {
        fakeId: 'fake2',
        fakeTitle: 'Fix login bug',
        fakeDescription: 'Users reportingfasdfasdfadsfafdafdsafaddfadsafds 404 errors on login page',
        fakeCategory: 'Technical Task',
        fakePriority: 'medium',
        fakeStatus: 'todo',
        fakeDuedate: new Date('2023-12-10'),
        fakeAssignees: ['fakeUser3'],
        fakeSubtasks: [
            { fakeTitle: 'Reproduce the issue', fakeCompleted: true },
            { fakeTitle: 'Debug the problem', fakeCompleted: false }
        ]
    },
    {
        fakeId: 'fake3',
        fakeTitle: 'Implement API endpoints',
        fakeDescription: 'Create CRUD endpoints for user management',
        fakeCategory: 'User Story',
        fakePriority: 'high',
        fakeStatus: 'inProgress',
        fakeDuedate: new Date('2023-12-20'),
        fakeAssignees: ['fakeUser4', 'fakeUser5'],
        fakeSubtasks: [
            { fakeTitle: 'Design database schema', fakeCompleted: true },
            { fakeTitle: 'Create first endpoints', fakeCompleted: false }
        ]
    },
    {
        fakeId: 'fake4',
        fakeTitle: 'Mobile app redesign',
        fakeDescription: 'Update UI for better mobile experience',
        fakeCategory: 'User Story',
        fakePriority: 'medium',
        fakeStatus: 'inProgress',
        fakeDuedate: new Date('2023-12-18'),
        fakeAssignees: ['fakeUser1', 'fakeUser6'],
        fakeSubtasks: [
            { fakeTitle: 'Research competitors', fakeCompleted: true },
            { fakeTitle: 'Create mood board', fakeCompleted: true },
            { fakeTitle: 'Design first screens', fakeCompleted: false }
        ]
    },
    {
        fakeId: 'fake5',
        fakeTitle: 'Database optimization',
        fakeDescription: 'Improve query performance for reporting',
        fakeCategory: 'Technical Task',
        fakePriority: 'high',
        fakeStatus: 'awaitFeedback',
        fakeDuedate: new Date('2023-12-05'),
        fakeAssignees: ['fakeUser7'],
        fakeSubtasks: [
            { fakeTitle: 'Identify slow queries', fakeCompleted: true },
            { fakeTitle: 'Implement indexes', fakeCompleted: true },
            { fakeTitle: 'Test performance', fakeCompleted: false }
        ]
    },
    {
        fakeId: 'fake6',
        fakeTitle: 'Write documentation',
        fakeDescription: 'Document the new authentication flow',
        fakeCategory: 'User Story',
        fakePriority: 'low',
        fakeStatus: 'done',
        fakeDuedate: new Date('2023-11-30'),
        fakeAssignees: ['fakeUser8'],
        fakeSubtasks: [
            { fakeTitle: 'Outline structure', fakeCompleted: true },
            { fakeTitle: 'Write content', fakeCompleted: true },
            { fakeTitle: 'Review with team', fakeCompleted: true }
        ]
    },
    {
        fakeId: 'fake7',
        fakeTitle: 'Plan team offsite',
        fakeDescription: 'Organize quarterly team building event',
        fakeCategory: 'User Story',
        fakePriority: 'medium',
        fakeStatus: 'todo',
        fakeDuedate: new Date('2024-01-15'),
        fakeAssignees: ['fakeUser2', 'fakeUser4'],
        fakeSubtasks: [
            { fakeTitle: 'Research venues', fakeCompleted: false },
            { fakeTitle: 'Create budget', fakeCompleted: false }
        ]
    },
    {
        fakeId: 'fake8',
        fakeTitle: 'Customer feedback analysis',
        fakeDescription: 'Analyze recent survey results',
        fakeCategory: 'Technical Task',
        fakePriority: 'high',
        fakeStatus: 'inProgress',
        fakeDuedate: new Date('2023-12-12'),
        fakeAssignees: ['fakeUser3', 'fakeUser5'],
        fakeSubtasks: [
            { fakeTitle: 'Collect survey data', fakeCompleted: true },
            { fakeTitle: 'Create visualizations', fakeCompleted: false }
        ]
    },
    {
        fakeId: 'fake9',
        fakeTitle: 'Update privacy policy',
        fakeDescription: 'Revise documents for GDPR compliance',
        fakeCategory: 'Technical Task',
        fakePriority: 'medium',
        fakeStatus: 'awaitFeedback',
        fakeDuedate: new Date('2023-12-08'),
        fakeAssignees: ['fakeUser1', 'fakeUser7'],
        fakeSubtasks: [
            { fakeTitle: 'Review current policy', fakeCompleted: true },
            { fakeTitle: 'Make revisions', fakeCompleted: true },
            { fakeTitle: 'Get legal approval', fakeCompleted: false }
        ]
    }
];


export const FAKE_CONTACTS = [
    { fakeId: 'fakeUser1', fakeName: 'John Doe' },
    { fakeId: 'fakeUser2', fakeName: 'Jane Smith' },
    { fakeId: 'fakeUser3', fakeName: 'Mike Johnson' },
    { fakeId: 'fakeUser4', fakeName: 'Emily Davis' },
    { fakeId: 'fakeUser5', fakeName: 'Chris Brown' },
    { fakeId: 'fakeUser6', fakeName: 'Sarah Wilson' },
    { fakeId: 'fakeUser7', fakeName: 'David Lee' },
    { fakeId: 'fakeUser8', fakeName: 'Laura Taylor' },

];