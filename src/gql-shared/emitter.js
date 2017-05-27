/* @flow */
import { EventEmitter } from 'fbemitter';
export type EmitterSubscription = { remove: () => void };
export default EventEmitter;
