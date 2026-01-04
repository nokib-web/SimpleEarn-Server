import { getCollection } from './db.js';

export const Users = () => getCollection('users');
export const Tasks = () => getCollection('tasks');
export const Submissions = () => getCollection('submissions');
export const Withdrawals = () => getCollection('withdrawals');
export const Payments = () => getCollection('payments');
export const Notifications = () => getCollection('notifications');
