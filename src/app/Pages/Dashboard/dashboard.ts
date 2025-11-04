import { Component, OnInit, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AprendizService, Aprendiz } from '../../Services/Aprendiz';
import { FichasService, Ficha } from '../../Services/Fichas';
import { ToastrService } from 'ngx-toastr';
import { LocalStorage } from '../../Storage/localStorage';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  private aprendizService = inject(AprendizService);
  private fichasService = inject(FichasService);
  private localStorage = inject(LocalStorage);
  private toast = inject(ToastrService);
  private cdRef = inject(ChangeDetectorRef);

  activeTab: string = '';
  cargando: boolean = false;
  buscarCedula: string = '';
  fichaParaImportar: number = 0;

  // ==================== PAGINACIÓN ====================
  paginaActual: number = 1;
  itemsPorPagina: number = 5;
  totalPaginas: number = 0;
  aprendicesPaginados: Aprendiz[] = [];

  // ==================== SISTEMA DE ROLES ====================
  usuarioActual = {
    rol: 'INSTRUCTOR',
    nombre: 'Usuario',
  };

  // Fichas
  fichas: Ficha[] = [];
  fichasActivas: Ficha[] = [];
  fichasFiltradas: Ficha[] = [];
  buscarFicha: string = '';
  fichaFormulario: Partial<Ficha> = {
    numeroFicha: '',
    nombreFicha: '',
    estado: '',
  };
  mostrarFormularioFicha: boolean = false;
  fichaEditando: Ficha | null = null;

  // Aprendices
  aprendices: Aprendiz[] = [];
  aprendicesFiltrados: Aprendiz[] = [];
  aprendizFormulario: Partial<Aprendiz> = {
    tipoDocumento: '',
    numeroDocumento: 0,
    nombres: '',
    apellidos: '',
    celular: '',
    correo: '',
    estado: '',
    idFicha: 0,
    estadoIngles1: 'PENDIENTE',
    estadoIngles2: 'PENDIENTE',
    estadoIngles3: 'PENDIENTE',
  };
  mostrarFormularioAprendiz: boolean = false;
  aprendizEditando: Aprendiz | null = null;
  fichaSeleccionada: number = 0;

  // Importación Excel
  mostrarModalImportar: boolean = false;
  archivoSeleccionado: File | null = null;
  importando: boolean = false;
  mensajeImportacion: { tipo: 'success' | 'error' | 'warning'; texto: string } | null = null;

 // ==================== MÉTODOS DE PAGINACIÓN ====================

  calcularPaginacion() {
    this.totalPaginas = Math.ceil(this.aprendicesFiltrados.length / this.itemsPorPagina);
    this.actualizarAprendicesPaginados();
  }

  actualizarAprendicesPaginados() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.aprendicesPaginados = this.aprendicesFiltrados.slice(inicio, fin);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarAprendicesPaginados();
    }
  }

  cambiarItemsPorPagina() {
    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  obtenerRangoPaginas(): number[] {
    const rango: number[] = [];
    const maxPaginasVisibles = 5;
    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginasVisibles / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginasVisibles - 1);

    if (fin - inicio < maxPaginasVisibles - 1) {
      inicio = Math.max(1, fin - maxPaginasVisibles + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      rango.push(i);
    }
    return rango;
  }

  // ==================== MÉTODOS DE ROLES ====================

  esInstructor(): boolean {
    return this.usuarioActual.rol === 'INSTRUCTOR';
  }

  esCoordinador(): boolean {
    return this.usuarioActual.rol === 'COORDINADOR';
  }

  exportarAprendicesExcel() {
    if (!this.esCoordinador()) {
      this.showErrorToast('Solo los coordinadores pueden exportar datos');
      return;
    }

    this.aprendizService.exportarAprendiz(this.fichaSeleccionada).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aprendices_${this.fichaSeleccionada}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.showToast('Archivo exportado exitosamente');
      },
      error: (error) => {
        console.error('Error al exportar:', error);
        this.showErrorToast('Error al exportar los aprendices');
      },
    });
  }

  ngOnInit() {
    this.usuarioActual.rol = this.localStorage.getItem('rol') || 'INSTRUCTOR';
    if (this.esCoordinador()) {
      this.activeTab = 'aprendices';
      this.localStorage.setItem('activeTab', 'aprendices');
    } else {
      this.activeTab = this.localStorage.getItem('activeTab') || 'aprendices';
    }

    if (this.activeTab === 'aprendices') {
      this.cargarFichasActivas();
    } else {
      this.cargarFichas();
    }
  }

  // ==================== MÉTODOS DE CARGA ====================

  cargarFichas() {
    this.cargando = true;
    this.fichasService.getFichas().subscribe({
      next: (fichas) => {
        this.fichas = fichas;
        this.fichasFiltradas = fichas;
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar fichas:', error);
        this.showErrorToast('Error al cargar las fichas');
        this.cargando = false;
      },
    });
  }

  cargarFichasActivas() {
    this.cargando = true;
    this.fichasService.getFichaByEstado().subscribe({
      next: (fichas) => {
        this.fichasActivas = fichas;
        this.cargando = false;
        if (this.fichasActivas.length > 0) {
          const primeraFicha = this.fichasActivas[0];
          this.fichaSeleccionada = primeraFicha.idFicha;
          this.cargarAprendicesPorFicha(this.fichaSeleccionada);
        }
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar fichas activas:', error);
        this.showErrorToast('Error al cargar las fichas activas');
        this.cargando = false;
      },
    });
  }

  cerrarSesion() {
    this.localStorage.removeItem('access_token');
    this.localStorage.removeItem('activeTab');
    window.location.reload();
  }

  cargarAprendicesPorFicha(idFicha: number) {
    this.cargando = true;

    this.aprendizService.getAprendices(idFicha).subscribe({
      next: (aprendices) => {
        this.aprendices = aprendices;
        this.aprendicesFiltrados = aprendices;
        this.buscarCedula = '';
        this.paginaActual = 1;
        this.calcularPaginacion();
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar aprendices:', error);
        this.showErrorToast('Error al cargar los aprendices');
        this.cargando = false;
        this.cdRef.detectChanges();
      },
    });
  }

  // ==================== MÉTODOS PARA FICHAS ====================

  guardarFicha() {
    if (!this.esInstructor()) {
      this.showErrorToast('No tienes permisos para realizar esta acción');
      return;
    }

    if (!this.fichaFormulario.numeroFicha || !this.fichaFormulario.nombreFicha) {
      this.showErrorToast('Por favor complete todos los campos');
      return;
    }

    if (this.fichaEditando) {
      this.fichasService
        .actualizarFicha(this.fichaEditando.idFicha, this.fichaFormulario)
        .subscribe({
          next: (fichaActualizada: any) => {
            const index = this.fichas.findIndex((f) => f.idFicha === this.fichaEditando!.idFicha);
            if (index !== -1) {
              this.fichas[index] = fichaActualizada;
            }
            this.cancelarFormularioFicha();
            this.showToast('Ficha actualizada exitosamente');
            this.cargarFichas();
            this.cdRef.detectChanges();
          },
          error: (error: any) => {
            console.error('Error al actualizar ficha:', error);
            this.showErrorToast('Error al actualizar la ficha');
          },
        });
    } else {
      this.fichasService.crearFicha(this.fichaFormulario).subscribe({
        next: (nuevaFicha: any) => {
          this.fichas.push(nuevaFicha);
          this.cancelarFormularioFicha();
          this.showToast('Ficha creada exitosamente');
          this.cargarFichas();
          this.cdRef.detectChanges();
        },
        error: (error: any) => {
          console.error('Error al crear ficha:', error);
          this.showErrorToast('Error al crear la ficha');
        },
      });
    }
  }

  editarFicha(ficha: Ficha) {
    if (!this.esInstructor()) {
      this.showErrorToast('No tienes permisos para editar fichas');
      return;
    }
    this.fichaEditando = ficha;
    this.fichaFormulario = { ...ficha };
    this.mostrarFormularioFicha = true;
  }

  cancelarFormularioFicha() {
    this.mostrarFormularioFicha = false;
    this.fichaEditando = null;
    this.fichaFormulario = {
      numeroFicha: '',
      nombreFicha: '',
      estado: '',
    };
  }

buscarPorFicha() {
  if (this.buscarFicha && this.buscarFicha.trim() !== '') {
    const termino = this.buscarFicha.toLowerCase().trim();
    this.fichasFiltradas = this.fichas.filter((ficha) =>
      ficha.numeroFicha.toString().toLowerCase().includes(termino) ||
      ficha.nombreFicha.toLowerCase().includes(termino)
    );
  } else {
    this.fichasFiltradas = [...this.fichas];
  }
}


  limpiarBusquedaFicha() {
    this.buscarFicha = '';
    this.fichasFiltradas = [...this.fichas];
  }

  // ==================== MÉTODOS PARA APRENDICES ====================

  guardarAprendiz() {
    if (!this.esInstructor()) {
      this.showErrorToast('No tienes permisos para realizar esta acción');
      return;
    }

    if (
      !this.aprendizFormulario.numeroDocumento ||
      !this.aprendizFormulario.nombres ||
      !this.aprendizFormulario.apellidos ||
      !this.aprendizFormulario.idFicha
    ) {
      this.showErrorToast('Por favor complete todos los campos obligatorios');
      return;
    }

    if (this.aprendizEditando) {
      this.aprendizService
        .actualizarAprendiz(this.aprendizEditando.idAprendiz, this.aprendizFormulario)
        .subscribe({
          next: (aprendizActualizado: any) => {
            const index = this.aprendices.findIndex(
              (a) => a.idAprendiz === this.aprendizEditando!.idAprendiz
            );
            if (index !== -1) {
              this.aprendices[index] = aprendizActualizado;
            }
            this.filtrarAprendices();
            this.cancelarFormularioAprendiz();
            this.showToast('Aprendiz actualizado exitosamente');
            this.cargarAprendicesPorFicha(this.fichaSeleccionada);
          },
          error: (error: any) => {
            console.error('Error al actualizar aprendiz:', error);
            this.showErrorToast('Error al actualizar el aprendiz');
          },
        });
    } else {
      this.aprendizService.crearAprendiz(this.aprendizFormulario).subscribe({
        next: (nuevoAprendiz: any) => {
          this.aprendices.push(nuevoAprendiz);
          this.filtrarAprendices();
          this.cancelarFormularioAprendiz();
          this.showToast('Aprendiz creado exitosamente');
          this.cargarAprendicesPorFicha(this.fichaSeleccionada);
        },
        error: (error: any) => {
          console.error('Error al crear aprendiz:', error);
          this.showErrorToast('Error al crear el aprendiz');
        },
      });
    }
  }

  editarAprendiz(aprendiz: Aprendiz) {
    if (!this.esInstructor()) {
      this.showErrorToast('No tienes permisos para editar aprendices');
      return;
    }

    this.cargando = true;
    this.aprendizService.getAprendizPorId(aprendiz.idAprendiz).subscribe({
      next: (aprendizCompleto) => {
        if (aprendizCompleto.ficha && typeof aprendizCompleto.ficha === 'object') {
          aprendizCompleto.idFicha = aprendizCompleto.ficha.idFicha;
        }
        this.aprendizEditando = aprendizCompleto;
        this.aprendizFormulario = { ...aprendizCompleto };
        this.mostrarFormularioAprendiz = true;
        setTimeout(() => {
          this.cdRef.detectChanges();
        }, 0);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener aprendiz:', error);
        this.showErrorToast('No se pudo cargar la información del aprendiz');
        this.cargando = false;
      },
    });
  }

  limpiarBusqueda() {
    this.buscarCedula = '';
    this.filtrarAprendices();
  }

  cancelarFormularioAprendiz() {
    this.mostrarFormularioAprendiz = false;
    this.aprendizEditando = null;
    this.aprendizFormulario = {
      tipoDocumento: '',
      numeroDocumento: 0,
      nombres: '',
      apellidos: '',
      celular: '',
      correo: '',
      estado: '',
      idFicha: 0,
      estadoIngles1: 'PENDIENTE',
      estadoIngles2: 'PENDIENTE',
      estadoIngles3: 'PENDIENTE',
    };
  }

  filtrarAprendices() {
    if (this.fichaSeleccionada === 0) {
      this.aprendicesFiltrados = [...this.aprendices];
    } else {
      this.cargarAprendicesPorFicha(this.fichaSeleccionada);
      this.aprendicesFiltrados = this.aprendices.filter(
        (a) => a.idFicha === this.fichaSeleccionada
      );
    }
    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  onFichaChange() {
    if (this.fichaSeleccionada && this.fichaSeleccionada !== 0) {
      this.cargarAprendicesPorFicha(this.fichaSeleccionada);
    } else {
      this.aprendicesFiltrados = [...this.aprendices];
      this.paginaActual = 1;
      this.calcularPaginacion();
    }
  }

  buscarPorCedula() {
    if (this.buscarCedula && this.buscarCedula.trim() !== '') {
      this.aprendicesFiltrados = this.aprendices.filter((aprendiz) =>
        aprendiz.numeroDocumento.toString().includes(this.buscarCedula.trim())
      );
    } else {
      this.aprendicesFiltrados = [...this.aprendices];
    }
    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  // ==================== MÉTODOS PARA IMPORTAR EXCEL ====================

  abrirImportarExcel() {
    if (!this.esInstructor()) {
      this.showErrorToast('No tienes permisos para importar datos');
      return;
    }
    this.mostrarModalImportar = true;
    this.mensajeImportacion = null;
  }

  cerrarModalImportar() {
    this.mostrarModalImportar = false;
    this.archivoSeleccionado = null;
    this.mensajeImportacion = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'xlsx' || extension === 'xls') {
        this.archivoSeleccionado = file;
        this.mensajeImportacion = null;
      } else {
        this.mensajeImportacion = {
          tipo: 'error',
          texto: 'Por favor selecciona un archivo Excel válido (.xlsx o .xls)',
        };
        input.value = '';
      }
    }
  }

  eliminarArchivo() {
    this.archivoSeleccionado = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  importarExcel() {
    if (!this.archivoSeleccionado) return;

    this.importando = true;
    this.mensajeImportacion = null;

    this.aprendizService.importarExcel(this.archivoSeleccionado, this.fichaSeleccionada).subscribe({
      next: (response: { mensaje: any; cantidad: any }) => {
        this.mensajeImportacion = {
          tipo: 'success',
          texto: response.mensaje || `Se importaron los aprendices exitosamente`,
        };

        this.toast.success(`Se importaron los aprendices exitosamente`, 'success');

        this.cargarAprendicesPorFicha(this.fichaSeleccionada);
        this.cerrarModalImportar();
        this.importando = false;
      },
      error: (error: { error: { mensaje: any } }) => {
        console.error('Error al importar:', error);
        this.mensajeImportacion = {
          tipo: 'error',
          texto: error.error?.mensaje || 'Error al importar el archivo. Verifica el formato.',
        };
        this.importando = false;
      },
    });
  }

  descargarPlantilla() {
    window.open(`${this.aprendizService['apiUrl']}/aprendices/plantilla-excel`, '_blank');
  }

  // ==================== UTILIDADES ====================

  cambiarTab(tab: string) {
    if (this.esCoordinador() && tab !== 'aprendices') {
      this.showErrorToast('No tienes permisos para acceder a esta sección');
      return;
    }

    this.activeTab = tab;
    this.localStorage.setItem('activeTab', tab);

    if (tab === 'aprendices') {
      this.cargarFichasActivas();
    } else if (tab === 'fichas') {
      this.cargarFichas();
    }
  }

  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      CANCELADO: 'bg-red-100 text-red-800',
      INSCRITO: 'bg-blue-100 text-blue-800',
      FORMACION: 'bg-yellow-100 text-yellow-800',
      CERTIFICADO: 'bg-green-100 text-green-800',
      PENDIENTE: 'bg-gray-100 text-gray-800',
      PREINSCRITO: 'bg-purple-100 text-purple-800',
    };

    return clases[estado] || 'bg-gray-100 text-gray-800';
  }

  getEstadoFicha(estado: string): string {
    const clases: { [key: string]: string } = {
      inactivo: 'bg-red-100 text-red-800',
      activo: 'bg-green-100 text-green-800',
    };
    return clases[estado] || 'bg-gray-100 text-gray-800';
  }

  getFichasParaMostrar(): Ficha[] {
    return this.activeTab === 'aprendices' ? this.fichasActivas : this.fichas;
  }

  showToast(message: string) {
    this.toast.success(message, 'Success');
  }

  showErrorToast(error: string) {
    this.toast.error(error, 'Error');
  }
}