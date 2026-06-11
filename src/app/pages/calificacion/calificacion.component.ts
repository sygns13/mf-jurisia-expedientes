import { Component, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
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
import { Sede, Instancia, Especialidad, Expediente, BusquedaExpediente, ExpedienteCalificar, DemandaCalificada } from 'src/app/interfaces/expedientes';
import { TipodocumentoService } from 'src/app/services/tipodocumento.service';
import { DocumentoService } from 'src/app/services/documento.service';
import { SoloNumerosEnterosDirective } from '../directives/solo-numeros-enteros.directive';
import { Dropdown } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TipoDocumento } from 'src/app/interfaces/tipodocumento';
import { Documento } from 'src/app/interfaces/documento';

const environment = (window as any).__env as any;

@Component({
  selector: 'app-calificacion',
  imports: [CommonModule, SelectModule, TableModule, InputTextModule, FluidModule, ButtonModule, FormsModule, TextareaModule, MessageModule, ToastModule, PanelMenuModule, PaginatorModule, SoloNumerosEnterosDirective, TooltipModule, DialogModule, ProgressBarModule, DatePickerModule],
  providers: [MessageService],
  templateUrl: './calificacion.component.html',
  styleUrl: './calificacion.component.scss'
})
export class CalificacionComponent {

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

  fechaInicioExpedientes: Date | null = null;
  fechaFinalExpedientes: Date | null = null;

  buscarExpediente: BusquedaExpediente | null = null;
  expedientes: ExpedienteCalificar[] = [];

  displayGenerarDocumentos: boolean = false;

  displayCalificarDemanda: boolean = false;
  expedienteSeleccionado: any = null;
  progresoCalificacion: number = 0;
  cargandoCalificacion: boolean = false;
  docxBlob: Blob | null = null;
  private progresoInterval: ReturnType<typeof setInterval> | null = null;
  private calificacionSubscription: Subscription | null = null;

  contenidoHTML: string = '';
  contenidoHTMLAnimado: string = '';
  mostrarDialogoPreview: boolean = false;
  velocidadEscritura: number = 2;

  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;
  filtroNroExpediente: string = '';
  filtroAnio: string = '';
  demandasCalificadas: DemandaCalificada[] = [];
  totalDemandasCalificadas: number = 0;
  pageDemandasCalificadas: number = 0;
  sizeDemandasCalificadas: number = 10;

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
    this.loadTipoDocumentos();
    this.loadDocumentos();

    const hoy = new Date();
    this.fechaInicioExpedientes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaFinalExpedientes = hoy;

    this.filtroFechaFin = hoy;
    this.filtroFechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.listarDemandasCalificadas();
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

    const body: Partial<BusquedaExpediente> = {};
    if (this.fechaInicioExpedientes) body.fechaInicio = this.formatDate(this.fechaInicioExpedientes);
    if (this.fechaFinalExpedientes) body.fechaFinal = this.formatDate(this.fechaFinalExpedientes);

    this.isTyping = true;
    this.loaderMessage = 'Buscando expedientes...';

    this.expedientesService.consultaCabExpedientesCalificar(body).subscribe({
      next: (expedientes: ExpedienteCalificar[]) => {
        this.expedientes = expedientes;
        this.isTyping = false;
        this.loaderMessage = '';
        if (expedientes.length <= 0) {
          this.service.add({ severity: 'info', summary: 'Info', detail: 'No se encontraron expedientes con los criterios de búsqueda ingresados' });
        }
      },
      error: (err) => {
        this.isTyping = false;
        this.loaderMessage = '';
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo buscar expedientes. Consulte al Administrador del Sistema' });
        console.error('Error al buscar expedientes', err);
      }
    });
  }

  validarBusquedaExpedientes(): boolean {
    if (!this.fechaInicioExpedientes) {
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una Fecha de Inicio' });
      return false;
    }

    if (!this.fechaFinalExpedientes) {
      this.service.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una Fecha Final' });
      return false;
    }

    if (this.fechaInicioExpedientes > this.fechaFinalExpedientes) {
      this.service.add({ severity: 'error', summary: 'Error', detail: 'La Fecha de Inicio no puede ser mayor a la Fecha Final' });
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

  abrirCalificarDemanda(expediente: any) {
    this.expedienteSeleccionado = expediente;
    this.progresoCalificacion = 0;
    this.cargandoCalificacion = true;
    this.docxBlob = null;
    this.displayCalificarDemanda = true;
    this.iniciarProgreso();
    this.faseAnimacion = 1;
    this.faseTimeout = setTimeout(() => {
      if (this.cargandoCalificacion) this.faseAnimacion = 2;
    }, 30000);

    const body = {
      ...expediente,
      rutaCompleta: `ftp://${expediente.cusuario}:${expediente.cclave}@${expediente.xip}/${expediente.xrutaArchivo}/`,
      xnombreArchivo: null
    };

    this.calificacionSubscription = this.expedientesService.calificarDemanda(body).subscribe({
      next: (blob: Blob) => {
        this.detenerProgreso();
        this.progresoCalificacion = 100;
        this.cargandoCalificacion = false;
        this.docxBlob = blob;
        this.listarDemandasCalificadas();
      },
      error: (err: any) => {
        this.detenerProgreso();
        this.cargandoCalificacion = false;
        this.displayCalificarDemanda = false;
        this.mostrarErrorCalificacion(err);
      }
    });
  }

  private mostrarErrorCalificacion(err: any) {
    const textoBase = 'No se pudo calificar la demanda. Consulte al Administrador del Sistema.';
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
        this.progresoCalificacion = tope;
        return;
      }
      const esperado = (elapsed / duracionMs) * tope;
      const conVariacion = esperado + (Math.random() * 2 - 1); // variación ±1%
      this.progresoCalificacion = Math.floor(
        Math.min(tope, Math.max(this.progresoCalificacion, conVariacion))
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

  cancelarCalificarDemanda() {
    if (this.calificacionSubscription) {
      this.calificacionSubscription.unsubscribe();
      this.calificacionSubscription = null;
    }
    this.displayCalificarDemanda = false;
  }

  cerrarCalificarDemanda() {
    this.detenerProgreso();
    if (this.calificacionSubscription) {
      this.calificacionSubscription.unsubscribe();
      this.calificacionSubscription = null;
    }
    this.docxBlob = null;
    this.progresoCalificacion = 0;
    this.cargandoCalificacion = false;
    this.faseAnimacion = 0;
    this.expedienteSeleccionado = null;
  }

  descargarDemandaCalificada() {
    if (!this.docxBlob || !this.expedienteSeleccionado) return;
    const url = window.URL.createObjectURL(this.docxBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Demanda-Calificada-${this.expedienteSeleccionado.xformato ?? 'expediente'}.docx`;
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

  listarDemandasCalificadas() {
    const body: any = {};
    if (this.filtroFechaInicio) body.fechaInicial = this.formatDate(this.filtroFechaInicio);
    if (this.filtroFechaFin) body.fechaFinal = this.formatDate(this.filtroFechaFin);
    if (this.filtroAnio) body.anio = this.filtroAnio;
    if (this.filtroNroExpediente) body.expNro = this.filtroNroExpediente;

    this.expedientesService.listarDemandasCalificadasAgrupadas(body, this.pageDemandasCalificadas, this.sizeDemandasCalificadas).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.demandasCalificadas = resp.result.content;
          this.totalDemandasCalificadas = resp.result.totalElements;
        }
      },
      error: () => {
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo listar las demandas calificadas.' });
      }
    });
  }

  verDetalle(nunico: number) {
    this.cargandoDetalle = true;
    this.mostrarDetalle = true;
    this.expedienteDetalleInfo = null;
    this.demandasDetalle = [];
    this.expedientesService.listarCalificacionesPorNunico(nunico).subscribe({
      next: (resp) => {
        this.cargandoDetalle = false;
        if (resp.success) {
          this.demandasDetalle = resp.result;
          this.expedienteDetalleInfo = resp.result.length > 0 ? resp.result[0] : null;
        }
      },
      error: () => {
        this.cargandoDetalle = false;
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle de calificaciones.' });
      }
    });
  }

  volverAlListado() {
    this.mostrarDetalle = false;
    this.demandasDetalle = [];
    this.expedienteDetalleInfo = null;
  }

  descargarCalificacionDetalle(id: number, xformato: string) {
    this.expedientesService.descargarCalificacionDocx(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Demanda-Calificada-${xformato}-${id}.docx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el documento.' });
      }
    });
  }

  onPageChangeDemandasCalificadas(event: any) {
    this.pageDemandasCalificadas = event.page;
    this.sizeDemandasCalificadas = event.rows;
    this.listarDemandasCalificadas();
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
