import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { DemandaCalificada } from 'src/app/interfaces/expedientes';

@Component({
  selector: 'app-calificacion-detalle',
  imports: [CommonModule, TableModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './calificacion-detalle.component.html',
  styleUrl: './calificacion-detalle.component.scss'
})
export class CalificacionDetalleComponent implements OnInit {

  nunico: number = 0;
  calificaciones: DemandaCalificada[] = [];
  cargando: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private expedientesService: ExpedientesService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.nunico = Number(this.route.snapshot.paramMap.get('nunico'));
    if (this.nunico) {
      this.cargarCalificaciones();
    }
  }

  cargarCalificaciones() {
    this.cargando = true;
    this.expedientesService.listarCalificacionesPorNunico(this.nunico).subscribe({
      next: (resp) => {
        this.cargando = false;
        if (resp.success) {
          this.calificaciones = resp.result;
        }
      },
      error: () => {
        this.cargando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle de calificaciones.' });
      }
    });
  }

  descargarCalificacion(id: number, xformato: string) {
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
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el documento.' });
      }
    });
  }

  volver() {
    this.location.back();
  }

  get infoExpediente(): DemandaCalificada | null {
    return this.calificaciones.length > 0 ? this.calificaciones[0] : null;
  }
}
