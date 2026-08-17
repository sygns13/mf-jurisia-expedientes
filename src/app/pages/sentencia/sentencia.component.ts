import { Component, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PaginatorModule } from 'primeng/paginator';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { DatePickerModule } from 'primeng/datepicker';

import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { Sede, Instancia, Especialidad, Expediente, BusquedaExpediente, ExpedienteCalificar, DemandaCalificada, DocumentoDigital } from 'src/app/interfaces/expedientes';
import { TipodocumentoService } from 'src/app/services/tipodocumento.service';
import { DocumentoService } from 'src/app/services/documento.service';
import { SoloNumerosEnterosDirective } from '../directives/solo-numeros-enteros.directive';
import { Dropdown } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TipoDocumento } from 'src/app/interfaces/tipodocumento';
import { Documento } from 'src/app/interfaces/documento';

const environment = (window as any).__env as any;

// Datos de presentación de un documento, compartidos por el modal visor y el de selección.
interface DocumentoVista {
  id: number;
  nombre: string;
  actoProcesal: string;
  sumilla: string;
  fechaRegistro: string;
  doc: DocumentoDigital;
}

// Documento seleccionable dentro del modal de sentencia (Resoluciones / Digitalizados).
interface DocumentoSentencia extends DocumentoVista {
  seleccionado: boolean;
}

@Component({
  selector: 'app-sentencia',
  imports: [CommonModule, SelectModule, TableModule, InputTextModule, FluidModule, ButtonModule, FormsModule, TextareaModule, MessageModule, ToastModule, PanelMenuModule, PaginatorModule, SoloNumerosEnterosDirective, TooltipModule, DialogModule, CheckboxModule, ProgressBarModule, DatePickerModule],
  providers: [MessageService],
  templateUrl: './sentencia.component.html',
  styleUrl: './sentencia.component.scss'
})
export class SentenciaComponent {

  private env = environment;

  @ViewChild('cbuSede', { static: false }) cbuSede!: Dropdown;
  @ViewChild('cbuInstancia', { static: false }) cbuInstancia!: Dropdown;
  @ViewChild('cbuEspecialidad', { static: false }) cbuEspecialidad!: Dropdown;
  @ViewChild('inputNumeroExp', { static: false }) inputNumeroExp!: ElementRef;
  @ViewChild('inputAnio', { static: false }) inputAnio!: ElementRef;
  @ViewChild('contenidoContainer') contenidoContainer!: ElementRef;
  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  sedes: Sede[] = [];
  sedeSeleccionada: string | null = null;
  instancias: Instancia[] = [];
  instanciasFiltradas: Instancia[] = [];
  instanciaSeleccionada: string | null = null;
  especialidadesFiltradas: Especialidad[] = [];
  especialidades: Especialidad[] = [];
  especialidadSeleccionada: string | null = null;
  numeroExpediente: number | null = null;
  anioExpediente: number | null = null;

  tipoDocumentosFiltrados: TipoDocumento[] = [];
  tipoDocumentos: TipoDocumento[] = [];
  tipoDocumentoSeleccionado: number | null = null;
  isTyping: boolean = false;
  botonLoader: boolean = false;
  isTypingWord: boolean = false;
  loaderMessage: string = '';
  nunico: number = 0;
  numIncidente: string = '0';

  documentosFiltrados: Documento[] = [];
  documentos: Documento[] = [];
  documentoSeleccionado: number | null = null;

  buscarExpediente: BusquedaExpediente | null = null;
  expedientes: ExpedienteCalificar[] = [];

  displayGenerarDocumentos: boolean = false;

  displayFiltroExpedientes: boolean = false;

  displaySeleccionDocumentos: boolean = false;
  documentosResoluciones: DocumentoSentencia[] = [];
  documentosDigitalizados: DocumentoSentencia[] = [];
  cargandoDocumentosSeleccion: boolean = false;

  // Modal de lista de documentos (visor) que abren los botones Resoluciones / Digitalizados de la tabla.
  displayListaDocumentos: boolean = false;
  tituloListaDocumentos: string = '';
  documentosVisor: DocumentoVista[] = [];
  cargandoDocumentosVisor: boolean = false;
  expedienteDocActual: any = null;

  displaySentenciarDemanda: boolean = false;
  expedienteSeleccionado: any = null;
  progresoSentencia: number = 0;
  cargandoSentencia: boolean = false;
  docxBlob: Blob | null = null;
  private progresoInterval: ReturnType<typeof setInterval> | null = null;
  private sentenciaSubscription: Subscription | null = null;

  contenidoHTML: string = '';
  contenidoHTMLAnimado: string = '';
  mostrarDialogoPreview: boolean = false;
  velocidadEscritura: number = 2;

  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;
  filtroNroExpediente: string = '';
  filtroAnio: string = '';
  demandasSentenciadas: DemandaCalificada[] = [];
  totalDemandasSentenciadas: number = 0;
  pageDemandasSentenciadas: number = 0;
  sizeDemandasSentenciadas: number = 10;

  mostrarDetalle: boolean = false;
  demandasDetalle: DemandaCalificada[] = [];
  cargandoDetalle: boolean = false;
  expedienteDetalleInfo: DemandaCalificada | null = null;

  modalPdfVisible: boolean = false;
  pdfSafeUrl: SafeResourceUrl | null = null;
  pdfNombreActual: string = '';
  pdfUrlActual: string = '';
  cargandoPdf: boolean = false;
  private pdfObjectUrl: string | null = null;

  faseAnimacion: number = 0; // 0=idle, 1=subiendo nube, 2=analizando IA
  private faseTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private service: MessageService,
    private documentoService: DocumentoService,
    private tipodocumentoService: TipodocumentoService,
    private expedientesService: ExpedientesService,
    private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
    this.loadSedes();
    this.loadInstancias();
    this.loadEspecialidades();
    this.loadTipoDocumentos();
    this.loadDocumentos();

    const hoy = new Date();
    this.filtroFechaFin = hoy;
    this.filtroFechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.listarDemandasSentenciadas();
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

  buscarExpedientes() {
    if (!this.validarBusquedaExpedientes()) {
      return;
    }

    this.displayFiltroExpedientes = false;

    const body: Partial<BusquedaExpediente> = {
      sede: this.sedeSeleccionada ?? '',
      instancia: this.instanciaSeleccionada ?? '',
      especialidad: this.especialidadSeleccionada ?? '',
      numero: this.numeroExpediente ?? 0,
      anio: this.anioExpediente ?? 0
    };

    this.isTyping = true;
    this.loaderMessage = 'Buscando el expediente...';

    this.expedientesService.consultaCabExpedientesSentenciar(body).subscribe({
      next: (expedientes: ExpedienteCalificar[]) => {
        this.expedientes = expedientes;
        this.isTyping = false;
        this.loaderMessage = '';
        if (expedientes.length <= 0) {
          this.service.add({ severity: 'info', summary: 'Info', detail: 'No se encontró el expediente con los criterios de búsqueda ingresados' });
        }
      },
      error: (err) => {
        this.isTyping = false;
        this.loaderMessage = '';
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo buscar el expediente. Consulte al Administrador del Sistema' });
        console.error('Error al buscar expedientes', err);
      }
    });
  }

  validarBusquedaExpedientes(): boolean {
    if (this.sedeSeleccionada == null) {
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una Sede' });
      return false;
    }

    if (this.instanciaSeleccionada == null) {
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una Instancia' });
      return false;
    }

    if (this.especialidadSeleccionada == null) {
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una Especialidad' });
      return false;
    }

    if (this.numeroExpediente == null || this.numeroExpediente < 0) {
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Ingrese un número de expediente válido' });
      return false;
    }

    if (this.anioExpediente == null || this.anioExpediente < 1900) {
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Ingrese un año válido mayor a 1900' });
      return false;
    }

    return true;
  }

  loadSedes() {
    this.expedientesService.getSedes().subscribe({
      next: (response: Sede[]) => {
        this.sedes = response;
        if (this.sedes.length > 0) {
          this.sedeSeleccionada = this.sedes[0].codigoSede;
          this.expedientesService.getInstancias().subscribe({
            next: (response: Instancia[]) => {
              this.instancias = response;
              this.onSedeChange({ value: this.sedeSeleccionada });
            },
            error: (err) => {
              console.error('Error al cargar instancias', err);
            }
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar sedes', err);
      }
    });
  }

  loadInstancias() {
    this.expedientesService.getInstancias().subscribe({
      next: (response: Instancia[]) => {
        this.instancias = response;
      },
      error: (err) => {
        console.error('Error al cargar instancias', err);
      }
    });
  }

  loadEspecialidades() {
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
    this.instanciaSeleccionada = null;
    this.especialidadesFiltradas = [];
    if (this.sedeSeleccionada) {
      this.instanciasFiltradas = this.instancias.filter(instancia => instancia.codigoSede === this.sedeSeleccionada);
    } else {
      this.instanciasFiltradas = [];
    }
  }

  onInstanciaChange(event: any) {
    this.especialidadSeleccionada = null;
    if (this.instanciaSeleccionada) {
      this.especialidadesFiltradas = this.especialidades.filter(especialidad => especialidad.codigoInstancia === this.instanciaSeleccionada);
    } else {
      this.especialidadesFiltradas = [];
    }
  }

  actionExpediente(expediente: Expediente) {
    this.tipoDocumentoLoad(expediente);
    this.displayGenerarDocumentos = true;
  }

  closeAntes() {
    this.displayGenerarDocumentos = false;
  }

  private getNunicoExpediente(expediente: any): number {
    return expediente?.nunico ?? expediente?.nUnico;
  }

  private getNincidenteExpediente(expediente: any): string {
    const inc = expediente?.nincidente ?? expediente?.nIncidente;
    return inc != null && String(inc).trim() !== '' ? String(inc) : '0';
  }

  // Botón "Resoluciones": lista los documentos generados por el juzgado (l_tipo_doc = 'R').
  verResoluciones(expediente: any) {
    this.abrirListaDocumentos(expediente, 'Resoluciones');
  }

  // Botón "Digitalizados": lista los documentos presentados por las partes (l_tipo_doc IN ('EXP','ESC')).
  verDigitalizados(expediente: any) {
    this.abrirListaDocumentos(expediente, 'Digitalizados');
  }

  // Abre el modal con la lista de PDFs (Resoluciones o Digitalizados) del expediente.
  private abrirListaDocumentos(expediente: any, tipo: 'Resoluciones' | 'Digitalizados') {
    this.expedienteDocActual = expediente;
    this.tituloListaDocumentos = tipo;
    this.documentosVisor = [];
    this.cargandoDocumentosVisor = true;
    this.displayListaDocumentos = true;

    const nUnico = this.getNunicoExpediente(expediente);
    const nIncidente = this.getNincidenteExpediente(expediente);

    const peticion = tipo === 'Resoluciones'
      ? this.expedientesService.listarResolucionesExpediente(nUnico, nIncidente)
      : this.expedientesService.listarDigitalizadosExpediente(nUnico, nIncidente);

    peticion.subscribe({
      next: (docs: DocumentoDigital[]) => {
        this.cargandoDocumentosVisor = false;
        this.documentosVisor = this.mapearDocumentosVista(docs);
        if (this.documentosVisor.length === 0) {
          this.service.add({ severity: 'info', summary: tipo, detail: `El expediente no tiene documentos de ${tipo}.` });
        }
      },
      error: () => {
        this.cargandoDocumentosVisor = false;
        this.displayListaDocumentos = false;
        this.service.add({ severity: 'error', summary: 'Error', detail: `No se pudo obtener los documentos de ${tipo}. Consulte al Administrador del Sistema.` });
      }
    });
  }

  cerrarListaDocumentos() {
    this.displayListaDocumentos = false;
    this.documentosVisor = [];
    this.expedienteDocActual = null;
  }

  // Abre el modal de selección de documentos (Resoluciones / Digitalizados)
  // que se considerarán para redactar la sentencia. Carga los documentos reales
  // del expediente desde el backend.
  abrirSeleccionDocumentos(expediente: any) {
    this.expedienteSeleccionado = expediente;
    this.documentosResoluciones = [];
    this.documentosDigitalizados = [];
    this.cargandoDocumentosSeleccion = true;
    this.displaySeleccionDocumentos = true;

    const nUnico = this.getNunicoExpediente(expediente);
    const nIncidente = this.getNincidenteExpediente(expediente);

    forkJoin({
      resoluciones: this.expedientesService.listarResolucionesExpediente(nUnico, nIncidente),
      digitalizados: this.expedientesService.listarDigitalizadosExpediente(nUnico, nIncidente)
    }).subscribe({
      next: ({ resoluciones, digitalizados }) => {
        this.cargandoDocumentosSeleccion = false;
        this.documentosResoluciones = this.mapearDocumentosSentencia(resoluciones);
        this.documentosDigitalizados = this.mapearDocumentosSentencia(digitalizados);
      },
      error: () => {
        this.cargandoDocumentosSeleccion = false;
        this.displaySeleccionDocumentos = false;
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los documentos del expediente. Consulte al Administrador del Sistema.' });
      }
    });
  }

  // Mapea los documentos digitales del backend a la estructura seleccionable del modal.
  // Por defecto todos quedan marcados para ser considerados en la sentencia.
  private mapearDocumentosSentencia(docs: DocumentoDigital[]): DocumentoSentencia[] {
    return this.mapearDocumentosVista(docs).map(item => ({ ...item, seleccionado: true }));
  }

  // Normaliza los datos que ambos modales muestran de cada documento.
  private mapearDocumentosVista(docs: DocumentoDigital[]): DocumentoVista[] {
    return (docs ?? []).map((doc, index) => ({
      id: index + 1,
      nombre: doc.xnombreArchivo,
      // El backend devuelve cadena vacía cuando el tipo de documento no aplica.
      actoProcesal: (doc.actoProcesal ?? '').trim(),
      sumilla: (doc.sumilla ?? '').trim(),
      fechaRegistro: this.formatearFechaRegistro(doc.fRegistro),
      doc
    }));
  }

  // f_registro llega como texto desde el backend; se muestra solo dd/MM/yyyy.
  private formatearFechaRegistro(fRegistro?: string): string {
    if (!fRegistro) {
      return '';
    }
    const fecha = new Date(fRegistro.replace(' ', 'T'));
    if (isNaN(fecha.getTime())) {
      return fRegistro;
    }
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${fecha.getFullYear()}`;
  }

  todosResolucionesSeleccionados(): boolean {
    return this.documentosResoluciones.length > 0 && this.documentosResoluciones.every(d => d.seleccionado);
  }

  setTodosResoluciones(valor: boolean) {
    this.documentosResoluciones.forEach(d => (d.seleccionado = valor));
  }

  todosDigitalizadosSeleccionados(): boolean {
    return this.documentosDigitalizados.length > 0 && this.documentosDigitalizados.every(d => d.seleccionado);
  }

  setTodosDigitalizados(valor: boolean) {
    this.documentosDigitalizados.forEach(d => (d.seleccionado = valor));
  }

  totalDocumentosSeleccionados(): number {
    return (
      this.documentosResoluciones.filter(d => d.seleccionado).length +
      this.documentosDigitalizados.filter(d => d.seleccionado).length
    );
  }

  // Permite visualizar el PDF de un documento desde los modales de selección y visor.
  verPdfDocumentoSentencia(item: DocumentoVista) {
    if (item?.doc) {
      this.verPdf(item.doc, item.doc.xnombreArchivo);
    }
  }

  cerrarSeleccionDocumentos() {
    this.displaySeleccionDocumentos = false;
  }

  // Confirma la selección de documentos e inicia el proceso de sentencia.
  confirmarSeleccionYSentenciar() {
    if (this.totalDocumentosSeleccionados() === 0) {
      this.service.add({ severity: 'info', summary: 'Info', detail: 'Debe seleccionar al menos un documento para generar la sentencia.' });
      return;
    }
    this.displaySeleccionDocumentos = false;
    this.iniciarSentencia();
  }

  iniciarSentencia() {
    const expediente = this.expedienteSeleccionado;
    this.progresoSentencia = 0;
    this.cargandoSentencia = true;
    this.docxBlob = null;
    this.displaySentenciarDemanda = true;
    this.iniciarProgreso();
    this.faseAnimacion = 1;
    this.faseTimeout = setTimeout(() => {
      if (this.cargandoSentencia) this.faseAnimacion = 2;
    }, 30000);

    // Documentos marcados en el modal (Resoluciones + Digitalizados).
    const seleccionados = [
      ...this.documentosResoluciones.filter(d => d.seleccionado),
      ...this.documentosDigitalizados.filter(d => d.seleccionado)
    ];

    const body = {
      ...expediente,
      // Cada entrada de "archivos" es la ruta FTP COMPLETA del documento seleccionado
      // (ftp://usuario:clave@ip/ruta/archivo.pdf). Se envía así porque Resoluciones (SINOE)
      // y Digitalizados (ncpp) NO comparten una raíz FTP común (distinto host/carpeta por doc).
      archivos: seleccionados.map(d => d.doc.rutaCompleta),
      xnombreArchivo: null
    };

    this.sentenciaSubscription = this.expedientesService.generarSentenciaDocx(body).subscribe({
      next: (blob: Blob) => {
        this.detenerProgreso();
        this.progresoSentencia = 100;
        this.cargandoSentencia = false;
        this.docxBlob = blob;
        this.listarDemandasSentenciadas();
      },
      error: (err: any) => {
        this.detenerProgreso();
        this.cargandoSentencia = false;
        this.displaySentenciarDemanda = false;
        this.mostrarErrorSentencia(err);
      }
    });
  }

  private mostrarErrorSentencia(err: any) {
    const textoBase = 'No se pudo generar la sentencia. Consulte al Administrador del Sistema.';
    const mostrar = (mensaje?: string) => {
      const detail = mensaje ? `${textoBase}\n${mensaje}` : textoBase;
      this.service.add({ severity: 'error', summary: 'Error', detail });
    };

    const cuerpo = err?.error;
    // El endpoint responde con responseType 'blob', por lo que el JSON de error
    // viene envuelto en un Blob y hay que leerlo como texto antes de parsearlo.
    if (cuerpo instanceof Blob) {
      cuerpo.text()
        .then((texto) => {
          try {
            mostrar(JSON.parse(texto)?.mensaje);
          } catch {
            mostrar();
          }
        })
        .catch(() => mostrar());
    } else {
      mostrar(cuerpo?.mensaje);
    }
  }

  private iniciarProgreso() {
    const duracionMs = 70000;
    const tope = 98;
    const startTime = Date.now();

    this.progresoInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duracionMs) {
        this.progresoSentencia = tope;
        return;
      }
      const esperado = (elapsed / duracionMs) * tope;
      const conVariacion = esperado + (Math.random() * 2 - 1); // variación ±1%
      this.progresoSentencia = Math.floor(
        Math.min(tope, Math.max(this.progresoSentencia, conVariacion))
      );
    }, 600);
  }

  private detenerProgreso() {
    if (this.progresoInterval) {
      clearInterval(this.progresoInterval);
      this.progresoInterval = null;
    }
    this.faseAnimacion = 0;
    if (this.faseTimeout) {
      clearTimeout(this.faseTimeout);
      this.faseTimeout = null;
    }
  }

  cancelarSentenciarDemanda() {
    if (this.sentenciaSubscription) {
      this.sentenciaSubscription.unsubscribe();
      this.sentenciaSubscription = null;
    }
    this.displaySentenciarDemanda = false;
  }

  cerrarSentenciarDemanda() {
    this.detenerProgreso();
    if (this.sentenciaSubscription) {
      this.sentenciaSubscription.unsubscribe();
      this.sentenciaSubscription = null;
    }
    this.docxBlob = null;
    this.progresoSentencia = 0;
    this.cargandoSentencia = false;
    this.faseAnimacion = 0;
    this.expedienteSeleccionado = null;
  }

  descargarDemandaSentenciada() {
    if (!this.docxBlob || !this.expedienteSeleccionado) return;
    const url = window.URL.createObjectURL(this.docxBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Demanda-Sentenciada-${this.expedienteSeleccionado.xformato ?? 'expediente'}.docx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  loadTipoDocumentos() {
    this.tipodocumentoService.getTipoDocumentos().subscribe({
      next: (response: TipoDocumento[]) => {
        this.tipoDocumentos = response;
      },
      error: (err) => {
        console.error('Error al cargar tipo de documentos', err);
      }
    });
  }

  loadDocumentos() {
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
    this.documentoSeleccionado = null;
    this.tipoDocumentoSeleccionado = null;
    this.documentosFiltrados = [];
    this.nunico = expediente.nunico;
    this.numIncidente = expediente.numIncidente;
    if (expediente) {
      this.tipoDocumentosFiltrados = this.tipoDocumentos.filter(tipoDocumentos => tipoDocumentos.idInstancia === expediente.codigoInstancia);
    } else {
      this.tipoDocumentosFiltrados = [];
    }
  }

  onTipoDocumentoChange(event: any) {
    this.documentoSeleccionado = null;
    if (this.tipoDocumentoSeleccionado) {
      this.documentosFiltrados = this.documentos.filter(documentos => documentos.idTipoDocumento === this.tipoDocumentoSeleccionado);
    } else {
      this.documentosFiltrados = [];
    }
  }

  descargarDocumento() {
    const documento = this.documentos.find(d => d.idDocumento === this.documentoSeleccionado);
    const codigoTemplate = documento?.codigoTemplate;
    const nameDoc = documento?.descripcion;
    if (!codigoTemplate || !this.nunico || !this.numIncidente) return;

    this.documentoService.descargarDocx(this.nunico, this.numIncidente, codigoTemplate, documento.idDocumento).subscribe({
      next: (response: Blob) => {
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nameDoc + '-' + this.nunico + '.docx';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el documento.' });
      }
    });
  }

  cerrarLoader() {
    this.botonLoader = false;
    this.isTyping = false;
    this.loaderMessage = '';
  }

  generarDocumento() {
    if (!this.tipoDocumentoSeleccionado || !this.documentoSeleccionado) {
      this.service.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Debe seleccionar el tipo de documento y el documento antes de generar.'
      });
      return;
    }

    const documento = this.documentos.find(d => d.idDocumento === this.documentoSeleccionado);
    const codigoTemplate = documento?.codigoTemplate;

    if (!documento || !codigoTemplate) {
      this.service.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el documento o el template.' });
      return;
    }

    this.isTyping = true;
    this.documentoService.getDocumentoGenerado(this.nunico, this.numIncidente, codigoTemplate, documento.idDocumento).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.isTyping = false;
          this.contenidoHTML = resp.contentHTML;
          this.contenidoHTMLAnimado = '';
          this.isTypingWord = false;
          this.mostrarDialogoPreview = true;
          setTimeout(() => {
            this.simularEscritura(this.contenidoHTML);
          }, 500);
        } else {
          this.service.add({ severity: 'warn', summary: 'Advertencia', detail: 'El documento no se generó correctamente.' });
        }
      },
      error: () => {
        this.service.add({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el documento.' });
      }
    });
  }

  simularEscritura(html: string) {
    this.isTypingWord = true;
    this.contenidoHTMLAnimado = '';
    let i = 0;

    const velocidadPorCaracter = this.velocidadEscritura;
    const total = html.length;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const elapsed = time - lastTime;

      if (elapsed >= velocidadPorCaracter) {
        const nextChunk = Math.floor(elapsed / velocidadPorCaracter);
        for (let j = 0; j < nextChunk && i < total; j++, i++) {
          this.contenidoHTMLAnimado += html.charAt(i);
        }
        lastTime = time;
        if (i > 200) {
          this.conditionalScroll();
        }
      }

      if (i < total) {
        requestAnimationFrame(loop);
      } else {
        this.isTypingWord = false;
        this.addFullDocumentClass();
        setTimeout(() => this.scrollPreviewBottom(), 500);
      }
    };

    this.forceScrollToTop();
    requestAnimationFrame(loop);
  }

  forceScrollToTop() {
    const resetScroll = () => {
      if (this.scrollContainer && this.scrollContainer.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = 0;
      }
    };
    resetScroll();
    setTimeout(resetScroll, 10);
    setTimeout(resetScroll, 50);
    setTimeout(resetScroll, 100);
  }

  conditionalScroll() {
    if (!this.scrollContainer?.nativeElement) return;

    const scrollElement = this.scrollContainer.nativeElement;
    const containerHeight = scrollElement.clientHeight;
    const contentHeight = scrollElement.scrollHeight;
    const currentScroll = scrollElement.scrollTop;

    if (contentHeight > containerHeight) {
      const distanceFromBottom = contentHeight - (currentScroll + containerHeight);
      if (distanceFromBottom < 200) {
        scrollElement.scrollTo({
          top: contentHeight - containerHeight + 50,
          behavior: 'smooth'
        });
      }
    }
  }

  addFullDocumentClass() {
    setTimeout(() => {
      if (this.contenidoContainer?.nativeElement) {
        this.contenidoContainer.nativeElement.classList.add('full-document');
      }
    }, 100);
  }

  scrollPreviewBottom() {
    if (!this.scrollContainer?.nativeElement) return;
    const scrollElement = this.scrollContainer.nativeElement;
    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
      behavior: 'smooth'
    });
  }

  listarDemandasSentenciadas() {
    const body: any = {};
    if (this.filtroFechaInicio) body.fechaInicial = this.formatDate(this.filtroFechaInicio);
    if (this.filtroFechaFin) body.fechaFinal = this.formatDate(this.filtroFechaFin);
    if (this.filtroAnio) body.anio = this.filtroAnio;
    if (this.filtroNroExpediente) body.expNro = this.filtroNroExpediente;

    this.expedientesService.listarDemandasSentenciasAgrupadas(body, this.pageDemandasSentenciadas, this.sizeDemandasSentenciadas).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.demandasSentenciadas = resp.result.content;
          this.totalDemandasSentenciadas = resp.result.totalElements;
        }
      },
      error: () => {
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo listar los expedientes sentenciados.' });
      }
    });
  }

  verDetalle(nunico: number) {
    this.cargandoDetalle = true;
    this.mostrarDetalle = true;
    this.expedienteDetalleInfo = null;
    this.demandasDetalle = [];
    this.expedientesService.listarSentenciasPorNunico(nunico).subscribe({
      next: (resp) => {
        this.cargandoDetalle = false;
        if (resp.success) {
          this.demandasDetalle = resp.result;
          this.expedienteDetalleInfo = resp.result.length > 0 ? resp.result[0] : null;
        }
      },
      error: () => {
        this.cargandoDetalle = false;
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle de sentencias.' });
      }
    });
  }

  volverAlListado() {
    this.mostrarDetalle = false;
    this.demandasDetalle = [];
    this.expedienteDetalleInfo = null;
  }

  descargarSentenciaDetalle(id: number, xformato: string) {
    this.expedientesService.descargarSentenciaDocx(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Demanda-Sentenciada-${xformato}-${id}.docx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el documento.' });
      }
    });
  }

  onPageChangeDemandasSentenciadas(event: any) {
    this.pageDemandasSentenciadas = event.page;
    this.sizeDemandasSentenciadas = event.rows;
    this.listarDemandasSentenciadas();
  }

  getEtiquetaArchivo(archivos: string[], archivo: string): string {
    if (archivos.length === 1) return 'Demanda';
    const match = archivo.match(/-(\d+)\.pdf$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num === 1) return 'Demanda';
      const anexoNum = String(num - 1).padStart(2, '0');
      return `Anexo ${anexoNum}`;
    }
    const index = archivos.indexOf(archivo);
    return index === 0 ? 'Demanda' : `Anexo ${String(index).padStart(2, '0')}`;
  }

  verPdf(item: any, archivo: string) {
    this.pdfNombreActual = archivo;
    this.pdfSafeUrl = null;
    this.cargandoPdf = true;
    this.modalPdfVisible = true;

    this.expedientesService.obtenerPdfExpediente({
      xip: item.xip,
      cusuario: item.cusuario,
      cclave: item.cclave,
      xrutaArchivo: item.xrutaArchivo,
      xnombreArchivo: archivo
    }).subscribe({
      next: (blob: Blob) => {
        this.cargandoPdf = false;
        if (this.pdfObjectUrl) URL.revokeObjectURL(this.pdfObjectUrl);
        this.pdfObjectUrl = URL.createObjectURL(blob);
        this.pdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl);
      },
      error: () => {
        this.cargandoPdf = false;
        this.modalPdfVisible = false;
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el PDF. Consulte al Administrador del Sistema.' });
      }
    });
  }

  cerrarModalPdf() {
    this.modalPdfVisible = false;
    this.cargandoPdf = false;
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = null;
    }
    this.pdfSafeUrl = null;
    this.pdfUrlActual = '';
    this.pdfNombreActual = '';
  }

  abrirPdfEnNuevaPestana() {
    if (this.pdfObjectUrl) {
      window.open(this.pdfObjectUrl, '_blank');
    }
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  close() {
    this.displayGenerarDocumentos = false;
    this.mostrarDialogoPreview = false;
    this.contenidoHTMLAnimado = '';
    this.isTypingWord = false;
    if (this.contenidoContainer?.nativeElement) {
      this.contenidoContainer.nativeElement.classList.remove('full-document');
    }
  }
}
