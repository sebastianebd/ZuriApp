import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { type ReplacementRegistration } from '@/types/replacement.types'
import { type IStaff } from '@/types/staff.types'
import { type AuditLog } from '@/types/audit.types'
import * as XLSX from 'xlsx'

// Format Date Helper
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// --- Export 1: Single Replacement Certificate (Preset) ---
export const exportReplacementToPDF = (replacement: ReplacementRegistration) => {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.setTextColor(40, 40, 40)
    doc.text('Detalle de Reemplazo', 105, 20, { align: 'center' })

    doc.setLineWidth(0.5)
    doc.line(20, 25, 190, 25)

    // Info Section
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)

    let y = 40
    const xLabel = 20
    const xValue = 80

    // ID
    doc.setFont('helvetica', 'bold')
    doc.text('ID Negocio:', xLabel, y)
    doc.setFont('helvetica', 'normal')
    doc.text(replacement.id_negocio || '-', xValue, y)
    y += 10

    // Service
    doc.setFont('helvetica', 'bold')
    doc.text('Servicio:', xLabel, y)
    doc.setFont('helvetica', 'normal')
    doc.text(replacement.servicio || '-', xValue, y)
    y += 10

    // Dates
    doc.setFont('helvetica', 'bold')
    doc.text('Periodo:', xLabel, y)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `${formatDate(replacement.fecha_inicio)} - ${formatDate(replacement.fecha_termino)}`,
      xValue,
      y
    )
    y += 10

    // Status
    doc.setFont('helvetica', 'bold')
    doc.text('Estado:', xLabel, y)
    doc.setFont('helvetica', 'normal')
    doc.text(replacement.status || '-', xValue, y)
    y += 15

    // Saliente
    doc.setFontSize(14)
    doc.setTextColor(0, 51, 153) // Dark Blue
    doc.text('Funcionario Saliente', 20, y)
    y += 10
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)

    doc.setFont('helvetica', 'bold')
    doc.text('Nombre:', xLabel, y)
    doc.setFont('helvetica', 'normal')
    doc.text(`${replacement.nombre_saliente} ${replacement.apellido_saliente}`, xValue, y)
    y += 10

    doc.setFont('helvetica', 'bold')
    doc.text('RUT:', xLabel, y)
    doc.setFont('helvetica', 'normal')
    doc.text(replacement.rut_saliente || '-', xValue, y)
    y += 15

    // Entrante
    doc.setFontSize(14)
    doc.setTextColor(0, 102, 51) // Dark Green
    doc.text('Funcionario Entrante', 20, y)
    y += 10
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)

    doc.setFont('helvetica', 'bold')
    doc.text('Nombre:', xLabel, y)
    doc.setFont('helvetica', 'normal')
    doc.text(`${replacement.nombre_entrante} ${replacement.apellido_entrante}`, xValue, y)
    y += 10

    doc.setFont('helvetica', 'bold')
    doc.text('RUT:', xLabel, y)
    doc.setFont('helvetica', 'normal')
    doc.text(replacement.rut_entrante || '-', xValue, y)
    y += 20

    // Footer
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 20, 280)

    // Save
    doc.save(`Reemplazo_${replacement.id_negocio || 'Doc'}.pdf`)
  }

  // --- Export 2: History Report (Filtered Table) ---
export const exportHistoryToPDF = (registros: ReplacementRegistration[], filtros: any) => {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(16)
    doc.text('Reporte de Historial de Reemplazos', 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100)
    const filterText = `Filtros: Servicio: ${filtros.servicio || 'Todos'} | Fecha: ${
      filtros.fechaInicio ? formatDate(filtros.fechaInicio) : 'Inicio'
    } - ${filtros.fechaFin ? formatDate(filtros.fechaFin) : 'Fin'}`
    doc.text(filterText, 14, 28)

    // Table
    const tableColumn = ['ID', 'Saliente', 'Entrante', 'Servicio', 'Inicio', 'Término', 'Estado']
    const tableRows: any[] = []

    registros.forEach((r) => {
      const row = [
        r.id_negocio,
        `${r.nombre_saliente} ${r.apellido_saliente}`,
        `${r.nombre_entrante} ${r.apellido_entrante}`,
        r.servicio,
        formatDate(r.fecha_inicio),
        formatDate(r.fecha_termino),
        r.status
      ]
      tableRows.push(row)
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] }
    })

    doc.save(`Reporte_Historial_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

export const exportUsersToPDF = (users: IStaff[]) => {
      const doc = new jsPDF()

      // Title
      doc.setFontSize(16)
      doc.text('Reporte de Usuarios', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Total de registros: ${users.length}`, 14, 28)

      // Columns
      const tableColumn = ['RUT', 'Nombre', 'Apellido', 'Cargo', 'Servicio', 'Email', 'Estado']
      const tableRows: any[] = []

      users.forEach((u) => {
        const row = [
          u.rut,
          u.firstName,
          u.lastName,
          u.positionId?.name || u.roleId?.name || '-',
          (u as any).servicio || '-', // Servicio is optional in IStaff interface but present in data
          u.email,
          u.isActive ? 'Activo' : 'Inactivo'
        ]
        tableRows.push(row)
      })

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] } // Blue header for users
      })

      doc.save(`Reporte_Usuarios_${new Date().toISOString().slice(0, 10)}.pdf`)
    }
export const exportUsersToExcel = (users: IStaff[]) => {
      // 1. Prepare Data
      const data = users.map((u) => ({
        RUT: u.rut,
        Nombre: u.firstName,
        Apellido: u.lastName,
        Cargo: u.positionId?.name || u.roleId?.name || '-',
        Servicio: (u as any).servicio || '-',
        Email: u.email,
        Telefono: u.phone,
        'Fecha Nacimiento': u.birthDate ? new Date(u.birthDate).toLocaleDateString() : '-',
        Direccion: u.address,
        Ciudad: u.city,
        Estado: u.isActive ? 'Activo' : 'Inactivo'
      }))

      // 2. Create Sheet
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios')

      // 3. Save
      XLSX.writeFile(workbook, `Reporte_Usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`)
    }
    // --- Export 5: Audit Report (PDF) ---
export const exportAuditToPDF = (logs: AuditLog[], filters: any) => {
      const doc = new jsPDF()

      // Title
      doc.setFontSize(16)
      doc.text('Reporte de Auditoría (Logs)', 14, 20)

      doc.setFontSize(10)
      doc.setTextColor(100)
      const filterText = `Filtros: M: ${filters.module || 'Todos'} | A: ${
        filters.action || 'Todos'
      } | Fecha: ${filters.startDate ? formatDate(filters.startDate) : 'Inicio'} - ${
        filters.endDate ? formatDate(filters.endDate) : 'Fin'
      }`
      doc.text(filterText, 14, 28)

      // Columns
      const tableColumn = ['Fecha', 'Usuario', 'Módulo', 'Acción', 'Descripción']
      const tableRows: any[] = []

      logs.forEach((log) => {
        const row = [
          new Date(log.created_at).toLocaleString('es-CL'),
          log.user_name || 'Sistema',
          log.module,
          log.action,
          log.description
        ]
        tableRows.push(row)
      })

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [71, 85, 105] }, // Slate gray
        columnStyles: {
          0: { cellWidth: 30 },
          4: { cellWidth: 'auto' }
        }
      })

      doc.save(`Reporte_Auditoria_${new Date().toISOString().slice(0, 10)}.pdf`)
    }
    // --- Export 6: Audit Report (Excel) ---
export const exportAuditToExcel = (logs: AuditLog[]) => {
      const data = logs.map((log) => ({
        Fecha: new Date(log.created_at).toLocaleString('es-CL'),
        Usuario: log.user_name || 'Sistema',
        Modulo: log.module,
        Accion: log.action,
        Descripcion: log.description,
        Detalles: log.details ? JSON.stringify(log.details) : '-'
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoria')

      XLSX.writeFile(workbook, `Reporte_Auditoria_${new Date().toISOString().slice(0, 10)}.xlsx`)
    }

