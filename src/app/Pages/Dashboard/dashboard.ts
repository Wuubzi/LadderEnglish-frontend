import { Component, OnInit, ViewChild, ElementRef,inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AprendizService, Aprendiz } from '../../Services/Aprendiz';
import { FichasService, Ficha } from '../../Services/Fichas';
import { ToastrService } from 'ngx-toastr';

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
   private toast = inject(ToastrService);
   private cdRef = inject(ChangeDetectorRef);
  
  activeTab: string = 'aprendices';
  cargando: boolean = false;
  
  // Fichas
  fichas: Ficha[] = [];
  fichaFormulario: Partial<Ficha> = {
    numeroFicha: '',
    nombreFicha: ''
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
    estadoIngles3: 'PENDIENTE'
  };
  mostrarFormularioAprendiz: boolean = false;
  aprendizEditando: Aprendiz | null = null;
  fichaSeleccionada: number = 0;
  
  // Importación Excel
  mostrarModalImportar: boolean = false;
  archivoSeleccionado: File | null = null;
  importando: boolean = false;
  mensajeImportacion: { tipo: 'success' | 'error' | 'warning', texto: string } | null = null;
  
  
  ngOnInit() {
    this.cargarFichas();
  }

  // ==================== MÉTODOS DE CARGA ====================
  
cargarFichas() {
  this.cargando = true;
  this.fichasService.getFichas().subscribe({
    next: (fichas) => {
      this.fichas = fichas;
      this.cargando = false;

      if (this.fichas.length > 0) {
        const primeraFicha = this.fichas[0]; // usa la primera en lugar de random
        this.fichaSeleccionada = primeraFicha.idFicha;

        // Aquí ya puedes cargar los aprendices sin depender de ngAfterViewInit
        this.cargarAprendicesPorFicha(this.fichaSeleccionada);
        this.cdRef.detectChanges(); 
      }
    },
    error: (error) => {
      console.error('Error al cargar fichas:', error);
      this.showErrorToast('Error al cargar las fichas');
      this.cargando = false;
    }
  });
}


 cargarAprendicesPorFicha(idFicha: number) {
  console.log('Cargando aprendices de la ficha:', idFicha);
  this.cargando = true;
  console.log(idFicha)
  this.aprendizService.getAprendices(idFicha).subscribe({
    next: (aprendices) => {
      this.aprendices = aprendices;
      this.aprendicesFiltrados = aprendices;
      this.cargando = false;
      this.cdRef.detectChanges(); // Agregar aquí también
    },
    error: (error) => {
      console.error('Error al cargar aprendices:', error);
      this.showErrorToast('Error al cargar los aprendices');
      this.cargando = false;
      this.cdRef.detectChanges(); // Y aquí por seguridad
    }
  });
}
  
  // ==================== MÉTODOS PARA FICHAS ====================
  
  guardarFicha() {
    if (!this.fichaFormulario.numeroFicha || !this.fichaFormulario.nombreFicha) {
      this.showErrorToast('Por favor complete todos los campos');
      return;
    }
    
    if (this.fichaEditando) {
      // Actualizar ficha existente
      this.fichasService.actualizarFicha(this.fichaEditando.idFicha, this.fichaFormulario).subscribe({
        next: (fichaActualizada: any) => {
          const index = this.fichas.findIndex(f => f.idFicha === this.fichaEditando!.idFicha);
          if (index !== -1) {
            this.fichas[index] = fichaActualizada;
          }
          this.cancelarFormularioFicha();
          this.showToast('Ficha actualizada exitosamente');
        },
        error: (error: any) => {
          console.error('Error al actualizar ficha:', error);
          this.showErrorToast('Error al actualizar la ficha');
        }
      });
    } else {
      // Crear nueva ficha
      this.fichasService.crearFicha(this.fichaFormulario).subscribe({
        next: (nuevaFicha: any) => {
          this.fichas.push(nuevaFicha);
          this.cancelarFormularioFicha();
          this.showToast('Ficha creada exitosamente');
        },
        error: (error: any) => {
          console.error('Error al crear ficha:', error);
          this.showErrorToast('Error al crear la ficha');
        }
      });
    }
  }
  
  editarFicha(ficha: Ficha) {
    this.fichaEditando = ficha;
    this.fichaFormulario = { ...ficha };
    this.mostrarFormularioFicha = true;
  }
  
  
  cancelarFormularioFicha() {
    this.mostrarFormularioFicha = false;
    this.fichaEditando = null;
    this.fichaFormulario = {
      numeroFicha: '',
      nombreFicha: ''
    };
  }
  
  // ==================== MÉTODOS PARA APRENDICES ====================
  
  guardarAprendiz() {
    if (!this.aprendizFormulario.numeroDocumento || !this.aprendizFormulario.nombres || 
        !this.aprendizFormulario.apellidos || !this.aprendizFormulario.idFicha) {
      this.showErrorToast('Por favor complete todos los campos obligatorios');
      return;
    }
    
    if (this.aprendizEditando) {
      // Actualizar aprendiz existente
      this.aprendizService.actualizarAprendiz(this.aprendizEditando.idAprendiz, this.aprendizFormulario).subscribe({
        next: (aprendizActualizado: any) => {
          const index = this.aprendices.findIndex(a => a.idAprendiz === this.aprendizEditando!.idAprendiz);
          if (index !== -1) {
            this.aprendices[index] = aprendizActualizado;
          }
          this.filtrarAprendices();
          this.cancelarFormularioAprendiz();
          this.showToast('Aprendiz actualizado exitosamente');
        },
        error: (error: any) => {
          console.error('Error al actualizar aprendiz:', error);
          this.showErrorToast('Error al actualizar el aprendiz');
        }
      });
    } else {
      // Crear nuevo aprendiz
      this.aprendizService.crearAprendiz(this.aprendizFormulario).subscribe({
        next: (nuevoAprendiz: any) => {
          this.aprendices.push(nuevoAprendiz);
          this.filtrarAprendices();
          this.cancelarFormularioAprendiz();
          this.showToast('Aprendiz creado exitosamente');
        },
        error: (error: any) => {
          console.error('Error al crear aprendiz:', error);
          this.showErrorToast('Error al crear el aprendiz');
        }
      });
    }
  }
  
editarAprendiz(aprendiz: Aprendiz) {
  this.cargando = true;

  this.aprendizService.getAprendizPorId(aprendiz.idAprendiz).subscribe({
    next: (aprendizCompleto) => {
      if (aprendizCompleto.ficha && typeof aprendizCompleto.ficha === 'object') {
        aprendizCompleto.idFicha = aprendizCompleto.ficha.idFicha;
      }

      this.aprendizEditando = aprendizCompleto;
      this.aprendizFormulario = { ...aprendizCompleto };

      // Muestra el formulario primero
      this.mostrarFormularioAprendiz = true;

      // Luego forza Angular a refrescar el DOM
      setTimeout(() => {
        this.cdRef.detectChanges();
      }, 0);

      this.cargando = false;
    },
    error: (error) => {
      console.error('Error al obtener aprendiz:', error);
      this.showErrorToast('No se pudo cargar la información del aprendiz');
      this.cargando = false;
    }
  });
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
    estadoIngles3: 'PENDIENTE'
    };
  }
  
  filtrarAprendices() {
    if (this.fichaSeleccionada === 0) {
      this.aprendicesFiltrados = [...this.aprendices];
    } else {
      this.cargarAprendicesPorFicha(this.fichaSeleccionada);
      this.aprendicesFiltrados = this.aprendices.filter(
        a => a.idFicha === this.fichaSeleccionada
      );
    }
  }
  
  // ==================== MÉTODOS PARA IMPORTAR EXCEL ====================
  
  abrirImportarExcel() {
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
          texto: 'Por favor selecciona un archivo Excel válido (.xlsx o .xls)'
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
    
    this.aprendizService.importarExcel(this.archivoSeleccionado).subscribe({
      next: (response: { mensaje: any; cantidad: any; }) => {
        this.mensajeImportacion = {
          tipo: 'success',
          texto: response.mensaje || `Se importaron ${response.cantidad || 0} aprendices exitosamente`
        };
        
        // Recargar la lista de aprendices
         if (this.fichaSeleccionada) {
          this.cargarAprendicesPorFicha(this.fichaSeleccionada);
        }
        
        setTimeout(() => {
          this.cerrarModalImportar();
        }, 2000);
        
        this.importando = false;
      },
      error: (error: { error: { mensaje: any; }; }) => {
        console.error('Error al importar:', error);
        this.mensajeImportacion = {
          tipo: 'error',
          texto: error.error?.mensaje || 'Error al importar el archivo. Verifica el formato.'
        };
        this.importando = false;
      }
    });
  }
  
  descargarPlantilla() {
    // Esta función ya no necesita XLSX, solo descarga desde el backend
    // O puedes mantener la generación local si prefieres
    window.open(`${this.aprendizService['apiUrl']}/aprendices/plantilla-excel`, '_blank');
  }
  
  // ==================== UTILIDADES ====================
  
  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'CANCELADO': 'bg-red-100 text-red-800',
      'INSCRITO': 'bg-blue-100 text-blue-800',
      'FORMACION': 'bg-yellow-100 text-yellow-800',
      'CERTIFICADO': 'bg-green-100 text-green-800',
      'PENDIENTE': 'bg-gray-100 text-gray-800',
      'PREINSCRITO': 'bg-purple-100 text-purple-800'
    };
    
    return clases[estado] || 'bg-gray-100 text-gray-800';
  }

  showToast(message: string) {
    this.toast.success(message, 'Success');
  }

  showErrorToast(error: string) {
    this.toast.error(error, 'Error');
  }
}