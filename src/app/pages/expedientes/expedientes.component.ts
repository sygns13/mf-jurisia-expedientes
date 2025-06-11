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

  documentosFiltrados: Documento[] = [];
  documentos: Documento[] = [];
  documentoSeleccionado: number | null = null;

  buscarExpediente: BusquedaExpediente | null = null
  expedientes: Expediente[] = [];

  displayGenerarDocumentos: boolean = false;

  displayFiltroExpedientes: boolean = false;

  // tipado de documento
  contenidoHTML: string = '';
  contenidoHTMLAnimado: string = '';
  mostrarDialogoPreview: boolean = false;
  velocidadEscritura: number = 2; // milisegundos por caracter

  private isFirstRender: boolean = true;
  private lastScrollHeight: number = 0;

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

    this.isTyping = true;
    this.loaderMessage = 'Buscando el expediente...'

    this.expedientesService.consultaCabExpedientes(this.buscarExpediente).subscribe({
      next: (expedientes: Expediente[]) => {
        this.expedientes = expedientes;
        this.isTyping = false;
        this.loaderMessage = ''
        if(expedientes.length <= 0){
          this.service.add({ severity: 'info', summary: 'Info', detail: 'No se encontraron expedientes con los criterios de búsqueda ingresados' });
        }
      },
      error: (err) => {
        this.isTyping = false;
        this.loaderMessage = ''
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

  actionExpediente(expediente: Expediente){
    console.log(expediente);
    this.tipoDocumentoLoad(expediente);
    this.displayGenerarDocumentos = true;
  }

  closeAntes() {
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

    this.documentoSeleccionado = null;
    this.tipoDocumentoSeleccionado = null;
    this.documentosFiltrados = [];
    this.nunico=expediente.nunico;
    if (expediente) {
      this.tipoDocumentosFiltrados = this.tipoDocumentos.filter(tipoDocumentos => tipoDocumentos.idInstancia === expediente.codigoInstancia);
    } else {
      this.tipoDocumentosFiltrados = [];
    }
  }


  onTipoDocumentoChange(event: any) {
    console.log("Entra Aqui");
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
  if (!codigoTemplate || !this.nunico) return;

  this.isTyping = true;
  this.loaderMessage = 'Preparando documento...'

  this.documentoService.descargarDocx(this.nunico, codigoTemplate).subscribe({
    next: (response: Blob) => {
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nameDoc+'-'+this.nunico+'.docx';
      link.click();
      window.URL.revokeObjectURL(url);
      this.botonLoader=true;
      this.loaderMessage = 'Documento Generado, revise sus descargas'
    },
    error: () => {
      this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el documento.' });
    }
  });
}

descargarDocumentoDirecto() {
  if (!this.tipoDocumentoSeleccionado || !this.documentoSeleccionado) {
      this.service.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Debe seleccionar el tipo de documento y el documento antes de descargar.'
      });
      return;
    }

    this.isTyping = true;
    this.loaderMessage = 'Generando documento...'

  const documento = this.documentos.find(d => d.idDocumento === this.documentoSeleccionado);
  const codigoTemplate = documento?.codigoTemplate;
  const nameDoc = documento?.descripcion;
  if (!codigoTemplate || !this.nunico) return;

  this.documentoService.descargarDocx(this.nunico, codigoTemplate).subscribe({
    next: (response: Blob) => {
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nameDoc+'-'+this.nunico+'.docx';
      link.click();
      window.URL.revokeObjectURL(url);
      this.botonLoader=true;
      this.loaderMessage = 'Documento Generado, revise sus descargas'
    },
    error: () => {
      this.service.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el documento.' });
    }
  });
}

cerrarLoader(){
  this.botonLoader=false;
  this.isTyping = false;
  this.loaderMessage = ''
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

    this.isTyping = true;
    this.loaderMessage = 'Preparando documento...'

    this.documentoService.getDocumentoGenerado(this.nunico, codigoTemplate!).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.contenidoHTML = this.procesarHTML(resp.contentHTML);
          this.contenidoHTMLAnimado = '';
          this.isTypingWord = false;
          
          this.isTyping = false;
          this.loaderMessage = ''

          this.mostrarDialogoPreview = true;
          setTimeout(() => {
            // Pasar el HTML ya procesado a la simulación de escritura
            this.simularEscritura(this.contenidoHTML);
          }, 500); 
        } else {
          this.service.add({ severity: 'warn', summary: 'Advertencia', detail: 'El documento no se generó correctamente.' });
        }
      },
      error: (err) => {
        this.service.add({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el documento.' });
      }
    });
  }

simularEscritura(html: string) {
  this.isTypingWord = true;
  this.contenidoHTMLAnimado = '';
  let i = 0;
  
  this.forceScrollToTop();
  
  const intervalo = setInterval(() => {
    this.contenidoHTMLAnimado += html.charAt(i);
    i++;
    
    if (i > 200) { 
      this.conditionalScroll();
    }
    
    if (i >= html.length) {
      clearInterval(intervalo);
      this.isTypingWord = false;
      
      this.addFullDocumentClass();

      setTimeout(() => this.scrollPreviewBottom(), 500);
    }
  }, this.velocidadEscritura);
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

close() {
  this.displayGenerarDocumentos = false;
  this.mostrarDialogoPreview = false;
  
  this.contenidoHTMLAnimado = '';
  this.isTypingWord = false;

  if (this.contenidoContainer?.nativeElement) {
    this.contenidoContainer.nativeElement.classList.remove('full-document');
  }
}

  private procesarTexto(texto: string): string {
  let textoProcessado = texto;
  
  // 1. PRIMERO: Procesar palabras con dos puntos para crear títulos/secciones
  // Captura palabras que terminan en ":" (pueden ser mayúsculas o minúsculas)
  // Ejemplo: "Tercero:", "Cuarto:", "CONSIDERANDO:", etc.
  textoProcessado = textoProcessado.replace(
    /\b([A-ZÁÉÍÓÚÑÜ][a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]*[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]):\s*/g,
    '<br><strong class="title-section">$1:</strong><br>'
  );
  
  // 2. SEGUNDO: Procesar todas las palabras en MAYÚSCULAS (incluyendo números y caracteres especiales)
  // Este regex captura:
  // - Palabras completamente en mayúsculas
  // - Números mezclados con mayúsculas
  // - Caracteres especiales como guiones en expedientes (ej: "EXP-2024-001")
  textoProcessado = textoProcessado.replace(
    /\b([A-ZÁÉÍÓÚÑÜ0-9]+(?:[-\.\/][A-ZÁÉÍÓÚÑÜ0-9]+)*[A-ZÁÉÍÓÚÑÜ0-9]*)\b(?!\s*<\/strong>)(?!:)/g,
    (match, word) => {
      // Solo aplicar negrita si la palabra tiene al menos 2 caracteres
      // y contiene al menos una letra mayúscula
      if (word.length >= 2 && /[A-ZÁÉÍÓÚÑÜ]/.test(word)) {
        return `<strong>${word}</strong>`;
      }
      return match;
    }
  );
  
  // 3. TERCERO: Procesar casos especiales como números de expediente
  // Ejemplo: "N° 123-2024", "EXP N° 456-2023", etc.
  textoProcessado = textoProcessado.replace(
    /\b(N°?\s*\d+(?:[-\/]\d+)*)\b/gi,
    '<strong>$1</strong>'
  );
  
  // 4. CUARTO: Procesar años (4 dígitos) que no estén ya en negritas
  textoProcessado = textoProcessado.replace(
    /\b(19\d{2}|20\d{2})\b(?![^<]*<\/strong>)/g,
    '<strong>$1</strong>'
  );
  
  // 5. QUINTO: Limpiar casos donde se aplicó negrita múltiples veces
  textoProcessado = textoProcessado.replace(
    /<strong><strong>(.*?)<\/strong><\/strong>/g,
    '<strong>$1</strong>'
  );
  
  // 6. SEXTO: Limpiar múltiples saltos de línea consecutivos
  textoProcessado = textoProcessado.replace(/(<br>\s*){3,}/g, '<br><br>');
  
  // 7. SÉPTIMO: Limpiar saltos de línea al inicio y final
  textoProcessado = textoProcessado.replace(/^(<br>\s*)+/, '');
  textoProcessado = textoProcessado.replace(/(<br>\s*)+$/, '');
  
  return textoProcessado;
}

// También actualiza la función procesarHTML para asegurar la justificación
private procesarHTML(contentHTML: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = contentHTML;
  
  const paragraphs = tempDiv.querySelectorAll('p');
  
  paragraphs.forEach(p => {
    const text = p.textContent || '';
    const processedHTML = this.procesarTexto(text);
    p.innerHTML = processedHTML;
    
    // Aplicar justificación de manera más robusta
    p.style.textAlign = 'justify';
    p.style.setProperty('text-justify', 'inter-word');
    p.style.wordSpacing = 'normal';
    p.style.letterSpacing = 'normal';
  }); 
  
  // Si no hay párrafos, procesar el contenido completo
  if (paragraphs.length === 0) {
    const processedHTML = this.procesarTexto(tempDiv.textContent || '');
    tempDiv.innerHTML = `<p style="text-align: justify; text-justify: inter-word;">${processedHTML}</p>`;
  }
  
  return tempDiv.innerHTML;
}

}
