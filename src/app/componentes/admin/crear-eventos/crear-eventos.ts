import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear-eventos',
  imports: [FormsModule],
  templateUrl: './crear-eventos.html',
  styleUrl: './crear-eventos.css',
})
export class CrearEventos {
  title = '';
  description = '';
  type = 'Limpieza';
  date = '';
  time = '';
  location = '';
  latitude = '';
  longitude = '';
  organizer = '';
  image = '';
  requirementsText = '';
  maxVolunteers = 30;

  constructor(private adminService: AdminService, private router: Router) { }

  submit(): void {
    this.adminService.createEvent({
      title: this.title,
      description: this.description,
      type: this.type,
      date: this.date,
      time: this.time,
      location: this.location,
      latitude: Number(this.latitude),
      longitude: Number(this.longitude),
      organizer: this.organizer,
      image: this.image,
      requirements: this.requirementsText.split('\n').filter(Boolean),
      maxVolunteers: Number(this.maxVolunteers)
    });

    this.router.navigate(['/admin/events']);
  }
}
