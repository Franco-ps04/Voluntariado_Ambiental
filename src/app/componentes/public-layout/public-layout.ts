import { Component } from '@angular/core';
import { Menu } from "../menu/menu";
import { Footer } from "../footer/footer";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  imports: [Menu, Footer, RouterOutlet],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayout {

}
