import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { VolunteerEvent } from '../models/event';
import { MOCK_VOLUNTARIOS_EVENTO } from '../mocks/mock_eventos';

@Injectable({
  providedIn: 'root',
})
export class EventoService {
  private eventsSubject = new BehaviorSubject<VolunteerEvent[]>(MOCK_VOLUNTARIOS_EVENTO);

  getEvents(): Observable<VolunteerEvent[]> {
    return this.eventsSubject.asObservable();
  }

  getEventById(id: number): Observable<VolunteerEvent | undefined> {
    return of(this.eventsSubject.value.find(e => e.id === id));
  }
}

