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
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { Sede, Instancia, Especialidad, Expediente, BusquedaExpediente } from 'src/app/interfaces/expedientes';
import { TipodocumentoService } from 'src/app/services/tipodocumento.service';
import { DocumentoService } from 'src/app/services/documento.service';
import { marked } from 'marked';
import { SoloNumerosEnterosDirective } from '../directives/solo-numeros-enteros.directive';
import { Dropdown } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TipoDocumento } from 'src/app/interfaces/tipodocumento';
import { Documento } from 'src/app/interfaces/documento';

const environment = (window as any).__env as any;

interface ChatMessage {
  content: string;
  isUser: boolean;
};


@Component({
  selector: 'app-expedientes',
  imports: [CommonModule, SelectModule , TableModule, InputTextModule, FluidModule, ButtonModule, FormsModule, TextareaModule, MessageModule, ToastModule, PanelMenuModule, PaginatorModule, SoloNumerosEnterosDirective, TooltipModule, DialogModule],
  providers: [MessageService],
  templateUrl: './expedientes.component.html',
  styleUrl: './expedientes.component.scss'
})
export class ExpedientesComponent {

  private env = environment;

  @ViewChild('cbuSede', { static: false }) cbuSede!: Dropdown;
  @ViewChild('cbuInstancia', { static: false }) cbuInstancia!: Dropdown;
  @ViewChild('cbuEspecialidad', { static: false }) cbuEspecialidad!: Dropdown;
  @ViewChild('inputNumeroExp', { static: false }) inputNumeroExp!: ElementRef;
  @ViewChild('inputAnio', { static: false }) inputAnio!: ElementRef;

  sedes: Sede[] = [];
  sedeSeleccionada: string | null = null;
  instancias: Instancia[] = [];
  instanciasFiltradas: Instancia[] = []; // Lista de instancias filtradas por sede
  instanciaSeleccionada: string | null = null;
  especialidadesFiltradas: Especialidad[] = [];
  especialidades: Especialidad[] = [];
  especialidadSeleccionada: string | null = null;
  numeroExpediente: number | null = null;
  anioExpediente: number | null = null;

  tipoDocumentosFiltrados: TipoDocumento[] = [];
  tipoDocumentos: TipoDocumento[] = [];
  tipoDocumentoSeleccionado: number | null = null;

  documentosFiltrados: Documento[] = [];
  documentos: Documento[] = [];
  documentoSeleccionado: number | null = null;

  buscarExpediente: BusquedaExpediente | null = null
  expedientes: Expediente[] = [];

  displayGenerarDocumentos: boolean = false;

  /*
  tipoDocumentos : any[] = [
    {'code': '1', 'nombre': 'RESOLUCIÓN'},
    {'code': '2', 'nombre': 'OFICIO'}
  ];

  tipoDocumentoSeleccionado : any = null;

   tipoActoProcesales : any[] = [
    {'code': '1', 'nombre': 'AUTO IMPROCEDENTE'},
    {'code': '2', 'nombre': 'AUTO INADMISIBLE'},
    {'code': '3', 'nombre': 'DECRETO'},
    {'code': '4', 'nombre': 'SENTENCIA DE VISTA'},
    {'code': '5', 'nombre': 'SOBRESEIMIENTO'},
  ];

  tipoActoProcesalSeleccionado : any = null;

  */

  constructor(
    private service: MessageService,
    private documentoService: DocumentoService,
    private tipodocumentoService: TipodocumentoService,
    private expedientesService: ExpedientesService) {

    console.log('Environment from Microfront:');
    console.log(this.env);
  }

  ngOnInit() {
    this.loadSedes();
    this.loadInstancias();
    this.loadEspecialidades();
    this.loadTipoDocumentos();
    this.loadDocumentos();
  }

  setFocusCbuSede() {
    this.cbuSede.focus();
  }

  setFocusCbuInstancia() {
    this.cbuInstancia.focus();
  }

  setFocusNumeroExp() {
    this.inputNumeroExp.nativeElement.focus();
  }

  setFocusAnio() {
    this.inputAnio.nativeElement.focus();
  }

  setFocusCbuEspecialidad() {
    this.cbuEspecialidad.focus();
  }

  ngAfterViewChecked() {
    //this.scrollToBottom();
  }

  buscarExpedientes() {

    if(!this.validarBusquedaExpedientes()){
      return;
    }

    this.buscarExpediente = {} as BusquedaExpediente;

    this.buscarExpediente.sede = this.sedeSeleccionada ?? '';
    this.buscarExpediente.instancia = this.instanciaSeleccionada ?? '';
    this.buscarExpediente.especialidad = this.especialidadSeleccionada ?? '';
    this.buscarExpediente.numero = this.numeroExpediente ?? 0;
    this.buscarExpediente.anio = this.anioExpediente ?? 0;
    
    this.expedientesService.consultaCabExpedientes(this.buscarExpediente).subscribe({
      next: (expedientes: Expediente[]) => {
        this.expedientes = expedientes;

        if(expedientes.length <= 0){
          this.service.add({ severity: 'info', summary: 'Info', detail: 'No se encontraron expedientes con los criterios de búsqueda ingresados' });
        }
      },
      error: (err) => {
        // this.isTyping = false;
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo buscar expedientes. Consulte al Administrador del Sistema' });
        console.error('Error al cargar conversación previa', err);
      }
    });

  }

  validarBusquedaExpedientes() : boolean{
    if(this.sedeSeleccionada == null){
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Debe de seleccionar una Sede' });
      this.setFocusCbuSede();
      return false;
    }

    if(this.instanciaSeleccionada == null){
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Debe de seleccionar una Instancia' });
      this.setFocusCbuSede();
      return false;
    }

    if(this.especialidadSeleccionada == null){
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Debe de seleccionar una Especialidad' });
      this.setFocusCbuEspecialidad();
      return false;
    }

    if(this.numeroExpediente == null || this.numeroExpediente < 0){
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Ingrese un número de expediente válido' });
      this.setFocusNumeroExp();
      return false;
    }

    if(this.anioExpediente == null || this.anioExpediente < 1900){
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Ingrese un año válido mayor a 1900' });
      this.setFocusAnio();
      return false;
    }

    return true;
  }

  loadSedes(){
    this.expedientesService.getSedes().subscribe({
      next: (response: Sede[]) => {
        this.sedes = response;
      },
      error: (err) => {
        console.error('Error al cargar sedes', err);
      }
    });
  }

  loadInstancias(){
    this.expedientesService.getInstancias().subscribe({
      next: (response: Instancia[]) => {
        this.instancias = response;
      },
      error: (err) => {
        console.error('Error al cargar instancias', err);
      }
    });
  }

  loadEspecialidades(){
    this.expedientesService.getEspecialidades().subscribe({
      next: (response: Especialidad[]) => {
        this.especialidades = response;
      },
      error: (err) => {
        console.error('Error al cargar especialidades', err);
      }
    });
  }

  onSedeChange(event: any) {
    //this.sedeSeleccionada = event.value;
    this.instanciaSeleccionada = null; // Resetear la selección de instancia
    this.especialidadesFiltradas = []; // Limpiar Especialidades
    if (this.sedeSeleccionada) {
      this.instanciasFiltradas = this.instancias.filter(instancia => instancia.codigoSede === this.sedeSeleccionada);
    } else {
      this.instanciasFiltradas = []; // Si no hay sede seleccionada, no mostrar nada
    }
    console.log('Sede seleccionada:', this.sedeSeleccionada);
    console.log('Instancias filtradas:', this.instanciasFiltradas);
  }

  onInstanciaChange(event: any) {
    //this.instanciaSeleccionada = event.value;
    this.especialidadSeleccionada = null; // Resetear la selección de especialidad
    if (this.instanciaSeleccionada) {
      this.especialidadesFiltradas = this.especialidades.filter(especialidad => especialidad.codigoInstancia === this.instanciaSeleccionada);
    } else {
      this.especialidadesFiltradas = []; // Si no hay sede seleccionada, no mostrar nada
    }
    console.log('Instancia seleccionada:', this.instanciaSeleccionada);
    console.log('Especialidades filtradas:', this.especialidadesFiltradas);
  }

  actionExpediente(expediente: Expediente){
    console.log(expediente);
    this.tipoDocumentoLoad(expediente);
    this.displayGenerarDocumentos = true;
  }

  close() {
        this.displayGenerarDocumentos = false;
    }

    loadTipoDocumentos(){
    this.tipodocumentoService.getTipoDocumentos().subscribe({
      next: (response: TipoDocumento[]) => {
        this.tipoDocumentos = response;
      },
      error: (err) => {
        console.error('Error al cargar tipo de cumentos', err);
      }
    });
  }

  loadDocumentos(){
    this.documentoService.getDocumentos().subscribe({
      next: (response: Documento[]) => {
        this.documentos = response;
      },
      error: (err) => {
        console.error('Error al cargar documentos', err);
      }
    });
  }

  tipoDocumentoLoad(expediente: Expediente) {

    this.documentoSeleccionado = null; // Resetear la selección de Tipo Documento
    this.tipoDocumentoSeleccionado = null; // Resetear la selección de Documento
    this.documentosFiltrados = [];
    if (expediente) {
      this.tipoDocumentosFiltrados = this.tipoDocumentos.filter(tipoDocumentos => tipoDocumentos.idInstancia === expediente.codigoInstancia);
    } else {
      this.tipoDocumentosFiltrados = []; // Si no hay sede seleccionada, no mostrar nada
    }
  }

  onTipoDocumentoChange(event: any) {
    //this.instanciaSeleccionada = event.value;
    this.documentoSeleccionado = null; // Resetear la selección de especialidad
    if (this.tipoDocumentoSeleccionado) {
      this.documentosFiltrados = this.documentos.filter(documentos => documentos.idTipoDocumento === this.tipoDocumentoSeleccionado);
    } else {
      this.documentosFiltrados = []; // Si no hay sede seleccionada, no mostrar nada
    }
  }

}
