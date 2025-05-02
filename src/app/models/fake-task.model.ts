export interface FakeTask {
    fakeId: string;
    fakeTitle: string;
    fakeDescription: string;
    fakeCategory: string;
    fakePriority: 'low' | 'medium' | 'high';
    fakeStatus: 'todo' | 'inProgress' | 'awaitFeedback' | 'done';
    fakeDuedate: Date;
    fakeAssignees: string[];
    fakeSubtasks: {
        fakeTitle: string;
        fakeCompleted: boolean;
    }[];
}

export interface FakeContact {
    fakeId: string;
    fakeName: string;
}