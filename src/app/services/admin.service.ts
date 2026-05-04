import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AdminEvento } from '../models/admin_evento';
import { AdminInscription } from '../models/admin_inscripciones';
import { AdminNotification } from '../models/admin_notificacion';
import { ADMIN_EVENTS_MOCK } from '../mocks/admin_evento_mock';
import { ADMIN_INSCRIPTIONS_MOCK } from '../mocks/admin_inscripcion_mock';
import { ADMIN_NOTIFICATIONS_MOCK } from '../mocks/admin_notificacion_mock';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private eventsSubject = new BehaviorSubject<AdminEvento[]>(ADMIN_EVENTS_MOCK);
  private inscriptionsSubject = new BehaviorSubject<AdminInscription[]>(ADMIN_INSCRIPTIONS_MOCK);
  private notificationsSubject = new BehaviorSubject<AdminNotification[]>(ADMIN_NOTIFICATIONS_MOCK);

  getEvents(): Observable<AdminEvento[]> {
    return this.eventsSubject.asObservable();
  }

  getEventById(id: number): Observable<AdminEvento | undefined> {
    return of(this.eventsSubject.value.find(e => e.id === id));
  }

  createEvent(event: Omit<AdminEvento, 'id' | 'registered' | 'status'>): void {
    const next: AdminEvento = {
      ...event,
      id: Date.now(),
      registered: 0,
      status: 'Próximo'
    };
    this.eventsSubject.next([next, ...this.eventsSubject.value]);
  }

  updateEvent(updated: AdminEvento): void {
    this.eventsSubject.next(
      this.eventsSubject.value.map(e => e.id === updated.id ? updated : e)
    );
  }

  deleteEvent(id: number): void {
    this.eventsSubject.next(this.eventsSubject.value.filter(e => e.id !== id));
    this.inscriptionsSubject.next(this.inscriptionsSubject.value.filter(i => i.eventId !== id));
  }

  getInscriptions(): Observable<AdminInscription[]> {
    return this.inscriptionsSubject.asObservable();
  }

  getInscriptionsByEvent(eventId: number): Observable<AdminInscription[]> {
    return of(this.inscriptionsSubject.value.filter(i => i.eventId === eventId));
  }

  getNotifications(): Observable<AdminNotification[]> {
    return this.notificationsSubject.asObservable();
  }

  createNotification(notification: Omit<AdminNotification, 'id' | 'createdAt'>): void {
    const next: AdminNotification = {
      ...notification,
      id: Date.now(),
      createdAt: new Date().toLocaleString('es-PE')
    };
    this.notificationsSubject.next([next, ...this.notificationsSubject.value]);
  }

  getStats() {
    const events = this.eventsSubject.value;
    const inscriptions = this.inscriptionsSubject.value;

    return {
      totalEvents: events.length,
      upcomingEvents: events.filter(e => e.status === 'Próximo').length,
      totalInscriptions: inscriptions.length,
      types: {
        Limpieza: events.filter(e => e.type === 'Limpieza').length,
        Reforestación: events.filter(e => e.type === 'Reforestación').length,
        Reciclaje: events.filter(e => e.type === 'Reciclaje').length,
        Taller: events.filter(e => e.type === 'Taller').length
      }
    };
  }
}
