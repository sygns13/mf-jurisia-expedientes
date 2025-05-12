import { Component, NgModule, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatorModule } from 'primeng/paginator';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule  } from 'primeng/select';
import { TableModule } from 'primeng/table';

import { MessageService, ToastMessageOptions } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ConsultagptService } from 'src/app/services/consultagpt.service';
import { IRequest, GptResponse, GptHistoryItem, HistoryResponse } from 'src/app/interfaces/consultagpt';
import { marked } from 'marked';

const environment = (window as any).__env as any;

interface ChatMessage {
  content: string;
  isUser: boolean;
};


@Component({
  selector: 'app-expedientes',
  imports: [CommonModule, SelectModule , TableModule, InputTextModule, FluidModule, ButtonModule, FormsModule, TextareaModule, MessageModule, ToastModule, PanelMenuModule, PaginatorModule],
  providers: [MessageService],
  templateUrl: './expedientes.component.html',
  styleUrl: './expedientes.component.scss'
})
export class ExpedientesComponent {

  private env = environment;

  sedes: any[] = [];
  sedeSeleccionada: any = null;
  instancias: any[] = [];
  instanciaSeleccionada: any = null;
  especialidades: any[] = [];
  especialidadSeleccionada: any = null;
  numeroExpediente: number | null = null;
  anioExpediente: number | null = null;
  expedientes: any[] = [];

  constructor(
    private service: MessageService,
    private consultagptService: ConsultagptService) {

    console.log('Environment from Microfront:');
    console.log(this.env);
  }

  ngOnInit() {
    //this.loadConversationHistory();
  }

  ngAfterViewChecked() {
    //this.scrollToBottom();
  }

  buscarExpedientes() {

  }

}
